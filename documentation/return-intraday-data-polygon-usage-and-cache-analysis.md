# `returnIntraDayData` Polygon Usage and Cache Analysis

## Executive summary

If each decomposed endpoint independently retrieves market status and prices, Polygon usage could multiply significantly.

A shared `MarketSnapshotService` with an in-process cache and single-flight refresh should be implemented as a foundational part of the decomposition, not added later as an optimization.

## 1. Current Polygon usage

Each `returnIntraDayData` call follows this provider path:

```text
GET Polygon /v1/marketstatus/now
        |
        +-- Premarket:
        |     use persisted data_performance values
        |
        +-- Otherwise:
              GET Polygon /v2/snapshot/locale/us/markets/stocks/tickers
                    |
                    +-- one AWS/Yahoo request per missing symbol
```

### Normal request count

| Market state | Polygon calls |
|---|---:|
| Regular market open | 2 |
| After hours/extended hours | 2 |
| Fully closed | 2 |
| Premarket (`earlyHours=true`) | 1 |

The two normal calls are:

1. Market status.
2. One batch snapshot.

Quotes are not retrieved individually. The batch currently contains 27 symbols:

- 11 sectors
- 5 indexes
- 11 stocks

Sixteen currently have nonzero holdings. `DAM` is calculated locally as a synthetic 28th row and is never requested from Polygon.

### Reuse inside the response

The one batch result is transformed into `heatMapData`, then reused by:

- `graphHeatMap`
- `portfolioTable`
- `allocationTable`
- `performanceData`
- `heatMapData`
- `intraDay`
- DAM portfolio valuation and gain calculations

Therefore, the oversized endpoint performs one provider snapshot and reuses it effectively, even though it performs substantial unnecessary database and calculation work.

### Existing cache or persistence

There is no intraday provider cache.

- Polygon helper calls use `saveData=false`.
- Results are not persisted.
- No in-memory Node or PHP cache exists.
- `data_performance.previous`, `1day`, and `2day` are persisted daily/session reference values, not an intraday cache.
- `data_value` contains persisted DAM values but is not a current-price cache.

During premarket, PHP synthesizes the snapshot from `data_performance.1day` and `2day`, so only market status is requested.

### Yahoo fallback

If Polygon omits a symbol:

- PHP makes one AWS API Gateway/Yahoo request for that symbol.
- It does not make another Polygon request.
- Multiple missing symbols produce multiple Yahoo requests.

The fallback implementation is defective:

- Excluded-symbol handling uses `array_push` incorrectly.
- After a successful Yahoo result, the code still attempts to read Polygon-only `prevDay` and `updated` fields.

This should be corrected through normalized provider results, but that is an explicit behavior correction requiring tests and approval.

## 2. Price requirements after decomposition

| Endpoint | Current-price need | Symbols |
|---|---|---|
| `/api/marketData/quote/DAM` | Yes | Held positions, cash locally, persisted DAM baseline |
| `/api/damwidi/dashboardData` | Yes | All 27 tracked symbols for movers; held positions for valuation; SPY; ideally QQQ and DIA for cards |
| `/api/damwidi/allocationData` | Yes | Held positions and SPY; zero-share rows do not need live prices |
| `/api/damwidi/positionPerformance/:symbol` | Yes, but not necessarily freshly fetched | Requested symbol and SPY |
| Historical purchase calculations | No provider needed | Transactions, splits, and historical SPY data are in MySQL |

All four proposed endpoints overlap substantially:

- Every DAM valuation needs all held prices.
- Dashboard contains all held prices.
- Allocation needs essentially the same held snapshot.
- Position performance needs a subset already present in either page's snapshot.

## 3. Current frontend request baseline

The current Dashboard already makes more Polygon calls than one might expect:

- `/api/damwidi/intraDayData`: 2 Polygon calls.
- `/api/marketData/quote/DAM`: invokes the full PHP workflow again, adding 2 calls.
- SPY, QQQ, and DIA cards: one individual Polygon snapshot each, adding 3 calls.
- Finnhub WebSocket activity: no Polygon calls.
- Expanded-position candlesticks: IEX, not Polygon.

Typical Dashboard mount: approximately **7 Polygon requests** outside premarket.

The current Allocation page makes one full legacy request.

Typical Allocation mount: approximately **2 Polygon requests**.

Expanding rows currently adds no Polygon calls because all performance data is calculated eagerly.

## 4. Naive decomposed usage

