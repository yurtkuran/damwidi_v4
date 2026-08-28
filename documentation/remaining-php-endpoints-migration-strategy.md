# Remaining PHP Endpoints Migration Strategy

The four endpoints should not be migrated as one unit: two are simple projections, one is a deterministic historical calculation, and one is a large live-market orchestration workflow.

## Endpoint overview

| Legacy endpoint | Current Node-facing endpoint | Scope | External provider |
|---|---|---|---|
| `returnDamwidiOHLC` | `/api/alphaVantage/daily/DAM` | One query plus formatting | None |
| `returnSectorTimeframePerformanceData` | `/api/damwidi/timeframeData` | One query; v4 is a keyed projection | None |
| `returnAboveBelow` | `/api/damwidi/aboveBelowData/:timeframe` | Historical queries and calculations | None |
| `returnIntraDayData` | `/api/damwidi/intraDayData` and DAM quote branch | Portfolio reconstruction and live pricing | Polygon and AWS/Yahoo fallback |

All direct PHP endpoints are selected through:

```text
GET /damwidiMain.php?mode=<endpoint>
```

PHP does not enforce GET, but GET is the intended method. Direct PHP endpoints have no authentication. Authentication and authorization are applied by the current Node proxy routes.

## 1. `returnDamwidiOHLC`

### Request contract

Legacy URL:

```text
GET http://www.damwidi.com/damwidiMain.php?mode=returnDamwidiOHLC
```

Optional common parameters:

- `verbose=1`: emits an HTML `<pre>` dump instead of JSON.
- `debug=1`: passed to the function but unused.

No headers, request body, path parameters, or endpoint-specific query parameters are consumed.

Current Node-facing URL:

```text
GET /api/alphaVantage/daily/DAM
x-auth-token: <JWT>
```

The generic route supports other symbols through Alpha Vantage, but `DAM` is currently proxied to PHP. It applies `auth` without a role guard.

### Execution path

```text
damwidiMain.php
  → init.php
  → returnDamwidiOHLC()
    → connect()
    → SELECT from data_value
    → round OHLC values
    → json_encode()
```

Implementation: `php/damwidiUpdateValue.php`, beginning at line 315.

`returnDamwidiOHLC()` itself is exclusive to this endpoint. `connect()` and `show()` are shared throughout the legacy application.

### Database access

```sql
SELECT `date`, `open`, `high`, `low`, `close`
FROM `data_value`
ORDER BY `date` DESC
```

Only `data_value` is read. There are no writes.

### Configuration and external services

Used indirectly through the shared bootstrap:

- Environment-selected MySQL credentials.
- `ENV`.
- `LOGTAIL_TOKEN`, although no log is emitted.

No external API is called.

### Business rules

- Results are newest first.
- Dates become object keys.
- Each OHLC value is rounded to two decimals.
- The response deliberately follows Alpha Vantage's daily-series naming.
- There is no `Meta Data` section.
- Duplicate dates, if possible, would overwrite the earlier value under the same JSON key.

### Response

Verified live response:

```json
{
  "Time Series (Daily)": {
    "2026-08-24": {
      "1. open": 41.79,
      "2. high": 41.91,
      "3. low": 41.24,
      "4. close": 41.48
    }
  }
}
```

Characteristics:

- OHLC values are JSON numbers.
- Date keys are `YYYY-MM-DD`.
- Dates are newest first.
- Valid PHP response is `200` with `text/html; charset=UTF-8`.
- The Node proxy re-emits it as JSON.

The live response contained 3,055 candles.

### Errors and side effects

There is no controlled PHP error handling. Database/bootstrap failures may generate warnings, HTML, or a 500 response. An empty table returns `[]` because `$damwidiOHLC` is initialized as an empty PHP array.

No endpoint-level logging, writes, messaging, or caching occurs.

### Node integration

Reuse:

- `routes/alphaVantage.js`
- `models/Value.model.js`
- Existing `auth` middleware
- Existing `try/catch`, `console.error`, and `500 "server error"` behavior

The existing `/api/damwidi/history` query accesses the same underlying table but returns a different ascending array format. It cannot replace this endpoint's Alpha Vantage-compatible response.

