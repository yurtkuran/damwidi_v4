# `returnIntraDayData` Decomposition and Migration Design

## Executive summary

`returnIntraDayData` should not be migrated as one Node.js endpoint. It combines four different concerns:

1. A live market and Damwidi portfolio valuation snapshot.
2. Dashboard-specific heatmap, allocation-summary, and holdings projections.
3. Allocation-page detail and formatting.
4. Purchase-lot performance calculations for every open position.

The current React application has two direct consumers of `/api/damwidi/intraDayData`—Dashboard and Allocation—and one indirect consumer through `/api/marketData/quote/DAM`. Their data needs are materially different. The Dashboard can also invoke the full PHP workflow twice during one mount: once through `getIntraDayData()` and once through the DAM `IndexCard` quote request.

The recommended replacement is:

- Keep `GET /api/marketData/quote/DAM`, but replace its PHP implementation with a focused fund-valuation service.
- Add `GET /api/damwidi/dashboardData` for the Dashboard's market overview, allocation summary, fund quote, and role-appropriate holdings.
- Add `GET /api/damwidi/allocationData` for the member-only Allocation page.
- Add `GET /api/damwidi/positionPerformance/:symbol` for performance data loaded only when a position row is expanded.

These endpoints should share repositories, normalized market-snapshot logic, portfolio valuation, allocation calculations, and position-performance calculations. They should not call each other over HTTP and should not each independently request the same Polygon data.

The first migration slice should be the existing DAM quote branch. It has the smallest public contract and currently performs the greatest amount of obviously unnecessary work per returned field.

## Scope and evidence

This analysis covers:

- Legacy application: `/Users/yurtkuran/Development/WebDev/damwidi`
- Node/React application: `/Users/yurtkuran/Development/WebDev/damwidi_v4`
- Legacy endpoint: `returnIntraDayData`
- Current Node proxies:
  - `GET /api/damwidi/intraDayData`
  - DAM branch of `GET /api/marketData/quote/:symbol`
- React consumers reachable from Dashboard, Allocation, and Technical workflows

The source was inspected on 2026-08-26. A read-only live request was also used to verify the response shape. That response contained:

- 28 live/universe quote rows in `intraDay`
- 17 open-position rows in `heatMapData` and `portfolioTable`
- 32 allocation rows
- 16 position-performance rows
- 36,098 response bytes
- A PHP-reported internal duration of 624 ms for the sampled request

Counts, prices, symbols, timing, and provider status are expected to change. The field shapes and dependency relationships are the important evidence.

## 1. Existing endpoint contract

### 1.1 Legacy HTTP request

```text
GET /damwidiMain.php?mode=returnIntraDayData
```

Production URL used by the current Node application:

```text
https://www.damwidi.com/damwidiMain.php?mode=returnIntraDayData
```

Inputs:

| Input | Location | Required | Behavior |
|---|---|---:|---|
| `mode=returnIntraDayData` | Query | Yes | Selects the front-controller branch. |
| `verbose=1` | Query | No | Emits diagnostic `show()` output and suppresses the final JSON echo. |
| `debug=1` | Query | No | Passed to `returnIntraDayData()` but not meaningfully used by this endpoint. |
| `$api=true` | Internal PHP argument | Not an HTTP input | Returns the PHP array instead of echoing JSON. Used by the legacy `buildAllocationTable()` function. |

There is no request body, endpoint-specific request header, pagination, date, symbol, or filtering input. The PHP front controller can also dispatch the function from the command line, but the current application uses HTTP GET.

The direct PHP endpoint has no authentication or authorization.

### 1.2 Current Node-facing requests

Full payload:

```text
GET /api/damwidi/intraDayData
x-auth-token: <JWT>
```

- Middleware: `auth`
- No `ensureVerified` or `ensureMember` middleware is applied despite the route comment.
- Members receive the full PHP response.
- Authenticated users whose token has a falsey `isMember` receive a redacted response.
- Admin status does not independently grant the full response.

DAM quote projection:

```text
GET /api/marketData/quote/DAM
x-auth-token: <JWT>
```

- Middleware: `auth`, `ensureVerified`
- `DAM` matching is case-sensitive in the current route.
- The handler calls the complete PHP endpoint and keeps only `intraDay.DAM.currentValue`, `prevClose`, and `gain`.

Existing authentication failures are:

```json
{ "msg": "no token, authorization denied" }
```

```json
{ "msg": "invalid token" }
```

The quote route can additionally return:

```json
{ "msg": "permission denied - not verified" }
```

## 2. Complete legacy execution path

### 2.1 Bootstrap and dispatch

```text
damwidiMain.php
  -> php-includes/init.php
     -> globals and constants
     -> shared PHP functions and database helpers
     -> all Damwidi domain modules
     -> Polygon, AWS/Yahoo, and other provider modules
     -> Composer autoload
  -> initialize Monolog + Logtail handler
  -> case returnIntraDayData
  -> returnIntraDayData($verbose, $debug, false)
```

Primary files:

- `damwidi/damwidiMain.php`
- `damwidi/php-includes/init.php`
- `damwidi/php/damwidiIntraDay.php`

### 2.2 Domain flow

```text
returnIntraDayData()
  |
  +-- getHeatMapData()
  |    +-- loadSectors('SIK')
  |    +-- returnOpenPositions(today)
  |    +-- retrieveMarketStatusPolygon()
  |    +-- premarket: getBatchPreMarket()
  |    |      or
  |    +-- other sessions: retrieveBatchDataPolygon()
  |    +-- per missing symbol: retrieveYahooQuote()
  |    +-- calculateGain() per symbol
  |    +-- damwidiGain()
  |    |    +-- loadSectors('C')
  |    |    +-- loadDamdidiValue(1)
  |    +-- sort all symbols by gain descending
  |
  +-- createHeatMapData()
  +-- createPortfolioData()
  +-- createAllocationData()
  |    +-- loadSectors(custom CIS query)
  |    +-- CALL stock_allocation()
  |    +-- loadSectors('K')
  |    +-- insertIntoAllocationData()
  |         +-- calculateAllocation()
  |         +-- calculateChangePercent()
  |
  +-- createPerformacneData()
  |    +-- loadHistory('SPY')
  |    +-- for every open position
  |         +-- loadPositionBasis(symbol)
  |         +-- loadSplits(symbol)
  |
  +-- createPortfolioData_v4()
  +-- remove nested duration fields
  +-- write Logtail timing log
  +-- append status and duration data
  +-- emit or return JSON
```

`createPerformacneData` is misspelled in the legacy source and is referenced using that spelling.

### 2.3 Dependency inventory and reuse classification

