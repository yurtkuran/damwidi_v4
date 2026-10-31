# `returnIntraDayData` Map-Based Migration Plan

## Revised migration plan

The endpoint decomposition remains, but the shared in-memory market snapshot becomes Phase 1 infrastructure rather than a later optimization.

## Phase 0: Lock down behavior and fixtures

Before changing provider behavior:

- Capture Polygon market-status and batch fixtures for open, premarket, after-hours, and closed sessions.
- Capture missing-symbol and Yahoo fallback cases.
- Capture representative holdings, cash, and latest `data_value` rows.
- Record the current five-field DAM quote response.
- Confirm the Polygon account's rate limits, snapshot entitlement, and data delay externally.
- Decide whether provider failure should continue returning an error or may return explicitly marked stale data.

Initial recommendation: preserve existing failure behavior; add stale-on-error only as a separately approved enhancement.

## Phase 1: Shared market snapshot foundation

### 1. Extend the existing Polygon service

Extend `services/polygon.js` with:

- `getMarketStatus()`
- `getBatchSnapshots(symbols)`
- Response normalization
- Existing single-symbol `quote()` retained for compatibility
- Consistent provider errors

Do not introduce another provider framework or dependency.

### 2. Add the in-process cache

Create a module-level cache containing:

```js
{
    marketStatus: {
        value,
        fetchedAt,
        expiresAt
    },
    snapshot: {
        quotes: new Map(),
        marketStatus,
        fetchedAt,
        expiresAt,
        complete,
        excludedSymbols
    },
    refreshPromise: null
}
```

The `Map` is process-local and intentionally non-persistent:

- Shared by all requests handled by the Node process.
- Lost on deployment or restart.
- Repopulated by the first request.
- Suitable for the initial single-container DigitalOcean deployment.

### 3. Establish the canonical symbol universe

Build each complete cached snapshot from:

- Current `S`, `I`, and `K` symbols in `data_performance`.
- QQQ and DIA for Dashboard index cards.
- SPY, guaranteed even if its database classification changes.

The current expected size is approximately 29 symbols.

The universe should be loaded from MySQL rather than permanently hardcoded, with Dashboard-only index additions kept in configuration or a clearly named constant.

### 4. Add `MarketSnapshotService`

Responsibilities:

- Determine current market session.
- Check snapshot freshness.
- Return a cached snapshot when sufficiently recent.
- Start one batch refresh when stale.
- Let concurrent callers await the same `refreshPromise`.
- Normalize prices into one internal representation.
- Apply the Yahoo fallback for missing symbols.
- Track excluded symbols and completeness.
- Project requested symbols from the complete cached `Map`.

Conceptual interface:

```js
getMarketSnapshot({
    symbols,
    freshness
});

getQuote(symbol, {
    freshness
});
```

Business services should receive the resulting snapshot rather than independently calling Polygon.

### 5. Implement session-aware freshness

Initial policy:

| Session | Snapshot TTL | Status TTL |
|---|---:|---:|
| Market open | 15 seconds | 30 seconds |
| Premarket | 60 seconds | 30 seconds |
| After hours | 60 seconds | 60 seconds |
| Closed weekday | 15 minutes | 5 minutes |
| Weekend/holiday | 1 hour | 30 minutes |

Premarket should preserve legacy behavior by building prices from stored `data_performance.1day` and `2day` values.

### 6. Add cache observability

Log operational metadata without logging credentials or entire responses:

- Cache hit or miss.
- Snapshot age.
- Refresh duration.
- Symbol count.
- Polygon request count.
- Fallback count.
- Excluded symbols.
- Provider failures.
- Concurrent requests coalesced.

This is necessary to confirm that decomposition reduces provider traffic in production.

## Phase 2: Migrate the DAM quote

Implement reusable `portfolioValuation` functionality:

- Load current holdings and cash.
- Load the latest persisted DAM value and total shares.
- Use `MarketSnapshotService` for prices.
- Calculate current value, previous value, change, and percentage change.

Replace only the DAM branch of:

```text
GET /api/marketData/quote/:symbol
```

Preserve:

- `GET /api/marketData/quote/DAM`
- `auth`, `ensureVerified`
- Existing five-field response
- Existing 401 and 500 behavior
- Non-DAM quote behavior

Response:

```json
{
  "symbol": "DAM",
  "latestPrice": 478591.88757,
  "change": 1347.5492016440886,
  "changePercent": 0.0028,
  "previousClose": 477244.3383683559
}
```

During this transitional phase, the legacy Dashboard request and the Node DAM request cannot share a cache because PHP and Node are separate processes. This does not create a new duplication—the current Dashboard already invokes `returnIntraDayData` twice—but the duplication remains until Dashboard migrates.

## Phase 3: Add lazy position performance

Add:

```text
GET /api/damwidi/positionPerformance/:symbol
Middleware: auth, ensureMember
```

Implement:

- Symbol validation and normalization.
- Buy-transaction loading for one symbol.
- Split loading for one symbol.
- Historical SPY closes from MySQL.
- Purchase-basis and split calculations.
- Current symbol and SPY prices from `MarketSnapshotService`.

The endpoint must not unconditionally refresh Polygon. It should normally reuse the snapshot loaded by the parent page.

Add a client-side per-symbol cache so collapsing and reopening a row does not repeat the API request.

During the transition, legacy `performanceData` may still be returned but the expanded component should prefer the new per-symbol state.

## Phase 4: Migrate Allocation

Add:

```text
GET /api/damwidi/allocationData
Middleware: auth, ensureMember
```

The service should:

1. Obtain one shared market snapshot.
2. Calculate DAM valuation from the same snapshot.
3. Calculate current allocation and sector summaries.
4. Return only fields used by Allocation.
5. Use lazy `positionPerformance/:symbol` for expanded rows.

Only held positions and SPY materially require current prices, but using the canonical cached snapshot avoids a separate upstream refresh.

Once Allocation uses these endpoints:

- Stop calling `/api/damwidi/intraDayData` from the Allocation page.
- Remove its dependency on eager `performanceData`.
- Preserve visible ordering, amounts, formatting, and calculations.

## Phase 5: Migrate Dashboard

Add:

```text
GET /api/damwidi/dashboardData
Middleware: auth
```

Dashboard data should be assembled from one shared snapshot and include:

- `asOf`.
- DAM fund quote.
- SPY, QQQ, and DIA initial quotes.
- Market movers.
- Allocation summary.
- Member holdings projection.
- Data-quality status.

Recommended response addition:

```json
{
  "indexQuotes": {
    "DAM": {},
    "SPY": {},
    "QQQ": {},
    "DIA": {}
  }
}
```

Update `IndexCard` to accept its initial quote from `dashboardData` instead of making four independent HTTP requests.

Finnhub WebSocket trades can continue updating the displayed prices every second. WebSocket activity does not affect Polygon usage.

Role behavior must remain explicit:

- All authenticated users receive the permitted public Dashboard projection.
- Only members receive detailed holdings.
- Do not expose sensitive amounts or shares accidentally.

Once Dashboard migrates, a typical page load should require at most:

```text
1 Polygon market-status request
1 Polygon batch snapshot
```

Position expansion should normally add zero Polygon requests.

## Phase 6: Retire the oversized endpoint

Retire `/api/damwidi/intraDayData` only after:

- DAM quote no longer calls PHP.
- Dashboard uses `dashboardData`.
- Allocation uses `allocationData`.
- Both expandable workflows use `positionPerformance/:symbol`.
- Repository search finds no remaining consumer.
- Production logs confirm no remaining traffic.
- Polygon telemetry confirms expected request reduction.
- Member and non-member workflows pass browser validation.

Do not delete shared legacy PHP helpers merely because this endpoint is retired; other PHP workflows may still use them.

## Proposed module structure

Following the existing flat service convention:

```text
services/
  polygon.js
  marketSnapshotCache.js
  marketSnapshot.js
  portfolioRepository.js
  portfolioValuation.js
  allocation.js
  positionPerformance.js
  dashboardData.js
  allocationData.js
```

Existing modules to reuse or extend:

```text
services/marketDataRepository.js
services/marketCalculations.js
models/History.model.js
models/Value.model.js
models/Sector.model.js
models/Transaction.model.js
middleware/auth.js
routes/marketData.js
routes/damwidi.js
```

Model mappings must be verified before relying on them for intraday calculations.

## Required cache tests

The cache foundation should be verified independently:

- Fresh cache returns without Polygon.
- Stale cache triggers one refresh.
- Ten simultaneous requests trigger one refresh.
- Dashboard, Allocation, and DAM receive values from the same snapshot.
- Symbol projections do not mutate the cached `Map`.
- Open, premarket, after-hours, closed, weekend, and holiday policies work.
- Process restart produces one safe cold refresh.
- Missing symbols invoke Yahoo once per symbol, not once per consumer.
- Failed refresh clears `refreshPromise`.
- A later request can retry after failure.
- Cache never performs database writes.
- No credentials or full provider responses appear in logs.

## Recommended implementation order

1. Polygon status and batch support.
2. `MarketSnapshotCache`.
3. `MarketSnapshotService`.
4. Portfolio repository and valuation.
5. DAM quote migration.
6. Position-performance endpoint.
7. Allocation endpoint and frontend.
8. Dashboard endpoint and frontend.
9. Legacy endpoint retirement.

The immediate work on `feature/migrate-dam-quote` should cover steps 1 through 5. This gives the DAM migration the shared cache foundation that every subsequent endpoint will reuse.