## 2. `returnSectorTimeframePerformanceData`

### Request contract

Legacy URL:

```text
GET http://www.damwidi.com/damwidiMain.php
    ?mode=returnSectorTimeframePerformanceData
    &version=v4
```

Parameters:

- `version`: optional, defaults to `v2`.
- `timeframe`: required only for v2.
- `verbose=1`: diagnostic HTML instead of JSON.
- `debug=1`: passed but unused.

Current Node-facing URL:

```text
GET /api/damwidi/timeframeData
x-auth-token: <JWT>
```

The Node route hard-codes `version=v4`, accepts no timeframe, and applies `auth, ensureMember`.

### Execution path

```text
damwidiMain.php
  → returnSectorTimeframePerformanceData()
    → loadSectors(null, rawQuery)
      → connect()
      → SELECT data_performance
    → v2 chart transformation OR v4 keyed projection
    → json_encode()
```

Implementation: `php/damwidiPerformance.php`, beginning at line 276.

The endpoint function is exclusive to this endpoint. `loadSectors()` is shared by `returnAboveBelow`, `returnIntraDayData`, the nightly update jobs, and other legacy reporting code.

### Database access

```sql
SELECT *
FROM `data_performance`
WHERE INSTR('SIFK', `type`)
ORDER BY FIELD(`type`, "F", "I", "S", "K"), `sector`
```

Included types:

- `F`: Damwidi fund
- `I`: indexes
- `S`: sectors
- `K`: stocks

Cash is excluded. `loadSectors()` converts the result into an associative PHP array keyed by `sector`.

### Configuration and providers

Only common database and logger-bootstrap configuration is used. No external API, local JSON configuration, or filesystem data is accessed.

### Business rules

For v4:

- Return complete database rows.
- Key the top-level object by `sector`.
- Preserve group order: fund, indexes, sectors, stocks.
- Preserve alphabetical order within each group.

For v2:

- Read the requested database column using `timeframe`.
- Build a single Chart.js dataset.
- Assign red styling for negative values and green styling otherwise.
- Return the SPY value separately.
- No timeframe validation is performed.

### Response

#### Node-used v4 response

```json
{
  "DAM": {
    "id": 5,
    "sector": "DAM",
    "weight": "0.00",
    "shares": "0.00000",
    "basis": "0.000",
    "previous": "41.480",
    "previousDate": "2026-08-24",
    "1day": "41.480",
    "2day": "41.910",
    "3day": "41.240",
    "4day": "41.790",
    "1wk": "1.968",
    "2wk": "0.231",
    "4wk": "3.137",
    "8wk": "…",
    "1qtr": "…",
    "1yr": "…",
    "ytd": "…",
    "as-of": "2026-08-24",
    "name": "Damwidi",
    "description": "Damwidi",
    "sectorDescription": "Damwidi",
    "effectiveDate": null,
    "fetchedDate": null,
    "type": "F",
    "updated": "2026-08-25 07:00:00",
    "createdAt": null,
    "updatedAt": null,
    "deletedAt": null
  }
}
```

Exact characteristics verified:

- Top level is an object, not an array.
- It currently contains 28 keyed rows.
- `id` is numeric.
- MySQL decimals are strings.
- Dates and datetimes are legacy-formatted strings or `null`.
- All database columns are returned.

#### Default v2 response

```json
{
  "SPY": "3.299",
  "labels": ["DAM", "MDY", "RSP"],
  "datasets": [
    {
      "data": ["1.968", "0.231", "3.137"],
      "backgroundColor": ["rgba(...)"],
      "borderColor": ["rgba(...)"],
      "borderWidth": 1
    }
  ]
}
```

### Errors and side effects

There is no validation or controlled error response:

- Unknown v2 timeframe accesses an undefined row field.
- Missing SPY leaves `$SPY` undefined.
- Database errors are unhandled.

Valid requests return implicit 200 with PHP's default HTML content type. No writes, provider calls, logging, or caching occur.

### Node integration concerns

Reuse:

- Existing `/api/damwidi/timeframeData` route
- `auth, ensureMember`
- `DB_MySQL`
- Existing `Sector.model.js` where suitable