| Dependency | File | Classification | Notes |
|---|---|---|---|
| `returnIntraDayData` | `php/damwidiIntraDay.php` | Endpoint plus legacy internal use | Dispatched by `damwidiMain.php`; also called by `buildAllocationTable()`. |
| `getHeatMapData` | `php/damwidiIntraDay.php` | Endpoint-specific | Builds the canonical live quote/holding map. |
| `createHeatMapData` | `php/damwidiIntraDay.php` | Endpoint-specific | Builds chart-library arrays and colors. |
| `createPortfolioData` | `php/damwidiIntraDay.php` | Endpoint-specific | Builds the legacy keyed portfolio projection. |
| `createPortfolioData_v4` | `php/damwidiIntraDay.php` | Endpoint-specific | Filters live rows to holdings for the React table. |
| `createAllocationData` | `php/damwidiIntraDay.php` | Endpoint-specific | Builds cash/index/sector/stock/summary/fund rows. |
| `createPerformacneData` | `php/damwidiIntraDay.php` | Endpoint-specific | Eagerly builds all purchase comparisons. |
| `damwidiGain` | `php/damwidiIntraDay.php` | Endpoint-specific | Adds the synthetic DAM row. |
| `insertIntoAllocationData` | `php/damwidiIntraDay.php` | Endpoint-specific | Mutates allocation result and basis total. |
| `calculateAllocation` | `php/damwidiIntraDay.php` | Endpoint-specific but reusable concept | Percentage of position value to fund value. |
| `calculateChangePercent` | `php/damwidiIntraDay.php` | Endpoint-specific | Contains a likely formula bug; output is unused by React. |
| `getBatchPreMarket` | `php/damwidiIntraDay.php` | Endpoint-specific | Converts stored `1day`/`2day` values into provider-like data. |
| `returnOpenPositions` | `php/damwidiUpdateValue.php` | Shared elsewhere | Used by valuation updates, performance updates, and historical value work. |
| `loadSectors` | `php/dataHandlerMySQL.php` | Broadly shared | Used by all four analyzed legacy endpoints and update/reporting code. |
| `loadRawQuery` | `php/dataHandlerMySQL.php` | Only used here in current source | Executes `CALL stock_allocation()`. |
| `loadDamdidiValue` | `php/dataHandlerMySQL.php` | Shared elsewhere | Also used by performance-update logic. |
| `loadPositionBasis` | `php/dataHandlerMySQL.php` | Only used here | One query per open position. |
| `loadHistory` | `php/dataHandlerMySQL.php` | Only used here under this name | Loads all SPY history, not only required purchase dates. |
| `loadSplits` | `php/dataHandlerMySQL.php` | Only used here | One query per open position. |
| `retrieveBatchDataPolygon` | `php-services/dataHandlerPolygon.php` | Only used here | Polygon multi-symbol snapshots. |
| `retrieveMarketStatusPolygon` | `php-services/dataHandlerPolygon.php` | Only used here | Selects premarket versus snapshot behavior. |
| `retrieveYahooQuote` | `php/dataHandlerAWS.php` | Shared with legacy test mode | AWS API Gateway/Yahoo fallback. |
| `returnHttpResponseCode` | `php-services/returnHttpResponseCode.php` | Shared provider helper | Normalizes response headers for provider adapters. |
| `calculateGain` | `php-includes/functions.php` | Shared | Also used by `returnAboveBelow` and performance logic. |
| `connect`, `show` | PHP includes | Broadly shared | Database connection and diagnostics. |
| PDO | PHP runtime | Broadly shared | All MySQL reads use separate helper-created connections. |
| Monolog, Logtail handler | Composer packages | Broadly shared bootstrap | One info log is written per intraday lookup. |

`returnDetails`, `buildPortfolioTable`, and `buildAllocationTable` live in the same file but are not called by the HTTP endpoint. Repository-wide search found no current callers of the three functions; `buildAllocationTable` itself nevertheless calls `returnIntraDayData(..., true)` if it is invoked dynamically or by code outside the repository.

## 3. Data sources and queries

### 3.1 SQL queries

#### Quote universe and stored holdings

```sql
SELECT *
FROM data_performance
WHERE INSTR('SIK', type)
ORDER BY sector;
```

This supplies sectors (`S`), indexes (`I`), and stocks (`K`), including stored shares, basis, descriptions, previous values, and premarket fallback values.

#### Transaction-reconstructed open positions

```sql
SELECT *
FROM data_transactions
WHERE transaction_date <= :today
  AND symbol IS NOT NULL
  AND symbol <> ''
ORDER BY transaction_date ASC;
```

The rows are replayed in PHP. This result is used by purchase-performance construction, not by the primary live quote rows, whose shares come from `data_performance`.

#### Cash

```sql
SELECT *
FROM data_performance
WHERE INSTR('C', type)
ORDER BY sector;
```

`CASH.basis` is treated as the current cash balance when computing DAM value.

#### Latest persisted Damwidi value

```sql
SELECT *
FROM data_value
ORDER BY date DESC
LIMIT 1;
```

The latest `bivio_value`, `share_value`, and `total_shares` establish the prior fund/account values.

#### Allocation rows

```sql
SELECT *
FROM data_performance
WHERE INSTR('CIS', type)
ORDER BY FIELD(type, 'C', 'I', 'S'), weight DESC, sector;
```

```sql
CALL stock_allocation();
```

```sql
SELECT *
FROM data_performance
WHERE INSTR('K', type)
ORDER BY sector;
```

The configured database reports that `stock_allocation` exists. Its definition is not visible with the current database permissions, so its output must be captured and compared before replacing it with a direct `data_stocks` query.

#### Complete SPY history

```sql
SELECT date, data_history.*
FROM data_history
WHERE symbol = 'SPY'
ORDER BY date DESC;
```

Only dates corresponding to open purchase lots are read from the returned keyed array, but the query loads the complete history.

#### Purchase basis, once per open symbol

```sql
SELECT transaction_date,
       symbol,
       transaction_date AS date,
       shares,
       ABS(amount / shares) AS price
FROM data_transactions
WHERE symbol = :symbol
  AND type = 'B'
ORDER BY transaction_date DESC;
```

PDO `FETCH_UNIQUE` keys these results by transaction date. Multiple buys on the same date therefore collapse to one keyed basis record, while the transaction replay may still contain the same purchase date more than once.

#### Splits, once per open symbol

```sql
SELECT date, data_splits.*
FROM data_splits
WHERE symbol = :symbol
ORDER BY date DESC;
```

### 3.2 Query cost

For `N` open positions, one full endpoint execution performs approximately:

```text
8 fixed SQL calls + (2 x N) per-position SQL calls
```

The eight fixed calls are the initial performance rows, transactions, cash, latest value, allocation performance rows, stored procedure, stock performance rows, and SPY history. With the 16 open positions in the sampled response, that is approximately 40 SQL calls.

Each helper generally opens its own PDO connection. The eager per-position queries are avoidable:

- Load all relevant buy transactions in one query or lazily query one expanded symbol.
- Load splits for all relevant symbols in one query or lazily query one expanded symbol.
- Load SPY closes only for the distinct purchase dates.

### 3.3 External data sources

The endpoint uses:

1. Polygon market status: `/v1/marketstatus/now`
2. Polygon batch snapshots: `/v2/snapshot/locale/us/markets/stocks/tickers`
3. AWS API Gateway/Yahoo quote fallback, once per missing symbol
4. Logtail through Monolog for request timing

Provider credentials and URLs are legacy constants. They must become Node environment variables. Secret values must not be copied into source or migration documentation.

There are no MySQL writes, MongoDB operations, messages, emails, or local cache writes. Provider usage and logging are the endpoint's side effects.

## 4. Business rules and calculations

### 4.1 Market-session selection

- The endpoint always requests Polygon market status first.
- If `market != 'open'` and `earlyHours` is true, it does not call Polygon batch snapshots. It synthesizes current data from `data_performance.1day` and previous data from `data_performance.2day`.
- In every other state—including regular open, after-hours, extended-hours, and fully closed sessions—it requests Polygon batch snapshots.
- Polygon's current-day close is used as `latestPrice`; if it is zero, previous-day close is substituted.

The exact treatment of extended hours should be preserved until deliberately changed. The sampled status used `market: "extended-hours"`, `afterHours: true`, and still followed the Polygon batch branch.

### 4.2 Price fallback and data quality

- A Polygon quote is preferred when present.
- If a symbol has no Polygon quote, the endpoint requests the AWS/Yahoo fallback.
- Intended behavior is to mark the response incomplete and list symbols that have no usable price.

The fallback path is currently defective:

- `$excludedSymbols = array_push($symbol)` passes no destination array and can fail under current PHP versions.
- After a Yahoo price succeeds, the code still reads Polygon-only `prevDay.close` and `updated` fields for the missing symbol.

These bugs should not be silently reproduced. The Node implementation should normalize every provider to one quote shape and explicitly report excluded symbols. This is a recommended behavior correction requiring approval and targeted failure tests.

### 4.3 Transaction replay and basis

For transactions through today's New York date:

- `B`: add shares and purchase amount; append purchase date.
- `S`: add signed shares and sale amount.
- `D`: add dividend amount only if the position currently exists.
- Other transaction types are ignored for position construction.
- Remove a position when shares round to zero at five decimal places.
- Effective position basis is:

```text
-(purchase amount + dividend amount) / remaining shares
```

rounded to three decimals.

This replay is shared domain logic and should be implemented once in a testable portfolio service.

### 4.4 Per-symbol live rows

For every `S`, `I`, and `K` performance row:

```text
currentValue = shares x latestPrice
gain         = 100 x (latestPrice - providerPreviousClose) / providerPreviousClose
```

`openPosition` is true when the stored `data_performance.shares` value is greater than zero. The rows are sorted by `gain` descending before downstream response builders run.