These estimates assume each new endpoint independently requests market status and one batch.

### Dashboard

If `dashboardData` supplies the DAM quote but SPY, QQQ, and DIA remain separate:

```text
dashboardData             2
SPY/QQQ/DIA cards         3
each expanded position   +2
```

That produces:

- No expansions: 5 calls.
- Three expansions: 11 calls.

If the DAM card still independently calls `/quote/DAM`, add another 2:

- No expansions: 7 calls.
- Three expansions: 13 calls.

### Allocation

```text
allocationData             2
each expanded position    +2
```

That produces:

- No expansions: 2 calls.
- Three expansions: 8 calls.
- Refresh after the equivalent freshness period: potentially another 2.

### Simultaneous endpoint requests

Without sharing:

```text
dashboardData      2
allocationData     2
DAM quote          2
--------------------
Total              6
```

These requests could all occur within milliseconds while retrieving substantially overlapping prices.

Decomposition can therefore produce a threefold increase for overlapping page/API requests and a larger increase when several positions are expanded.

## 5. Recommended cache architecture

Use a hybrid cached application snapshot:

```text
Dashboard
Allocation
DAM quote
Position performance
General quote routes, where appropriate
        |
        v
MarketSnapshotService
        |
        +-- market-status cache
        +-- normalized per-symbol Map
        +-- snapshot metadata/asOf
        +-- one in-flight refresh Promise
        |
        +-- Polygon status
        +-- Polygon batch snapshot
        +-- Yahoo fallback
```

### Recommended granularity

The primary cache should represent one canonical Damwidi market snapshot containing:

- All 27 tracked symbols.
- QQQ and DIA for Dashboard cards.
- Market status.
- Fetch timestamp and price timestamp.
- Normalized current/previous prices.
- Provider and data-quality metadata.

That is only about 29 symbols and still uses one Polygon batch request.

Internally, quotes should be stored in a symbol-keyed `Map`, allowing consumers to request projections:

```js
snapshot.get('SPY');
snapshot.select(heldSymbols);
snapshot.select(['ATRO', 'SPY']);
```

This combines the advantages of both approaches:

- Snapshot-level refresh prevents overlapping endpoints from making separate batch requests.
- Per-symbol access prevents business services from depending on an oversized response.
- An ad hoc symbol cache can handle symbols outside the canonical universe if the general quote route is integrated later.

A collection of completely independent per-symbol caches is not recommended because refreshing 29 stale symbols could accidentally become 29 upstream calls. Named whole-response caches for Dashboard and Allocation are also unsuitable because their overlapping prices would be duplicated.

## 6. Cache location

For the initial single-container DigitalOcean deployment, use process memory.

Recommended:

- Module-level `Map`.
- Bounded canonical symbol universe.
- No new cache dependency.
- Cache lost on restart, followed by one cold refresh.

Not recommended initially:

- **LRU cache:** unnecessary for approximately 29 known symbols.
- **Redis:** unnecessary for one process and one container.
- **Database-backed cache:** adds writes, latency, schema management, and cleanup.
- **Existing tables as an intraday cache:** they contain daily/session reference data, not normalized live snapshots.

Redis becomes appropriate if the application later runs multiple Node replicas or processes. Without Redis, each replica would maintain a separate cache and make its own Polygon requests.

## 7. Freshness policy

Market status and price snapshots should have separate expirations.

| Session | Price freshness | Market-status freshness | Reason |
|---|---:|---:|---|
| Regular open | 15 seconds | 30 seconds | REST data seeds the page; Finnhub WebSocket supplies second-by-second Dashboard updates |
| Premarket | 60 seconds for synthesized result | 30 seconds | Legacy behavior uses stored `1day`/`2day` values; status must detect the opening transition |
| After hours | 60 seconds | 60 seconds | Prices can change, but less frequently than regular-session display needs |
| Closed weekday | 15 minutes | 5 minutes | Snapshot values are normally stable, while status should still detect transitions |
| Weekend/holiday | 1 hour | 30 minutes | Prices remain unchanged; repeated upstream requests provide little value |

Consumer-specific tolerance should be layered on top:

- Dashboard: normal session policy.
- DAM quote: normal session policy.
- Allocation: may accept 30-second prices while open.
- Position performance: may accept 60-second prices while open and several minutes outside market hours.

A stricter consumer can refresh the shared snapshot. Less-sensitive consumers reuse that newer result.