However, `Sector.model.js` is incomplete for exact v4 parity:

- It does not define every returned database column.
- It maps `sector` to the property `symbol`.
- Some numeric widths/types differ from the actual schema.
- Sequelize date serialization may produce ISO datetimes instead of PHP's `YYYY-MM-DD HH:mm:ss`.

A data-access service using an explicit projection plus response normalization is safer than directly serializing model instances.

## 3. `returnAboveBelow`

### Request contract

Legacy:

```text
GET /damwidiMain.php
    ?mode=returnAboveBelow
    &timeframe=4wk
    &version=v4
```

Current Node:

```text
GET /api/damwidi/aboveBelowData/:timeframe
x-auth-token: <JWT>
```

Node applies `auth, ensureMember` and always requests v4.

No body or endpoint-specific headers are used. Supported legacy timeframes are `1day`, `2day`, `3day`, `4day`, `1wk`, `2wk`, `4wk`, `8wk`, `1qtr`, `1yr`, and `ytd`.

### Execution path and dependency classification

Exclusive to this endpoint:

- `returnAboveBelow()`
- `returnHistoricalData()`
- `determineYTDlength()`
- `buildDataSet()`
- `returnFormatDetails()`
- `chartColorConfig.json`

Shared with `returnIntraDayData`:

- `calculateGain()`
- `loadSectors()`
- `data_performance`

Shared with other legacy code:

- `loadSectors()` is heavily used by update and reporting jobs.
- `calculateGain()` is also used by intraday calculations.
- `comparison.json` is also used by the performance-update job.
- `connect()` and `show()` are global utilities.

### Database access

- `data_performance` twice:
  - `SI` rows used for sectors and SPY.
  - `KI` rows loaded and filtered, but never used.
- `data_history` once per retained sector/index.
- `data_history` SPY count for YTD.
- `format_above_below` twice.
- `format_rs` once.

The format-table results are unused for the Node-facing v4 response.

### Business rules

- Include all sectors and only SPY among indexes.
- Omit a series lacking the full requested history length.
- First cumulative gain is `1`.
- Daily factor is rounded to six decimals.
- Cumulative gain is rounded to four decimals at every step.
- Relative strength is `100 × sector gain / SPY gain`, rounded to four decimals.
- YTD uses the number of current-year SPY rows plus one.
- Labels come from the last sector processed, not explicitly from SPY.
- Above and below series terminate when SPY is encountered.
- PHP uses boolean `usort` comparators, an important ordering quirk.
- The unused stock query and v4-unused format queries still execute.

### Response

```json
{
  "labels": ["2026-07-27", "2026-07-28"],
  "above": [
    {
      "label": "Energy",
      "symbol": "XLE",
      "data": [1, 0.9865]
    }
  ],
  "below": [],
  "rs": [],
  "chartConfig": {
    "above": [
      {
        "color": "000,150,000,1",
        "weight": "3",
        "dashstyle": "Solid"
      }
    ],
    "below": [],
    "rs": []
  }
}
```

Arrays and values are JSON numbers except labels, symbols, names, and chart-format fields.

### Errors and side effects

No controlled validation. Missing or unknown timeframe currently produces status 200 with PHP warning HTML mixed into the response. Database and division failures are unhandled.

There are no writes or endpoint logs. It reads two JSON files and performs multiple database queries.

## 4. `returnIntraDayData`

This is the largest and highest-risk endpoint.

### Request contract

Legacy:

```text
GET http://www.damwidi.com/damwidiMain.php?mode=returnIntraDayData
```

Common optional parameters:

- `verbose=1`
- `debug=1`, although the endpoint does not meaningfully use it.

The internal third parameter, `$api`, is not an HTTP parameter. Legacy HTML-building code calls `returnIntraDayData(false, false, true)` to receive the array instead of emitting JSON.

Current Node:

```text
GET /api/damwidi/intraDayData
x-auth-token: <JWT>
```

Node applies only `auth`, not `ensureVerified` or `ensureMember`.

Role behavior:

- Members receive the complete response.
- Authenticated non-members receive a trimmed response.
- Admin status alone does not grant full data if `isMember` is false.