### 4.5 DAM valuation

Current DAM account value is:

```text
data_performance.CASH.basis
+ sum(stored shares x latest price for every live row with nonzero shares)
```

Prior DAM account value is:

```text
latest data_value.bivio_value x latest data_value.total_shares
```

The synthetic DAM row also contains:

```text
currShareValue = current account value / total_shares
prevShareValue = latest data_value.share_value
gain           = percentage gain from prior account value to current account value
```

The prior account value deliberately uses `bivio_value`, while `prevShareValue` uses `share_value`. Preserve this distinction until it is explicitly reviewed.

### 4.6 Heatmap

- Every universe row plus DAM is included.
- Order is gain descending.
- Gain is rounded to two decimals for chart data.
- Positive and negative colors are generated server-side.
- Open positions receive opaque colors; closed rows receive 0.2 opacity.
- DAM receives a black, two-pixel border.

The React heatmap ignores the server-provided colors and calculates its own styles. It needs only symbol order, gains, and which symbols are held.

### 4.7 Portfolio table projections

The legacy keyed `portfolioTable` includes only rows with shares greater than zero and formats most values as strings. The React dashboard uses only its object keys to identify holdings in the heatmap; it does not read the row values.

`heatMapData` is the v4 projection: a numerically indexed array containing the same live rows for positions with shares greater than zero. The member dashboard uses selected fields from this array for its holdings table.

### 4.8 Allocation

Allocation construction combines cash, indexes, sectors, individual stocks, sector summaries, and a DAM total row.

Key calculations are:

```text
allocation % = 100 x row current value / DAM current account value
target value = sector weight % x DAM current account value
actual over/under % = actual allocation % - sector weight %
implied value = SPY current value x sector weight % + current sector value
implied % = 100 x implied value / DAM current account value
```

Stock rows are grouped under sector rows using `stock_allocation()`. A `_Total` summary row is added when a sector has stock children. A sector without stock details can be converted from type `S` to summary type `Y`.

Legacy types are:

- `C`: cash
- `I`: index/other index holding
- `S`: sector
- `K`: individual stock
- `Y`: synthetic sector summary
- `F`: synthetic fund/DAM row

Most display values are converted server-side to strings containing commas, fixed decimals, and `%`. Scalar types vary by row type.

The synthetic allocation DAM row uses the constant `damwidiShareCount` rather than `data_value.total_shares`. The React application does not use that field.

`calculateChangePercent()` uses:

```text
100 x (change / currentValue - change)
```

This appears dimensionally incorrect and produced a sampled summary value such as `-14,119,322.1%`. No React consumer reads allocation `changePercent`; the replacement should omit the field instead of preserving this defect.

### 4.9 Purchase performance

- Open positions are sorted alphabetically.
- Each position and each buy date are compared with SPY from the corresponding purchase date.
- Current position gain is calculated against the live symbol price.
- SPY gain is calculated against the live SPY price.
- Purchase prices are adjusted for splits whose effective dates fall between the purchase date and today.
- Every purchase date recorded by transaction replay is emitted, including duplicate dates.

The top-level per-position basis is selected from the latest purchase date. Split adjustment is performed for the nested purchase rows after the top-level values have already been calculated.

### 4.10 Timing and logging

The endpoint measures:

- initial market/quote work
- every response-builder duration
- complete request duration

Nested `duration` fields are removed and copied into `status.durations`. A Logtail info record contains action, start time, duration, and environment.

Duration values are nondeterministic diagnostics and are not consumed by React.

## 5. Complete response structure

### 5.1 Top-level structure

```json
{
  "time": "2026-08-26 07:25:48",
  "graphHeatMap": {},
  "portfolioTable": {},
  "allocationTable": {},
  "performanceData": {},
  "heatMapData": [],
  "intraDay": {},
  "marketStatus": {},
  "status": {}
}
```

Top-level order is the PHP insertion order shown above. `status` is appended last.

### 5.2 `time`

```text
string: YYYY-MM-DD hh:mm:ss
```

This is copied from `intraDay.DAM.lastRefreshed`, which is the lexicographically greatest per-symbol refresh string. The PHP formatter uses a 12-hour `h` without AM/PM, making afternoon values ambiguous.

### 5.3 `graphHeatMap`

```json
{
  "labels": ["ATRO", "SPY", "DAM"],
  "datasets": [
    {
      "data": [4.04, 0.02, 0.28],
      "backgroundColor": ["rgba(...)"],
      "borderColor": ["rgba(...)"],
      "borderWidth": [1, 1, 2]
    }
  ]
}
```

Purpose:

- `labels`: gain-descending symbol categories.
- `data`: two-decimal percentage gains aligned by index with labels.
- styling arrays: server-generated Chart.js styling, no longer used by the Highcharts component.

### 5.4 `portfolioTable`

Object keyed by symbol:

```json
{
  "ATRO": {
    "sector": "ATRO",
    "last": "77.51",
    "change": "3.01",
    "changePercent": "4.04",
    "value": "6743.37",
    "valueChange": "261.87",
    "tick": "UP"
  },
  "DAM": {
    "sector": "DAM",
    "last": "478,591.89",
    "change": "1347.55",
    "changePercent": "0.28",
    "value": "478,591.89",
    "valueChange": "1347.55",
    "tick": "UP"
  }
}
```

The React heatmap uses only `Object.keys(portfolioTable)`. None of the values above are read by the current React application.

### 5.5 `allocationTable`

Object keyed by row symbol. The union of possible fields is:

```text
symbol, sector, name, description, type,
last, currentValue, basis, allocation, shares, change, changePercent, valid,
weight, weightPercent, actualOverUnderPercent,
implied, impliedPercent, impliedOverUnder, impliedOverUnderPercent
```

Fields are conditional by row type. Representative schemas:

```json
{
  "CASH": {
    "symbol": "CASH",
    "sector": "CASH",
    "name": "Cash",
    "description": "Cash",
    "type": "C",
    "last": "242.860",
    "currentValue": "242.86",
    "basis": "242.860",
    "allocation": "0.1%",
    "shares": 1,
    "change": "0.00",
    "valid": true
  }
}
```

```json
{
  "XLK": {
    "symbol": "XLK",
    "sector": "XLK",
    "name": "Tech",
    "description": "Technology",
    "type": "S",
    "last": 182.84,
    "currentValue": "204,073.21",
    "allocation": "42.6%",
    "shares": 1116.13,
    "basis": 64.51,
    "change": "132,071.66",
    "changePercent": 183.42892574794604,
    "valid": true,
    "weight": "137,356",
    "weightPercent": "28.7%",
    "actualOverUnderPercent": "13.9%",
    "implied": "219,973",
    "impliedPercent": "46.0%",
    "impliedOverUnder": "82,617",
    "impliedOverUnderPercent": "17.3%"
  }
}
```

```json
{
  "XLK_Total": {
    "symbol": "XLK_Total",
    "sector": "XLK",
    "name": "Tech",
    "description": "Tech",
    "type": "Y",
    "currentValue": "266,613.87",
    "allocation": "55.7%",
    "shares": null,
    "change": "141,193.75",
    "changePercent": "-14,119,322.1%",
    "valid": true,
    "weight": "137,356",
    "weightPercent": "28.7%",
    "actualOverUnderPercent": "27.0%",
    "implied": "282,514",
    "impliedPercent": "59.0%",
    "impliedOverUnder": "145,158",
    "impliedOverUnderPercent": "30.3%"
  }
}
```

```json
{
  "DAM": {
    "sector": "DAM",
    "symbol": "DAM",
    "description": "Damwidi",
    "type": "F",
    "shares": 10000,
    "basis": 281007.38037900004,
    "currentValue": "478,591.89",
    "change": "197,584.51",
    "allocation": "0.0%"
  }
}
```

Ordering is significant to the current Allocation table because the client converts object values to an array without sorting.

### 5.6 `performanceData`