These values should be configuration constants so they can be tuned after observing production traffic.

## 8. Concurrent stale requests

Use request coalescing with one in-flight refresh Promise.

Conceptually:

```js
if (cacheIsFresh) {
    return cachedSnapshot;
}

if (refreshPromise) {
    return refreshPromise;
}

refreshPromise = refreshSnapshot();

try {
    return await refreshPromise;
} finally {
    refreshPromise = null;
}
```

For this application, refreshing the complete canonical universe is simpler than dynamically coordinating overlapping symbol subsets.

If Dashboard, Allocation, and DAM requests arrive simultaneously:

- The first request starts one status/snapshot refresh.
- The other requests await the same Promise.
- Total provider use is at most two Polygon calls, not six.

Stale-while-revalidate should not be part of the initial implementation. Blocking on the shared refresh more closely preserves current behavior and is easier to validate. Returning stale data after a provider failure could be valuable, but it would be a behavior change and should include an explicit `stale`/`asOf` indication.

Yahoo fallbacks should also be coalesced and briefly negative-cached so several simultaneous requests do not all retry a missing symbol.

## 9. Position performance

`positionPerformance/:symbol` should not unconditionally call Polygon when a row is expanded.

It needs:

- Current and previous price for the requested symbol.
- Current SPY price.
- Buy transactions from MySQL.
- Split records from MySQL.
- Historical SPY closes from MySQL.

When opened from Dashboard or Allocation, the symbol and SPY should already be in the shared snapshot. The endpoint should reuse them.

Only a cold cache or sufficiently stale snapshot should cause a provider refresh. Reopening the same row should additionally reuse client Redux state for that symbol.

The historical transaction, split, and SPY calculations never require Polygon.

## 10. Polygon limits and cost

The repository contains a Polygon credential but no plan name, quota, rate-limit configuration, or request-usage telemetry. The account tier cannot be determined from the application.

Before deployment, verify externally in the Polygon account:

- Allowed requests per minute.
- Monthly quota or overage model.
- Whether full batch snapshots are included.
- Real-time versus delayed data entitlement.
- Concurrent request rules.
- Usage reporting and alerting.

Even if the account has generous limits, caching remains worthwhile because it reduces latency and prevents request bursts.

At a continuously active 15-second refresh cadence, a separated status cache and batch cache would produce roughly:

- Four batch requests per minute.
- Approximately two status requests per minute.

Actual usage should be much lower because the current React application has no periodic REST refresh. Dashboard's one-second updates come from Finnhub WebSocket traffic, not Polygon.

## 11. Concrete Node structure

Following the project's existing flat `services/` convention:

```text
services/
  polygon.js
      quote()
      marketStatus()
      batchSnapshots()
      normalization

  marketSnapshotCache.js
      cached status
      cached canonical snapshot
      per-symbol Map
      expiration checks
      in-flight refresh Promise

  marketSnapshot.js
      determine requested/canonical universe
      select session behavior
      obtain cached or refreshed snapshot
      apply Yahoo fallback
      track excluded symbols
      return projections by symbol

  portfolioValuation.js
      holdings + cash valuation
      DAM current/previous values
      fund quote projection

  allocation.js
      allocation and sector-summary calculations

  positionPerformance.js
      transaction/split/history calculations
      cached current-price projection
```

The existing `services/polygon.js` should be extended rather than replaced with a new provider framework.

## 12. Final recommendations

1. Naive decomposition would increase Polygon calls.
2. Overlapping endpoints could increase calls from 2 to 6 per request burst; expanded rows could increase them further.
3. Current prices should be cached locally.
4. Cache one normalized canonical market snapshot with per-symbol access.
5. Use an in-process `Map` for the single-container deployment.
6. Apply session-aware TTLs, with stricter freshness for Dashboard/DAM and relaxed freshness for allocation/performance.
7. Use one shared in-flight refresh Promise.
8. DAM quote, Dashboard, Allocation, and position performance should all use `MarketSnapshotService`.
9. Position performance's historical work must not call Polygon; row expansion should normally reuse the page snapshot.
10. The endpoint boundaries do not need to be abandoned, but the migration plan should be revised so the shared cached snapshot service is implemented in Phase 1.

The proposed `dashboardData` response should also include initial DAM, SPY, QQQ, and DIA quotes. This would let Dashboard replace four independent `IndexCard` requests with one batch-backed response. Finnhub WebSocket trades can continue updating those values afterward.