### Execution path

```text
returnIntraDayData()
  → getHeatMapData()
    → loadSectors('SIK')
    → returnOpenPositions(today)
    → retrieveMarketStatusPolygon()
    → premarket: getBatchPreMarket()
      otherwise: retrieveBatchDataPolygon()
    → per missing symbol: retrieveYahooQuote()
    → calculateGain()
    → damwidiGain()
      → loadSectors('C')
      → loadDamdidiValue(1)
    → sort by gain descending
  → createHeatMapData()
  → createPortfolioData()
  → createAllocationData()
    → loadSectors(CIS with custom ordering)
    → CALL stock_allocation()
    → loadSectors('K')
    → insertIntoAllocationData()
      → calculateAllocation()
      → calculateChangePercent()
  → createPerformacneData()
    → loadHistory('SPY')
    → for each open position:
        loadPositionBasis(symbol)
        loadSplits(symbol)
  → createPortfolioData_v4()
  → write Logtail request-duration log
  → append status and timing information
  → emit JSON
```

Implementation: `php/damwidiIntraDay.php`, beginning at line 23.

### Dependency classification

Exclusive to this endpoint family:

- `getHeatMapData`
- `createHeatMapData`
- `createAllocationData`
- `createPerformacneData`
- `createPortfolioData`
- `createPortfolioData_v4`
- `damwidiGain`
- `insertIntoAllocationData`
- `calculateAllocation`
- `calculateChangePercent`
- `getBatchPreMarket`

`returnIntraDayData()` is also called by the legacy `buildAllocationTable()` HTML renderer.

Shared with `returnAboveBelow`:

- `calculateGain`
- `loadSectors`

Shared elsewhere in the legacy application:

- `returnOpenPositions()` is also used by value and performance update jobs.
- `loadDamdidiValue()` is also used by the performance update.
- `connect()` and `show()` are global.
- `retrieveYahooQuote()` is also reachable through the front controller's test mode.
- `returnHttpResponseCode()` is shared by Polygon and IEX adapters.

### Database access

Initial performance data:

```sql
SELECT *
FROM data_performance
WHERE INSTR('SIK', type)
ORDER BY sector
```

Reconstructed open positions:

```sql
SELECT *
FROM data_transactions
WHERE transaction_date <= :today
  AND symbol IS NOT NULL
  AND symbol <> ''
ORDER BY transaction_date ASC
```

Cash:

```sql
SELECT *
FROM data_performance
WHERE INSTR('C', type)
ORDER BY sector
```

Latest fund value:

```sql
SELECT *
FROM data_value
ORDER BY date DESC
LIMIT 1
```

Allocation rows:

```sql
SELECT *
FROM data_performance
WHERE INSTR('CIS', type)
ORDER BY FIELD(type, "C", "I", "S"), weight DESC, sector
```

```sql
CALL stock_allocation()
```

```sql
SELECT *
FROM data_performance
WHERE INSTR('K', type)
ORDER BY sector
```

The configured Node database currently reports that `stock_allocation()` does not exist. That needs environment verification. The apparent replacement source is `data_stocks`, which maps stock symbols to sectors and already has `models/Stock.model.js`.

SPY history:

```sql
SELECT date, data_history.*
FROM data_history
WHERE symbol = 'SPY'
ORDER BY date DESC
```

For each open position:

```sql
SELECT transaction_date, symbol, transaction_date AS date,
       shares, ABS(amount / shares) AS price
FROM data_transactions
WHERE symbol = :symbol AND type = 'B'
ORDER BY transaction_date DESC
```

```sql
SELECT date, data_splits.*
FROM data_splits
WHERE symbol = :symbol
ORDER BY date DESC
```

Tables accessed:

- `data_performance`
- `data_transactions`
- `data_value`
- `data_history`
- `data_splits`
- likely `data_stocks` through the stored procedure or its replacement

No collections are accessed by PHP.

### Configuration and external providers

Legacy constants:

- MySQL configuration and `ENV`
- `POLYGONURL`
- `POLYGONKEY`
- `awsURL`
- `awsKey`
- `damwidiShareCount`
- `LOGTAIL_TOKEN`
- `America/New_York` timezone