```json
{
  "data": {
    "AMZN": {
      "symbol": "AMZN",
      "dateBasis": "2024-05-03",
      "priceBasis": 186.44,
      "priceLast": 260.28,
      "pricePreviousClose": "261.060",
      "priceGain": 39.61,
      "spyBasis": 511.29,
      "spyLast": 766.08,
      "spyGain": 49.83,
      "purchases": [
        {
          "dateBasis": "2023-11-08",
          "priceBasis": 142.98,
          "priceGain": 82.04,
          "spyBasis": 437.25,
          "spyGain": 75.2
        }
      ]
    }
  },
  "categories": ["AMZN"],
  "seriesPrice": [39.61],
  "seriesSPY": [49.83],
  "seriesDate": ["2024-05-03"]
}
```

Purpose:

- `data`: complete per-position and per-purchase comparisons.
- `categories`, `seriesPrice`, `seriesSPY`, `seriesDate`: prebuilt chart arrays for an older consumer. No current React code reads these arrays.

### 5.7 `heatMapData`

An array containing only rows with shares greater than zero, in gain-descending order. Non-DAM row:

```json
{
  "sector": "ATRO",
  "openPosition": true,
  "shares": "87.00000",
  "basis": "91.510",
  "last": 77.51,
  "currentValue": 6743.370000000001,
  "prevClose": "74.500",
  "gain": 4.04,
  "lastRefreshed": "2026-08-26 04:58:00",
  "description": "Astronics Corp",
  "source": "polygon"
}
```

DAM row:

```json
{
  "sector": "DAM",
  "openPosition": true,
  "shares": 11438.980086,
  "last": 478591.88757,
  "currentValue": 478591.88757,
  "prevClose": 477244.3383683559,
  "gain": 0.28,
  "currShareValue": 41.83868526493386,
  "prevShareValue": "41.720882",
  "lastRefreshed": "2026-08-26 07:25:48"
}
```

### 5.8 `intraDay`

Object keyed by symbol containing the complete quote universe and DAM. Non-DAM rows use the same shape as the `heatMapData` example; closed rows have `openPosition: false` and zero shares. DAM uses the synthetic DAM shape.

The current `/api/damwidi/intraDayData` React consumers never read this section. The Node DAM quote handler is its only current application consumer and reads only three DAM fields.

### 5.9 `marketStatus`

Unmodified Polygon provider response. The sampled keys were:

```json
{
  "afterHours": true,
  "currencies": {},
  "earlyHours": false,
  "exchanges": {},
  "indicesGroups": {},
  "market": "extended-hours",
  "serverTime": "2026-08-26T19:40:49-04:00"
}
```

The nested provider fields can evolve. No current React consumer reads `marketStatus`.

### 5.10 `status`

```json
{
  "dataComplete": true,
  "excludedSymbols": [],
  "duration": 624,
  "durations": {
    "intraDay": 521,
    "graphHeatMap": 0,
    "portfolioTable": 0,
    "allocationTable": 5,
    "performanceData": 98,
    "heatMapData": 0
  }
}
```

No current React component displays or branches on these fields.

### 5.11 Non-member Node projection

For a non-member, `routes/damwidi.js` currently:

- Reduces every allocation row to `name`, `impliedPercent`, `allocation`, `type`, and `symbol`.
- Reduces every portfolio row to `sector` only.
- Deletes `intraDay`, `performanceData`, and `heatMapData`.
- Retains `time`, `graphHeatMap`, `marketStatus`, and `status`.

This redaction is Node behavior, not PHP behavior, and must be represented deliberately in the replacement dashboard contract.

## 6. Errors and side effects

### 6.1 Legacy errors

- A Polygon batch response code other than string `"200"` sets HTTP 400 and echoes `{responseCode, response}`.
- `getHeatMapData()` then returns `null`, but `returnIntraDayData()` continues dereferencing it. The final body can contain warnings or concatenated/invalid JSON.
- Market-status transport failures are not handled consistently; the shared cURL helper can terminate execution.
- Missing quotes can trigger the broken exclusions/fallback path.
- Missing SPY dates, purchase bases, split data, cash, or latest fund values can produce undefined-index warnings or division errors.
- `calculateGain()` does not guard against zero previous values.
- Database exceptions are not caught at endpoint level.
- JSON encoding failures are not checked.

Successful direct PHP responses default to HTTP 200 and explicitly set `Content-Type: application/json; charset=utf-8` near the end of the function.

### 6.2 Current Node errors

- Upstream Axios failures are logged with `console.error(err.message)`.
- The Node proxy returns HTTP 500 with plain text `server error`.
- An upstream PHP 400 therefore normally becomes Node 500.
- Token and verification middleware return the existing 401 JSON messages described earlier.

### 6.3 Side effects

- Polygon market-status and snapshot API usage.
- AWS/Yahoo fallback API usage when Polygon data is missing.
- One Logtail info record per full PHP call.
- No database writes, cache writes, emails, SMS, or messages.

## 7. Front-end consumer inventory

### 7.1 Direct action: `damwidiActions.getIntraDayData`

Source:

```text
client/src/actions/damwidiActions.js
```

Behavior:

```text
GET /api/damwidi/intraDayData
  -> dispatch GET_INTRADAY_DATA with the complete response
  -> damwidiReducer stores it as state.damwidi.intraDay
```

This action is initiated by two pages:

1. `Dashboard` on component mount.
2. `Allocation` on component mount.

The reducer performs no transformation, normalization, or filtering.

### 7.2 Dashboard workflow

Entry route and files:

```text
/dashboard
client/src/components/dashboard/Dashboard.js
client/src/components/dashboard/Heatmap.js
client/src/components/dashboard/PieChart.js
client/src/components/dashboard/PortfolioTable.js
client/src/components/dashboard/PositionDetail.js
client/src/components/dashboard/Performance.js
client/src/components/dashboard/IndexCard.js
```

Trigger:

- Mounting `Dashboard` dispatches `getIntraDayData()` and `getOpenPositions()`.
- Four `IndexCard` instances independently request `/api/marketData/quote/:symbol`, including DAM.
- Consequently, Dashboard mount can run `returnIntraDayData` twice: the full dashboard request and the DAM quote request.

#### Dashboard field usage

| Legacy field | Actual use |
|---|---|
| `time` | Heatmap title. |
| `graphHeatMap.labels` | Heatmap x-axis categories. |
| `graphHeatMap.datasets[0].data` | Heatmap percentage values. |
| `portfolioTable` keys | Determines which heatmap columns are opaque/current holdings. |
| `allocationTable.*.name` | Pie labels. |
| `allocationTable.*.impliedPercent` | Pie values for summary (`Y`) rows. |
| `allocationTable.*.allocation` | Pie values for cash and non-SPY `I` rows. |
| `allocationTable.*.type` | Pie inclusion rules. |
| `allocationTable.*.symbol` | Excludes SPY from the pie's `Other` bucket. |
| `allocationTable[symbol].last` | Fallback price while calculating real-time DAM value from WebSocket prices. |
| `heatMapData[].sector` | Position symbol and DAM footer identity. |
| `heatMapData[].description` | Member holdings-table description. |
| `heatMapData[].basis` | Member holdings-table basis. |
| `heatMapData[].shares` | Member holdings calculations/display. |
| `heatMapData[].prevClose` | Price and value changes; DAM footer previous value. |
| `heatMapData[].last` | Position price and value calculations. |
| `heatMapData[].gain` | Cell styling and DAM footer percentage. |
| `heatMapData[DAM].currentValue` | DAM footer current account value. |
| `performanceData.data[symbol].purchases[].dateBasis` | Expanded position chart categories. |
| `performanceData.data[symbol].purchases[].priceGain` | Expanded position performance series. |
| `performanceData.data[symbol].purchases[].spyGain` | Expanded SPY comparison series. |

Additional client work:

- `PieChart` parses percentage strings, groups summary/cash rows, aggregates non-SPY indexes into `Other`, sorts slices descending, and explodes the largest slice.
- `PortfolioTable` filters DAM from normal rows and sorts positions alphabetically.
- `PortfolioTable` calculates price percentage, position value, and position value change client-side.
- `PositionDetail` converts purchase arrays into chart category and series arrays.
- `Performance` converts each price gain to a Highcharts point with a color determined by sign.
- Dashboard combines the separate `/openPositions` response with Finnhub WebSocket trades and `allocationTable.last` fallback prices to recalculate current DAM account value every second.
- `IndexGauge` subtracts SPY return from DAM return and recalculates that relationship from real-time trades.