External calls:

1. Polygon market status: `GET /v1/marketstatus/now`
2. Polygon batch snapshot: `GET /v2/snapshot/locale/us/markets/stocks/tickers`
3. AWS/Yahoo fallback per missing symbol with an `x-api-key` header

The existing Node `services/polygon.js` supports single-symbol quote and profile requests, but not market status or batch snapshots. It should be extended rather than duplicated.

There is no existing Node AWS/Yahoo fallback service or corresponding environment configuration.

### Business rules

#### Market-mode selection

- If Polygon reports the market is not open and `earlyHours` is true, use stored `1day` and `2day` performance-table values.
- Otherwise call Polygon's batch snapshot, including after-hours/closed-market cases.

#### Price fallback

- Use Polygon when a symbol has a quote.
- Otherwise call the AWS/Yahoo fallback.
- A fallback failure is intended to mark the response incomplete and exclude the symbol.

There is a bug:

```php
$excludedSymbols = array_push($symbol);
```

This does not push into the exclusions array and can become a fatal argument error.

#### Open-position reconstruction

- Buy transactions add shares and negative purchase amounts.
- Sales add their signed shares and amounts.
- Dividends reduce effective basis.
- A position is removed when rounded shares reach zero.
- Basis is `-(purchase amount + dividends) / shares`.

#### Current DAM value

- Begin with the cash basis stored in `data_performance`.
- Add `shares × latest price` for every open position.
- Previous value is the latest stored Bivio unit value multiplied by total units.
- Current and previous share values are also returned.

#### Allocation

- Cash, sectors, indexes, stocks, sector summary rows, and DAM total are built.
- Stock rows are assigned to sector summaries.
- Many values are converted to formatted strings with commas, fixed decimals, and `%`.
- `DAM` uses the hard-coded `damwidiShareCount`.
- Sector rows with no stock detail may be converted to summary type `Y`.

#### Performance comparisons

- Open positions are alphabetically sorted.
- Each position is compared with SPY from its purchase date.
- Every purchase lot is returned.
- Historical purchase prices are adjusted for recorded splits effective between purchase date and today.

#### Timing and status

The response includes live duration measurements. Exact duration values are intentionally nondeterministic.

### Response structure

```json
{
  "time": "2026-08-25 09:30:00",
  "graphHeatMap": {
    "labels": ["XLE", "SPY", "DAM"],
    "datasets": [
      {
        "data": [1.25, 0.5, 0.75],
        "backgroundColor": ["rgba(...)"],
        "borderColor": ["rgba(...)"],
        "borderWidth": [1, 1, 2]
      }
    ]
  },
  "portfolioTable": {
    "SPY": {
      "sector": "SPY",
      "last": "646.25",
      "change": "2.15",
      "changePercent": "0.33",
      "value": "41824.50",
      "valueChange": "139.17",
      "tick": "UP"
    }
  },
  "allocationTable": {},
  "performanceData": {
    "data": {},
    "categories": [],
    "seriesPrice": [],
    "seriesSPY": [],
    "seriesDate": []
  },
  "heatMapData": [],
  "intraDay": {},
  "marketStatus": {
    "market": "open",
    "earlyHours": false,
    "afterHours": false
  },
  "status": {
    "dataComplete": true,
    "excludedSymbols": [],
    "duration": 1234,
    "durations": {
      "intraDay": 400,
      "graphHeatMap": 1,
      "portfolioTable": 1,
      "allocationTable": 25,
      "performanceData": 20,
      "heatMapData": 1
    }
  }
}
```

For non-members, the existing Node handler:

- Reduces each allocation row to `name`, `impliedPercent`, `allocation`, `type`, and `symbol`.
- Reduces each portfolio row to `sector`.
- Deletes `intraDay`, `performanceData`, and `heatMapData`.
- Retains heatmap, allocation summary, market status, time, and status.

### Errors and side effects