#### Dashboard fields fetched but ignored

- All `graphHeatMap` background colors, border colors, and border widths.
- Every `portfolioTable` row value; only keys matter.
- Most allocation detail fields, including absolute target/implied/over-under values.
- All `performanceData.categories`, `seriesPrice`, `seriesSPY`, and `seriesDate` arrays.
- All top-level per-position performance fields; Dashboard expansion reads only nested purchase date and gains.
- `performanceData.data.*.purchases[].priceBasis` and `spyBasis`.
- Non-DAM `heatMapData.currentValue`, `openPosition`, `lastRefreshed`, and `source`.
- DAM `currShareValue`, `prevShareValue`, `shares`, and `lastRefreshed`.
- Entire `intraDay` section.
- Entire `marketStatus` and `status` sections.

### 7.3 Allocation workflow

Entry route and files:

```text
/allocation
client/src/components/allocation/Allocation.js
client/src/components/allocation/AllocationTable.js
client/src/components/allocation/PurchaseTable.js
```

Trigger:

- Mounting `Allocation` dispatches the same `damwidiActions.getIntraDayData()` action.
- The navigation link is shown only to members, but the React route itself is only a generic `PrivateRoute`.
- The current Node endpoint removes `performanceData` for non-members, so direct navigation by an authenticated non-member can leave this page without its expected data.

#### Allocation field usage

| Legacy field | Actual use |
|---|---|
| `allocationTable.*.symbol` | Row identity; DAM exclusion; expansion lookup. |
| `allocationTable.*.sector` | DAM footer and row grouping identity. |
| `allocationTable.*.description` | Row and DAM footer description. |
| `allocationTable.*.type` | Expansion eligibility and summary-row CSS. |
| `allocationTable.*.shares` | Display and expansion eligibility. |
| `allocationTable.*.currentValue` | Display and DAM total. |
| `allocationTable.*.change` | Display and red/green styling; client assumes a formatted string and calls `.replace()`. |
| `allocationTable.*.allocation` | Display. |
| `allocationTable.*.weightPercent` | Display for `Y` rows. |
| `allocationTable.*.impliedPercent` | Display for `Y` rows. |
| `performanceData.data[symbol].symbol` | Expanded purchase-table title. |
| `performanceData.data[symbol].priceLast` | Expanded purchase-table current price. |
| `performanceData.data[symbol].pricePreviousClose` | Client calculates current day's price change. |
| `performanceData.data[symbol].purchases[].dateBasis` | Purchase date. |
| `performanceData.data[symbol].purchases[].priceBasis` | Adjusted purchase price. |
| `performanceData.data[symbol].purchases[].priceGain` | Position gain. |
| `performanceData.data[symbol].purchases[].spyGain` | SPY gain and client-calculated above/below value. |

Additional client work:

- Converts the keyed allocation object to an array without sorting; server insertion order is retained.
- Excludes the DAM row from the body and uses it as the footer.
- Determines expandable rows from shares and type.
- Calculates above/below as `priceGain - spyGain` for each purchase.
- Applies styling after parsing the formatted `change` string.

#### Allocation fields fetched but ignored

- `time`, `graphHeatMap`, `portfolioTable`, `heatMapData`, `intraDay`, `marketStatus`, and `status` in full.
- Allocation `name`, `basis`, `last`, `valid`, `changePercent`, absolute `weight`, `actualOverUnderPercent`, absolute `implied`, `impliedOverUnder`, and `impliedOverUnderPercent`.
- Performance top-level `dateBasis`, `priceBasis`, `priceGain`, `spyBasis`, `spyLast`, and `spyGain`.
- Purchase-level `spyBasis`.
- All aggregate performance arrays.

### 7.4 Dashboard DAM `IndexCard` quote workflow

Files:

```text
client/src/components/dashboard/IndexCard.js
routes/marketData.js
```

Trigger:

- Dashboard renders `<IndexCard index="DAM">`.
- `IndexCard` directly calls `GET api/marketData/quote/DAM`; it does not use a Redux action.
- The Node quote route calls the complete PHP endpoint.

The Node handler reads only:

```text
intraDay.DAM.currentValue
intraDay.DAM.prevClose
intraDay.DAM.gain
```

and returns:

```json
{
  "symbol": "DAM",
  "latestPrice": 478591.88757,
  "change": 1347.5492016440886,
  "changePercent": 0.0028,
  "previousClose": 477244.3383683559
}
```

`IndexCard` displays `latestPrice`, `change`, and `changePercent`, then sends all four numeric values to Dashboard's `IndexGauge`. WebSocket updates use `previousClose` to recalculate change and change percentage.

Everything else calculated by `returnIntraDayData` is ignored by this request.

### 7.5 Technical-page DAM quote workflow

Files:

```text
client/src/components/charts/technical/Technical.js
client/src/actions/marketActions.js
client/src/reducers/marketReducer.js
client/src/components/charts/technical/SymbolDetail.js
```

Trigger:

- Technical initially loads SPY, which does not invoke the legacy endpoint.
- If a user manually selects `DAM`, `processSymbol()` dispatches `getQuote('DAM')`.
- The market action calls `/api/marketData/quote/DAM`, and the reducer stores the response.

The DAM branch of `SymbolDetail` ignores the quote entirely and renders a static name plus zero 52-week values. Therefore all data returned by this DAM quote request is currently ignored in this workflow. The Technical page should stop requesting a DAM quote unless the UI is changed to display it.

### 7.6 Similarly named action that is not a legacy consumer

`client/src/actions/marketActions.js` also exports `getIntraDayData(symbol)`, which calls:

```text
/api/marketData/intraday/:symbol
```

That route retrieves IEX intraday candles and is unrelated to legacy `returnIntraDayData`. `PositionDetail` imports this action but never invokes it; its nested `Candlestick` component calls the IEX route directly.

## 8. Consumer-to-field matrix

Legend: `R` = read directly, `D` = used only by the Node quote projection, `L` = read lazily after expansion, `K` = keys only, `-` = ignored.

| Response section | Dashboard initial | Dashboard expanded position | Allocation initial | Allocation expanded row | DAM IndexCard | Technical with DAM |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `time` | R | - | - | - | - | - |
| `graphHeatMap.labels` | R | - | - | - | - | - |
| `graphHeatMap.datasets[0].data` | R | - | - | - | - | - |
| `graphHeatMap` styling arrays | - | - | - | - | - | - |
| `portfolioTable` keys | K | - | - | - | - | - |
| `portfolioTable` values | - | - | - | - | - | - |
| `allocationTable` pie subset | R | - | - | - | - | - |
| `allocationTable.*.last` | R | - | - | - | - | - |
| `allocationTable` detailed subset | - | - | R | - | - | - |
| `performanceData.data.*.purchases` | - | L | - | L | - | - |
| Other `performanceData` fields | - | - | - | - | - | - |
| `heatMapData` holdings subset | R for members | - | - | - | - | - |
| `intraDay.DAM.currentValue/prevClose/gain` | - | - | - | - | D | D then ignored by UI |
| Other `intraDay` rows/fields | - | - | - | - | - | - |
| `marketStatus` | - | - | - | - | - | - |
| `status` | - | - | - | - | - | - |

## 9. Shared, action-specific, and unused data

### 9.1 Shared foundational data

The following is genuinely shared domain work even though consumers need different projections:

- Market-session determination.
- A normalized current/previous quote for required symbols.
- Current holdings and cash.
- Latest persisted fund value and total shares.
- DAM current account value, previous account value, and gain.
- Data-completeness/excluded-symbol tracking.
- Gain and allocation calculations.

This should become a shared service result with numeric values, not a preformatted HTTP response.

### 9.2 Shared by Dashboard and Allocation

- Current allocation calculations.
- Allocation row identity/type/order.
- Live symbol prices used by allocation rows.
- Position purchase performance when a row is expanded.

The two pages need different allocation projections, so they should share an allocation service rather than share one oversized HTTP response.

### 9.3 Dashboard-only data

- Gain-descending market movers.
- Heatmap held/not-held status.
- Dashboard holdings table.
- Dashboard time/as-of label.
- DAM versus SPY card/gauge inputs.
- Role-based public versus member projection.

### 9.4 Allocation-only data