- A Polygon batch response other than `"200"` sets PHP status 400 and emits `{responseCode, response}`.
- `getHeatMapData()` then returns `null`, but `returnIntraDayData()` continues dereferencing it.
- Market-status failures are not checked.
- Missing price fallback contains the `array_push` bug.
- Missing SPY history, purchase basis, split data, or latest fund value can cause warnings or division errors.
- Database and JSON failures are unhandled.
- The current Node proxy converts rejected upstream requests to `500 "server error"`.

Unlike the other three endpoints, this endpoint has side effects:

- Polygon API usage.
- AWS/Yahoo fallback usage.
- Logtail info log for every lookup, including environment and duration.

It does not write to MySQL or local cache files.

## Common functionality

### Shared helpers

| Helper | Used by these endpoints | Also used elsewhere |
|---|---|---|
| `connect`, `show` | All four | Yes, application-wide |
| `loadSectors` | Above/below, timeframe, intraday | Yes, update jobs and reports |
| `calculateGain` | Above/below, intraday | No additional active endpoint beyond these |
| `returnOpenPositions` | Intraday | Yes, value/performance update jobs |
| `loadDamdidiValue` | Intraday | Yes, performance update |
| `loadHistory`, `loadPositionBasis`, `loadSplits` | Intraday | Not elsewhere in current PHP calls |
| Polygon response parsing | Intraday | Some helpers shared with other Polygon operations |

### Shared data-access patterns

- `data_performance` filtering by type mask.
- `data_history` queries by symbol and date ordering.
- MySQL decimals returned as strings.
- Associative response objects keyed by symbol.
- Transaction replay for open positions and basis.
- Repeated PDO connections instead of a shared repository.

### Shared calculations

- PHP-compatible percentage gain and rounding.
- Symbol-indexed transformations.
- Chronological reversal of descending history.
- Date-based historical comparisons.

### Shared validation

There is effectively none. Invalid inputs usually become PHP warnings.

### Shared response behavior

- Most endpoints use `echo json_encode(...)`.
- `verbose=1` switches to `show()` HTML output.
- Only intraday explicitly sets `Content-Type: application/json`.
- There is no common success/error envelope.

### Duplicated logic worth extracting

- PHP-compatible rounding.
- Gain calculation.
- Performance-row loading and type filtering.
- History loading and chronological normalization.
- Symbol-keyed result building.
- Date and decimal serialization.
- Portfolio transaction replay.
- Polygon snapshot normalization.

## Recommended Node service boundaries

Keep Express handlers in the existing route files. Do not introduce a controller framework or dependency-injection container.

### Data-access services

#### `services/marketDataRepository.js`

Responsibilities:

- Performance rows by type and ordering.
- Historical OHLC by symbol and limit.
- SPY YTD count.
- `data_value` reads.
- Split reads.
- Stock-to-sector mappings.

Use existing models where their mappings are safe, otherwise explicit Sequelize queries with normalization.

#### `services/portfolioRepository.js`

Responsibilities:

- Transactions through a date.
- Reconstructed open positions.
- Purchase basis by symbol/date.
- Cash and latest portfolio value inputs.

Reuse the existing `Transaction.model.js`.

### Reusable calculation service

#### `services/marketCalculations.js`

Responsibilities:

- PHP-compatible rounding.
- Percentage and multiplicative gain.
- Relative strength.
- Allocation percentage.
- Transaction replay/basis calculations if kept domain-pure.

No database or provider calls.

### Endpoint/domain services

#### `services/damwidiHistory.js`

- Format `data_value` as Alpha Vantage daily data.

#### `services/sectorPerformance.js`

- Produce the exact keyed v4 performance response.
- Keep v2 out of scope unless another Node consumer needs it.

#### `services/aboveBelow.js`

- Timeframe selection.
- Historical compounding.
- Relative strength.
- Dataset membership/order.
- Chart configuration.

#### `services/intraDay.js`

- Orchestrate repositories, Polygon, fallback quotes, calculations, timing, and response construction.
- Keep role-based redaction in the Express handler because it is HTTP authorization behavior.

### Provider services

Extend `services/polygon.js` with:

- `marketStatus()`
- `batchSnapshots(symbols)`

Add a narrowly scoped AWS/Yahoo fallback adapter only if that service is still active. Its URL and API key must use environment variables.