- Full member allocation table rows.
- Sector summary ordering and display fields.
- DAM allocation footer.
- Purchase price basis in expanded rows.

### 9.5 Quote-only data

- Exact five-field DAM quote response expected from `/api/marketData/quote/DAM`.

It derives from shared valuation work but does not need allocation tables, historical SPY data, splits, purchase-lot performance, or chart projections.

### 9.6 Data with no current front-end consumer

The following can eventually be removed from application responses:

- Server-generated heatmap color and border arrays.
- Every `portfolioTable` value; held status can be an explicit boolean on mover rows.
- `performanceData.categories`, `seriesPrice`, `seriesSPY`, and `seriesDate`.
- Unused top-level position-performance fields.
- Purchase-level `spyBasis` unless a future view displays it.
- Allocation `valid`, `changePercent`, absolute target/implied/over-under values, and unused percentages.
- Non-DAM `heatMapData.currentValue`, `openPosition`, `lastRefreshed`, and `source` where not shown.
- DAM `currShareValue` and `prevShareValue` unless a future view needs per-share intraday values.
- The provider's raw `marketStatus` object.
- Response timing fields.
- The complete `intraDay` quote-universe section once the DAM quote route and dashboard are migrated.

Internal services may still require raw values that should not be exposed over HTTP.

### 9.7 Expensive work done for consumers that do not need it

| Consumer | Unnecessary current work |
|---|---|
| DAM quote | Allocation queries/procedure, complete SPY history, transaction replay, `2 x N` basis/split queries, every response builder, all non-DAM response serialization. |
| Dashboard initial render | Eager basis/split queries for all positions even if no row is expanded; server chart styling; duplicate keyed portfolio projection; full quote universe; unused diagnostics. |
| Allocation initial render | Heatmap, both portfolio projections, raw quote universe, raw market status, diagnostics, and eager performance for every unexpanded row. |
| Authenticated non-member Dashboard | Full member performance and holdings calculations occur in PHP before Node deletes them. |
| Technical DAM selection | Entire legacy computation; the resulting quote is not displayed. |

## 10. Recommended endpoint decomposition

### 10.1 Existing DAM quote endpoint

```text
GET /api/marketData/quote/DAM
Middleware: auth, ensureVerified
```

Consumers:

- Dashboard DAM `IndexCard` during the first migration stage.
- `marketActions.getQuote('DAM')` if Technical continues requesting it.

Request parameters:

- Existing `:symbol` path parameter; no new query/body parameters.
- Normalize case before selecting the DAM branch, unless preserving lowercase behavior is required.

Preserve response:

```json
{
  "symbol": "DAM",
  "latestPrice": 478591.88757,
  "change": 1347.5492016440886,
  "changePercent": 0.0028,
  "previousClose": 477244.3383683559
}
```

Legacy fields replaced:

- `intraDay.DAM.currentValue`
- `intraDay.DAM.prevClose`
- `intraDay.DAM.gain`

Required work:

- Load only holdings/cash needed for valuation.
- Obtain normalized quotes only for held symbols.
- Load latest `data_value` row.
- Calculate DAM account value and prior-account comparison.

Shared services:

- `portfolioRepository`
- `marketSnapshot`
- `portfolioValuation`
- `marketCalculations`

This endpoint should not calculate allocation rows, purchase performance, heatmaps, or response diagnostics.

### 10.2 Dashboard data endpoint

```text
GET /api/damwidi/dashboardData
Middleware: auth
```

Consumer:

- `Dashboard` through a new `getDashboardData` action.

Request parameters:

- None.

Proposed response:

```json
{
  "asOf": "2026-08-26T19:40:49-04:00",
  "fundQuote": {
    "symbol": "DAM",
    "latestPrice": 478591.88757,
    "change": 1347.5492016440886,
    "changePercent": 0.0028,
    "previousClose": 477244.3383683559
  },
  "movers": [
    {
      "symbol": "ATRO",
      "gain": 4.04,
      "held": true
    }
  ],
  "allocationSummary": [
    {
      "symbol": "XLK_Total",
      "name": "Tech",
      "type": "Y",
      "allocation": 55.7,
      "impliedPercent": 59.0
    }
  ],
  "positions": [
    {
      "symbol": "ATRO",
      "description": "Astronics Corp",
      "basis": 91.51,
      "shares": 87,
      "previousClose": 74.5,
      "last": 77.51,
      "gain": 4.04
    }
  ],
  "dataQuality": {
    "complete": true,
    "excludedSymbols": []
  }
}
```

Role projection:

- All authenticated users receive `asOf`, `fundQuote`, movers, allocation percentages, and data quality consistent with current visibility.
- `positions` is returned only for members, or is an empty array for non-members.
- If the current non-member real-time DAM recalculation must be preserved, explicitly decide whether to expose the required symbol/share inputs. The current `/openPositions` endpoint already exposes shares to any authenticated user, which should be reviewed rather than copied accidentally.

Legacy fields replaced:

- `time`
- used subset of `graphHeatMap`
- held keys from `portfolioTable`
- dashboard subset of `allocationTable`
- dashboard subset of `heatMapData`
- DAM quote values formerly requested separately
- `status.dataComplete` and `excludedSymbols`

Required work:

- Shared market snapshot and fund valuation.
- Market-mover projection sorted by gain descending.
- Allocation summary.
- Member holdings projection.
- Role-aware response mapping.

The client should derive chart categories/data/colors from `movers`. This removes chart-library details from the server contract.

After Dashboard switches to this response, its DAM `IndexCard` should accept `fundQuote` as a prop instead of making a second HTTP request.

### 10.3 Allocation data endpoint

```text
GET /api/damwidi/allocationData
Middleware: auth, ensureMember
```

Consumer:

- `Allocation` through a new `getAllocationData` action.

Request parameters:

- None.

Proposed response:

```json
{
  "asOf": "2026-08-26T19:40:49-04:00",
  "fund": {
    "symbol": "DAM",
    "description": "Damwidi",
    "currentValue": 478591.89,
    "basis": 281007.38,
    "change": 197584.51
  },
  "rows": [
    {
      "symbol": "XLK_Total",
      "sector": "XLK",
      "description": "Tech",
      "type": "Y",
      "shares": null,
      "currentValue": 266613.87,
      "change": 141193.75,
      "allocation": 55.7,
      "weightPercent": 28.7,
      "impliedPercent": 59.0
    }
  ],
  "dataQuality": {
    "complete": true,
    "excludedSymbols": []
  }
}
```

Legacy fields replaced:

- The Allocation-page subset of `allocationTable`.
- DAM allocation footer.
- Completeness status.

Required work:

- Shared snapshot and valuation.
- Stock-to-sector mapping.
- Allocation and summary calculations.
- Stable legacy-compatible row order.

Shared services:

- `marketDataRepository`
- `portfolioRepository`
- `marketSnapshot`
- `portfolioValuation`
- `allocation`
- `marketCalculations`

Recommended contract change:

- Return numeric amounts and percentages and format them in React.
- The current `AllocationTable` assumes `change` is a comma-formatted string and must be updated at the same time.
- Preserve visible formatting and ordering even if the new internal API uses consistent scalar types.

### 10.4 Lazy position-performance endpoint

```text
GET /api/damwidi/positionPerformance/:symbol
Middleware: auth, ensureMember
```

Consumers:

- Dashboard `PositionDetail` when a member expands a holding.
- Allocation `PurchaseTable` when a member expands a row.

Request parameters:

- `:symbol`: required, normalized to uppercase, validated against the existing symbol constraints, and restricted to a position the service can resolve.
- No query/body parameters initially.

Proposed response:

```json
{
  "symbol": "AMZN",
  "priceLast": 260.28,
  "pricePreviousClose": 261.06,
  "purchases": [
    {
      "dateBasis": "2023-11-08",
      "priceBasis": 142.98,
      "priceGain": 82.04,
      "spyGain": 75.2
    }
  ]
}
```

Legacy fields replaced:

- Only the used subset of `performanceData.data[symbol]`.

Required work:

- Buy transactions for one symbol.
- Splits for one symbol.
- SPY closes for the distinct purchase dates.
- Current and previous prices for the symbol and SPY.
- Split adjustment and gain calculations.

This endpoint eliminates eager `2 x N` position queries and avoids calculating performance for rows that are never expanded. A client-side per-symbol cache should prevent duplicate requests when a row is collapsed and reopened.

## 11. Recommended Node service boundaries

Follow the current application architecture: keep handlers in `routes/damwidi.js` and `routes/marketData.js`, load service modules with `require`, use Sequelize, retain existing middleware and error conventions, and do not add a controller framework or dependency-injection package.

### 11.1 Data-access services

#### `services/marketDataRepository.js`

Responsibilities:

- Load `data_performance` rows by type with explicit attributes and ordering.
- Load latest `data_value` row.
- Load SPY closes for specified dates.
- Load split rows by symbol(s).
- Load stock-to-sector mappings or invoke `stock_allocation()` until a parity replacement is proven.

#### `services/portfolioRepository.js`

Responsibilities:

- Load transactions through a date.
- Load buy lots for one or multiple symbols.
- Reconstruct open positions once.
- Provide cash and holding inputs required by valuation.

The existing `Transaction.model.js` and `Value.model.js` are reusable. `History.model.js` is reusable with explicit attributes. A `Split.model.js` will be needed when implementation starts.

Existing mappings require review before reuse:

- `Sector.model.js` maps `shares` as integer, but MySQL uses `decimal(11,5)`.
- It omits intraday-required fields including `previousDate`, `1day`, and `2day`.
- Several `Sector.model.js` decimal widths differ from the table.
- `Stock.model.js` maps `companyName` as `CHAR(5)`, while MySQL uses `varchar(255)`.
- `History.model.js` omits the table's `id` and contains duplicate `type` declarations for OHLC fields.

Do not rely on Sequelize schema synchronization. All migration access remains read-only.

### 11.2 Provider service

#### Extend `services/polygon.js`

Add narrowly scoped functions:

- `marketStatus()`
- `batchSnapshots(symbols)`
- Existing `quote(symbol)` remains available.

Normalize provider responses to one internal shape:

```json
{
  "symbol": "ATRO",
  "latestPrice": 77.51,
  "previousClose": 74.5,
  "updatedAt": "2026-08-26T16:58:00-04:00",
  "source": "polygon"
}
```

#### `services/awsQuote.js`

Add only if the fallback service is confirmed active. It should:

- Read URL/key from environment variables.
- Return the same normalized quote shape.
- Never expose provider credentials in logs or responses.
- Mark unavailable prior-close/timestamp fields explicitly rather than allowing undefined reads.

### 11.3 Pure calculation service

#### `services/marketCalculations.js`

Responsibilities:

- PHP-compatible rounding where parity requires it.
- Percentage gain with zero-denominator handling.
- Allocation percentage.
- Split-adjusted purchase basis.
- Position and benchmark gain.

No database, HTTP, Express request, logging, or formatting dependencies.

### 11.4 Domain services

#### `services/marketSnapshot.js`

Responsibilities:

- Choose premarket stored values versus Polygon snapshots.
- Normalize provider/fallback data.
- Track completeness and excluded symbols.
- Return only requested symbols to avoid quoting the full universe for a DAM-only valuation.

Accept provider, repository, and clock dependencies as function parameters/defaults for deterministic testing. No DI framework is necessary.

#### `services/portfolioValuation.js`

Responsibilities:

- Combine cash, holdings, and normalized quotes.
- Produce canonical numeric holding snapshots.
- Calculate DAM account value and quote.
- Preserve the current `bivio_value x total_shares` prior-value rule.

#### `services/allocation.js`

Responsibilities:

- Build sector/stock/summary relationships.
- Calculate current allocation, weight, and implied allocation.
- Preserve stable row ordering.
- Return numeric domain rows; endpoint mappers select fields.

Do not include the unused broken `changePercent` calculation.

#### `services/positionPerformance.js`

Responsibilities:

- Build one symbol's purchase-lot response.
- Adjust for splits.
- Compare with SPY.
- Preserve duplicate purchase-date behavior until confirmed otherwise.

#### Optional endpoint assemblers

- `services/dashboardData.js`
- `services/allocationData.js`

These may compose domain services and select response fields. Keep role redaction in the Express handler or an explicitly named response-projection function because it is authorization behavior.

### 11.5 Proposed eventual module structure

```text
models/
  Transaction.model.js       # reuse
  Value.model.js             # reuse
  History.model.js           # reuse carefully
  Sector.model.js            # correct mapping before intraday use
  Stock.model.js             # correct mapping before use
  Split.model.js             # add when implementation begins

services/
  marketDataRepository.js
  portfolioRepository.js
  marketCalculations.js
  marketSnapshot.js
  portfolioValuation.js
  allocation.js
  positionPerformance.js
  dashboardData.js           # optional thin assembler
  allocationData.js          # optional thin assembler
  polygon.js                 # extend existing module
  awsQuote.js                # only if fallback remains required

routes/
  marketData.js              # retain /quote/:symbol
  damwidi.js                 # add focused Damwidi routes

client/src/actions/
  damwidiActions.js          # add focused actions incrementally

client/src/reducers/
  damwidiReducer.js          # separate dashboard/allocation/per-symbol state
```

## 12. Incremental migration sequence

### Phase 0: Capture deterministic fixtures

Before implementation:

- Capture database rows used by one representative open/extended-hours request.
- Capture Polygon market-status and batch responses for the same request.
- Capture premarket stored-value inputs.
- Capture a missing-symbol/fallback case.
- Capture member and non-member Node responses.
- Capture purchase-lot cases with multiple buys, duplicate same-date buys, dividends, partial sales, full closure, and splits.

Sequential calls to live PHP and Node are not a reliable equality test because prices can change between calls. Provider fixtures and a common database snapshot are required.

### Phase 1: Shared foundations and DAM quote

Implement first:

- Correct read-only repository access for holdings, cash, and latest value.
- Market-status and batch-snapshot support in the existing Polygon service.
- Normalized provider quote shape.
- Portfolio valuation and gain calculations.

Then replace only the DAM branch of:

```text
GET /api/marketData/quote/:symbol
```

Why first:

- Existing URL and frontend contracts remain unchanged.
- Only five response fields must match.
- It removes the complete allocation/history/split workload from a quote request.
- It validates the hardest shared foundation—live fund valuation—without also migrating every projection.
- Dashboard immediately benefits because its DAM card no longer invokes the oversized PHP response.

The non-DAM Polygon quote branch should remain unchanged.

### Phase 2: Lazy position performance

Implement `positionPerformance/:symbol` and update both expandable components to request it on first expansion.

Initially, the parent pages may still receive the old eager `performanceData`; the new components should prefer the new per-symbol state. Once both parent pages use their focused endpoints, remove the old performance payload dependency completely.

This phase validates transaction replay, basis lookup, SPY comparison, and splits independently from allocation layout.

### Phase 3: Allocation page

Implement `allocationData`, then update only the Allocation page action/reducer/component chain.

Why before Dashboard:

- It is member-only and has one focused page workflow.
- It exercises the complete allocation logic without Dashboard role projection, WebSocket behavior, or heatmap presentation.
- Lazy performance is already available for expanded rows.

Keep `/api/damwidi/intraDayData` active for Dashboard during this phase.

### Phase 4: Dashboard page

Implement `dashboardData`, then update Dashboard and child component props.

Changes should include:

- Build chart categories, colors, and held styling from `movers` in React.
- Use `fundQuote` for the initial DAM card instead of a separate DAM quote request.
- Use the focused member `positions` projection.
- Load position performance lazily on expansion.
- Preserve non-member visible heatmap/allocation behavior.
- Decide whether to retain or remove non-member client-side real-time DAM reconstruction.

At this point no React page should dispatch the legacy `getIntraDayData()` action.

### Phase 5: Retire the oversized endpoint

Retirement is safe only when all of the following are true:

- Repository search finds no frontend call to `/api/damwidi/intraDayData`.
- `/api/marketData/quote/DAM` no longer calls PHP.
- Dashboard and Allocation use focused actions and state.
- Expanded Dashboard and Allocation rows use the per-symbol endpoint.
- Member, non-member, unverified, and invalid-token behavior has been verified.
- Production logging confirms no traffic to the Node proxy for an agreed observation period.
- Any external clients calling PHP directly have been identified or ruled out.
- The legacy `buildAllocationTable()` internal call is confirmed unused before deleting the PHP function itself.