For testability, the intraday service should accept or expose injectable provider, repository, logger, and clock dependencies. A dependency-injection framework is unnecessary.

## Proposed module structure

```text
config/
  aboveBelowTimeframes.json
  aboveBelowChartConfig.json

services/
  marketDataRepository.js
  portfolioRepository.js
  marketCalculations.js
  damwidiHistory.js
  sectorPerformance.js
  aboveBelow.js
  intraDay.js
  polygon.js                 # extend existing
  awsQuote.js                # only if fallback remains active

models/
  History.model.js           # reuse
  Value.model.js             # reuse
  Sector.model.js            # reuse carefully
  Transaction.model.js       # reuse
  Stock.model.js             # reuse stock-sector mapping
  Split.model.js             # likely needed

routes/
  alphaVantage.js            # retain DAM public path
  damwidi.js                 # retain three existing paths
  marketData.js              # DAM quote also depends on intraday service
```

No new controller directory is recommended.

## Migration order

### 1. `returnDamwidiOHLC` — suggested first

- One table.
- One deterministic transformation.
- No external provider.
- Existing `Value` model.
- Exact live fixture is easy to capture.
- Removes the PHP dependency from `/api/alphaVantage/daily/DAM`.

Update the DAM branch in `marketData` only later, because it consumes intraday rather than OHLC.

### 2. `returnSectorTimeframePerformanceData`

- One query.
- No calculations or providers.
- Establishes exact database serialization and symbol-keyed response handling.
- Reusable performance-row access will support the remaining endpoints.

### 3. `returnAboveBelow`

- Builds on performance and history repositories.
- Introduces shared rounding and gain helpers.
- Deterministic enough for complete PHP-versus-Node fixture comparison.
- No provider volatility.

### 4. `returnIntraDayData`

- Depends on almost every shared data layer.
- Uses live providers and fallback behavior.
- Includes timing fields and request logging.
- Has member/non-member response variants.
- Contains multiple known bugs and environment ambiguities.
- Also feeds `/api/marketData/quote/DAM`.

## Behavior changes requiring explicit approval

These should not be changed silently:

1. **Invalid above/below timeframe:** Current behavior is status 200 with PHP warning text. Recommended: `400` JSON error.
2. **Intraday provider failure:** Current behavior can emit a 400 body and then continue into warnings/fatal errors. Recommended: a stable `502` or existing Node-style `500 "server error"`.
3. **`excludedSymbols` bug:** Recommended: correctly collect missing symbols and return `dataComplete: false`.
4. **Dead above/below reads:** The KI stock query and v4-unused format-table queries have no successful response effect. Recommended: do not port them, while acknowledging failure/performance behavior changes.
5. **Intraday logging destination:** Legacy uses Logtail. Node convention uses `writeLog()` and MongoDB. Changing the sink should be explicit.
6. **Stored procedure replacement:** `stock_allocation()` is absent from the configured Node database. Replacing it with `data_stocks` should be verified against the PHP environment's procedure output.
7. **v2 response variants:** Current Node routes use v4 only. Recommended: migrate only the Node-used v4 contracts unless backward compatibility for direct legacy clients is required.

## Risks and verification needs

- Capture complete response fixtures before each migration.
- Confirm current table schemas, especially `data_performance`, `data_value`, and `data_splits`.
- Verify whether PHP and Node point to exactly the same schema for `stock_allocation()`.
- Normalize MySQL `DECIMAL`, `DATE`, and `DATETIME` values explicitly.
- Match PHP rounding, including intermediate rounding.
- Preserve object key insertion order where the React charts iterate objects.
- Treat timing fields as structural assertions, not exact values.
- For intraday, test against recorded Polygon/AWS fixtures rather than two live calls taken at different moments.
- Verify premarket, open-market, closed-market, partial-provider, split-adjustment, and no-open-position cases.
- Verify member and non-member intraday payloads independently.
- Confirm the migrated handlers no longer contact PHP.
- Keep all data access read-only.

The recommended first implementation is `returnDamwidiOHLC`. It provides the smallest, most deterministic migration and exercises the existing Sequelize/response conventions without introducing new provider or calculation risk.