Then:

1. Remove the Node `/api/damwidi/intraDayData` proxy.
2. Remove the unused Redux action/type/state after all consumers are migrated.
3. Disable the PHP front-controller case.
4. Delete legacy implementation code only in a separately authorized legacy cleanup.

## 13. Validation and testing strategy

### 13.1 Pure unit tests

Test without network/database dependencies:

- Transaction replay for buys, sales, dividends, and zero-share closure.
- PHP-compatible rounding.
- Gain with positive, negative, zero, and missing denominators.
- DAM valuation from cash and positions.
- Allocation and implied allocation formulas.
- Split adjustment across purchase/split/current dates.
- Stable row ordering.
- Provider normalization and missing-field handling.

### 13.2 Repository tests

Against a controlled database:

- Exact selected attributes and ordering.
- MySQL `DECIMAL`, `DATE`, and nullable value normalization.
- Latest-value selection.
- Bulk buy/split/history queries.
- `stock_allocation()` output compared with the proposed direct mapping.
- No writes or schema synchronization.

### 13.3 Contract tests

#### DAM quote

- Exact five fields and numeric scalar types.
- Correct current account value, prior value, change, and decimal fraction `changePercent`.
- Existing auth/verified 401 messages.
- Existing 500 `server error` behavior.
- Lowercase DAM behavior explicitly decided.
- No PHP request.

#### Dashboard

- Gain-descending mover order.
- Held status matches current holdings.
- Pie allocation values reproduce the current displayed chart.
- Member holdings reproduce table values and totals.
- Non-member response contains no member-only amounts/shares.
- Data-quality failures are represented and visible or logged.
- DAM and SPY gauge values match current UI behavior.

#### Allocation

- Exact row membership and legacy order.
- Cash, indexes, sectors, stocks, summaries, and fund footer match.
- Display formatting is unchanged after moving formatting to React.
- Non-member receives the existing member-denied 401 once `ensureMember` is applied.

#### Position performance

- Exact purchase row membership and order.
- Price/benchmark gains match legacy rounding.
- Duplicate same-date buys and split cases are intentionally verified.
- Reopening a row uses cached client state rather than repeating the request.

### 13.4 Provider/session matrix

Test recorded fixtures for:

- Premarket (`earlyHours=true`, market not open).
- Regular market open.
- Extended/after-hours.
- Fully closed market.
- Polygon day price equal to zero.
- Missing one symbol with successful fallback.
- Missing one symbol with failed fallback.
- Provider HTTP/auth/rate-limit errors.
- Stale or missing `data_performance` values.

### 13.5 Front-end workflow tests

- Dashboard loads once without a duplicate DAM HTTP call.
- Heatmap held/open styling and gain order are unchanged.
- Pie labels, `Other` aggregation, sorting, and values are unchanged.
- Member holdings and DAM footer match.
- WebSocket updates still update cards/gauge correctly.
- Allocation displays identical values and row styles.
- Expanding Dashboard and Allocation rows retrieves only that symbol's performance.
- Technical selecting DAM either avoids the unused quote request or uses it visibly.

### 13.6 Operational checks

- Log provider calls and duration server-side without exposing timing fields in application responses.
- Compare SQL query count before and after each slice.
- Confirm no request reaches `damwidiMain.php?mode=returnIntraDayData` for migrated workflows.
- Monitor provider error/rate-limit frequency.
- If short-lived caching or in-flight request coalescing is introduced, verify freshness and failure eviction explicitly.

## 14. Recommended behavior changes requiring approval

These should be explicit decisions, not silent migration differences:

1. **Consistent numeric API values:** New focused endpoints should return numbers and let React format currency/percent strings. Visible formatting remains unchanged, but the internal API contract changes.
2. **Fix the fallback/exclusions path:** Normalize fallback quotes and return a valid incomplete response instead of reproducing PHP warnings/fatal behavior.
3. **Omit broken allocation `changePercent`:** It is unused and the formula is incorrect.
4. **ISO timestamp:** Prefer an unambiguous ISO-8601 `asOf` with offset. React can render the current title format.
5. **Stop Technical's unused DAM quote request:** The DAM-specific `SymbolDetail` ignores it.
6. **Normalize DAM case:** Treat `dam`, `Dam`, and `DAM` consistently in the quote route.
7. **Member enforcement for allocation:** Apply `ensureMember` to the new allocation and position-performance endpoints instead of relying on a hidden navigation link.
8. **Non-member real-time valuation inputs:** Decide whether shares should remain visible to non-members. The current `/openPositions` route exposes them even though the intraday response redacts them.
9. **Remove response timing/provider passthrough:** Keep diagnostics in logs/metrics rather than the public response because no consumer uses them.

## 15. Risks, assumptions, and unresolved questions

1. **Stored procedure definition:** `stock_allocation()` exists in the configured database, but its definition was not available with current permissions and its result contract still needs capture.
2. **Source of truth for shares:** Live valuation uses `data_performance.shares`; purchase performance reconstructs positions from transactions. Differences between the two must be detected and resolved deliberately.
3. **Premarket semantics:** Stored `1day` and `2day` values must be verified against current operational expectations.
4. **Fallback service:** Confirm the AWS/Yahoo service is still deployed, supported, and permitted before porting it.
5. **Provider timestamps:** Legacy 12-hour formatting is ambiguous and derives a maximum by string comparison.
6. **Same-date buys:** PDO unique-key behavior and transaction replay can produce duplicated purchase rows backed by one collapsed basis value.
7. **Split behavior:** Top-level and purchase-level performance do not apply split adjustment identically; only used purchase-level behavior should be preserved.
8. **Ordering:** Heatmap gain order and Allocation insertion order affect presentation and must be contract-tested.
9. **Mixed scalar types:** Legacy strings with commas/percent signs are embedded in client assumptions, especially `change.replace(...)`.
10. **Role behavior:** Current route comments, middleware, navigation, and payload redaction are not fully aligned.
11. **Caching:** A short snapshot cache or in-flight coalescing could prevent simultaneous provider calls, but it changes freshness semantics and should be introduced only with an explicit TTL and tests.
12. **External consumers:** Repository search cannot prove that no third-party or old PHP page calls the legacy endpoint directly.
13. **Existing Sequelize models:** Model/table mismatches must be corrected or bypassed with explicit read-only queries before intraday work uses them.
14. **Provider volatility:** Live PHP-versus-Node response comparisons are invalid unless both use the same recorded provider data and database state.
15. **Current open-positions endpoint:** Dashboard and Technical share `/api/damwidi/openPositions`; any consolidation must not break Technical's open-stock buttons.

## 16. Legacy functionality that can eventually be removed

After all consumers are migrated and the retirement conditions are met:

- `returnIntraDayData` front-controller case.
- PHP response builders:
  - `createHeatMapData`
  - `createPortfolioData`
  - `createPortfolioData_v4`
  - `createAllocationData`
  - `createPerformacneData`
- Server-generated chart colors/borders.
- Aggregate performance arrays.
- Response duration/status payload fields.
- Full raw quote-universe serialization.
- Broken allocation `changePercent` output.
- The eager per-position basis/split query pattern.
- The Node Axios proxy and old `GET_INTRADAY_DATA` Redux flow.
- Technical's unused DAM quote call.

Shared legacy functions such as `returnOpenPositions`, `loadSectors`, `calculateGain`, and provider adapters cannot be deleted merely because this endpoint is retired; they are used elsewhere in the PHP application. Any legacy deletion requires a separate authorized cleanup.

## Final recommendation

Decompose the endpoint around actual workflows, but share the underlying domain work:

1. Focused DAM quote through the existing route.
2. Lazy per-symbol performance.
3. Member-only allocation data.
4. Role-aware dashboard data.

Build repositories, provider normalization, numeric calculations, and portfolio valuation as reusable services first. Migrate the DAM quote branch first, then Allocation, then Dashboard while the old intraday proxy remains available to unmigrated consumers. Retire the oversized endpoint only after repository search, browser workflow validation, production traffic observation, and confirmation that no legacy internal caller still depends on it.
