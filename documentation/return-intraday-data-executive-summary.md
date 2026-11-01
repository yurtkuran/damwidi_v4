# Executive Summary — `returnIntraDayData` Decomposition and Migration

> Living migration document. Last updated: 2026-10-31. Update this summary after each implementation phase, behavior decision, and production validation milestone.

## Decision

The legacy PHP `returnIntraDayData` endpoint should not be migrated one-for-one into Node.js. It combines live market data, Damwidi portfolio valuation, Dashboard data, Allocation data, and per-position purchase performance in one large response. These responsibilities serve different React workflows, have different data requirements, and should be migrated incrementally behind focused Node endpoints.

The endpoint is also expensive. A representative response was approximately 36 KB and contained 28 market symbols, 17 open positions, 32 allocation rows, and 16 position-performance records. With 16 open positions, one request performs approximately 40 SQL queries because purchase basis and split information are queried separately for each position.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Legacy analysis and consumer inventory | Complete | Detailed findings are in `return-intraday-data-decomposition-analysis.md`. |
| Polygon usage and cache analysis | Complete | The analysis recommends one shared, cached market-snapshot service. |
| Map-based migration design | Complete | The phased design is documented in `return-intraday-data-map-cache-migration-plan.md`. |
| Shared market-snapshot foundation | Phase 1 complete, merged, and deployed | Commits `87524ba`, `e25ab89`, and `403b92d`, merged through PR #69, add the cache, provider integration, repository read, observability, AWS/Yahoo fallback repair, tests, live smoke assertions, and CI execution. `feature/migrate-dam-quote` is the first route integration. |
| DAM quote migration | Complete, deployed, and production validated | `/api/marketData/quote/DAM` uses the shared market snapshot plus read-only portfolio valuation. The existing route, authentication, response fields, and error response are preserved. Production Node output exactly matches live PHP against production MySQL data. |
| Position-performance endpoint | Deployed and production validated; Allocation consumer migrated | The member-only lazy endpoint exactly matched live PHP for AMZN and split-adjusted XLK. Allocation now uses the per-symbol React cache/consumer; Dashboard remains on eager legacy performance data. |
| Allocation endpoint and React migration | Complete, deployed, and production validated | The focused member endpoint, numeric domain response, Allocation React migration, and lazy purchase loading were merged through PR #73. Production visible values, row order, fund totals, data quality, and expanded-position results match PHP. |
| Dashboard endpoint and React migration | Complete, merged, deployed, and rendered-smoke validated | PR #74 deployed the focused authenticated endpoint, role-aware projection, shared initial index quotes, React migration, and lazy position performance. The deployed asset matches the validated local build and contains no legacy intraday call. |
| Legacy proxy retirement | Phase 6 branch created; removal gated | `feature/retire-return-intraday-data` is based on deployed `master`. The proxy remains until an authenticated production endpoint check and an agreed no-traffic observation/log audit are complete. |

Production now has one active Node-to-PHP path for this functionality:

- `/api/damwidi/intraDayData` proxies the complete legacy response.

The deployed DAM branch of `/api/marketData/quote/:symbol` no longer calls `returnIntraDayData`.

## Relevant Branch Review

### `feature/migrate-return-transactions`

This branch was merged into `master` through PR #57. Despite its name, it migrated several independent PHP endpoints and added useful patterns for this work:

- `returnTransactions` now uses the read-only Sequelize `Transaction` model.
- `returnDamwidiOHLC` now uses Node database/service logic.
- `returnSectorTimeframePerformanceData` now uses a Node service.
- `returnAboveBelow` now uses Node configuration and service logic.
- Shared market calculation and market-data repository code was introduced.
- The detailed `returnIntraDayData` decomposition analysis was added.

These changes reduce the remaining PHP surface and provide examples for read-only models, repository functions, service modules, route integration, and parity testing. They do not, however, migrate any current `returnIntraDayData` consumer.

### `feature/migrate-dam-quote`

The original local branch contained no unique committed changes and was deleted after the shared foundation merged. The replacement `feature/migrate-dam-quote` branch implemented Phase 2 with read-only repository and portfolio-valuation services and was merged through PR #71. The deployed authenticated route returned the expected five-field response twice, the second request was consistent with cache reuse, and every numeric field exactly matched live PHP.

## Front-End Usage

The deployed React application has no remaining direct consumer of `/api/damwidi/intraDayData`. Dashboard uses `/api/damwidi/dashboardData`, Allocation uses `/api/damwidi/allocationData`, and `/api/marketData/quote/DAM` no longer depends on the legacy response. The PHP-backed Node route remains available only during the final authenticated validation and caller-observation gate.

- Dashboard now receives only market movers, allocation summary rows, a role-appropriate holdings projection, data quality, the DAM fund quote, and initial DAM/SPY/QQQ/DIA quotes. Its four `IndexCard` components use those initial quotes instead of making separate startup requests, and expanded member positions use the lazy position-performance endpoint.
- Allocation now receives only its allocation rows and fund summary from `/api/damwidi/allocationData`; purchase performance is requested by symbol when a row is first expanded. It no longer fetches the heatmap, portfolio table, raw quote universe, market status, diagnostics, or eager performance for every open position.
- Purchase performance is calculated for every open position on every legacy request, although React needs it only after a user expands a position.

Several legacy fields have no known React consumer, including server-generated chart colors, most `portfolioTable` values, aggregate performance chart arrays, raw market-status data, response timings, and portions of the raw quote and allocation data. They should not be carried forward without a verified consumer.

## Target API

| Endpoint | Purpose | Market-price requirement |
|---|---|---|
| `GET /api/marketData/quote/DAM` | Current Damwidi fund valuation; retain the existing public contract | Held positions from the shared snapshot |
| `GET /api/damwidi/positionPerformance/:symbol` | Lazy purchase-lot and SPY performance for one expanded position | Requested symbol and SPY, preferably from cache |
| `GET /api/damwidi/allocationData` | Detailed member-only allocation data | Held positions and SPY |
| `GET /api/damwidi/dashboardData` | Dashboard overview, allocation summary, fund quote, and holdings | Shared tracked-symbol snapshot plus benchmark/card symbols |

These endpoints must share services rather than independently calling Polygon. The Dashboard response should include the initial DAM, SPY, QQQ, and DIA card data so it can replace redundant startup requests; existing WebSocket updates can continue after the initial load.

## Shared Market-Snapshot Architecture

Naively splitting the endpoint would multiply Polygon calls. The target design therefore uses a shared `MarketSnapshotService` with:

- a process-local `Map` cache, appropriate for the initial single-container DigitalOcean deployment;
- normalized per-symbol quote entries so overlapping symbol sets can be reused;
- Polygon batch retrieval and market-status handling;
- AWS-hosted Yahoo fallback for symbols missing from Polygon;
- session-aware freshness rules for open, premarket, after-hours, and closed markets;
- single-flight/in-flight Promise reuse so simultaneous stale requests share one provider request;
- stale-cache fallback where appropriate when an upstream provider fails;
- shared logging and provider-call metadata suitable for validation.

The service should expose reusable snapshot and quote operations. Route handlers should not call Polygon or Yahoo directly. A distributed cache such as Redis is unnecessary while the application runs as one Node process, but the cache abstraction should remain replaceable if deployment topology changes.

## Revised Migration Sequence

### Phase 0 — Capture parity fixtures

Capture deterministic database and provider fixtures for normal market operation, premarket, missing quotes, upstream failures, member/non-member access, multiple purchases, dividends, partial sales, closed positions, and stock splits. Sequential live PHP/Node requests are insufficient because prices can move between calls.

### Phase 1 — Complete the shared market-snapshot foundation

Phase 1 is complete. The cache, Polygon batch/status functions, Yahoo fallback adapter, repository read, session policies, single-flight behavior, observability, and focused tests were merged into `master` through PR #69 as commits `87524ba`, `e25ab89`, and `403b92d`. Deterministic tests cover every configured session TTL, concurrent refresh/fallback coalescing, projection isolation, and provider failure/retry. A live read-only smoke test returned one complete 24-symbol snapshot through one Polygon status request and one batch request, then reused the cache. CI runs the focused tests before building the Docker image. Phase 1 intentionally contains no route or React migration.

The AWS fallback Lambda was repaired to use Yahoo's structured chart response instead of obsolete HTML selectors, deployed, and tested live. AAPL and SPY returned usable numeric current prices, previous closes, and market timestamps through the Node adapter; an invalid symbol returned `null` as expected. Lambda unit tests and market-snapshot integration tests pass. The application deployment on `app.damwidi.com` also passed anonymous routing and static-asset smoke tests. The foundation remains dormant until a migrated route loads it.

### Phase 2 — Migrate the DAM quote

Implemented on `feature/migrate-dam-quote`: only the DAM branch of `/api/marketData/quote/:symbol` now uses the shared snapshot and portfolio-valuation services. The existing URL, `auth` and `ensureVerified` middleware, five response fields, numeric scalar types, and `500 "server error"` response are preserved. Non-DAM quote behavior and React consumers are unchanged. Focused tests cover the repository projection, PHP-compatible percentage rounding, response contract, missing inputs, cash-only portfolios, dependency composition, and removal of the PHP call. CI runs these tests alongside the market-snapshot and Lambda suites.

A live local run used ten held symbols, completed through one Polygon batch request, returned no excluded symbols, and reused the cached snapshot on the second request. After configuring Node to use the production MySQL database, the latest `data_value` row was dated 2026-10-30 and Node exactly matched the simultaneously captured live PHP response for `latestPrice`, `previousClose`, `change`, and `changePercent`, with zero numeric difference in every field. The deployed authenticated route subsequently returned HTTP 200 with the same exact parity; consecutive responses were identical and the second response was materially faster, consistent with cache reuse. Phase 2 is complete.

### Phase 3 — Add lazy position performance

The backend portion was merged through PR #72 and deployed. `GET /api/damwidi/positionPerformance/:symbol` uses `auth` and `ensureMember`, validates and normalizes the symbol, returns only the fields used by expanded rows, and returns `404 {"msg":"position not found"}` for a symbol without an open position. Its repository reads one symbol's transactions, splits, locally persisted previous close, and the distinct historical SPY closes needed by its purchase dates. Current symbol and SPY prices come from the shared market snapshot, so a fresh upstream request is not unconditional and simultaneous/overlapping consumers retain the foundation's cache and single-flight behavior.

Legacy-compatible details discovered during live parity testing are intentional: a same-date duplicate purchase remains a separate response row while all purchases on that date use the first database purchase basis, split adjustments include purchases made on the split date, and `pricePreviousClose` uses the session-appropriate locally persisted `data_performance.previous` or premarket `2day` value rather than Polygon's provider-relative previous close. The focused endpoint converts that previous close to a number as specified by the decomposition contract. Production read-only comparison matched the complete focused PHP subset for AMZN (7 purchases) and split-adjusted XLK (24 purchases). Production returned the expected missing-token and invalid-token 401 responses, validation 400, missing-position 404, and member 200; consecutive member responses were identical and materially faster on the second request, consistent with cache reuse. The non-member denial path passed the local route test; direct production verification still requires a production-signed non-member token.

PR #73 added the reusable React per-symbol action/state cache and migrated Allocation `PurchaseTable` to request the endpoint only on first expansion. Collapsing and reopening a row reuses Redux state. Dashboard `PositionDetail` remains the final lazy-performance consumer to migrate in Phase 5.

### Phase 4 — Migrate Allocation

Completed and merged through PR #73: `GET /api/damwidi/allocationData` uses `auth` and `ensureMember`, composes one shared market snapshot with read-only `data_performance` rows and `stock_allocation()`, and returns numeric `fund` and `rows` data plus an `asOf` timestamp and data-quality status. React formats the numeric values to preserve the existing display and no longer requests `/api/damwidi/intraDayData` from the Allocation workflow. Purchase performance loads lazily and is cached per symbol.

The stored procedure remains the stock-to-sector authority. Its current unmapped V row is intentionally excluded from allocation rows and the legacy allocation basis while V still contributes to DAM's current value; this preserves observed PHP behavior rather than silently correcting it. Production validation matched all 25 row keys in order, every UI-formatted amount and percentage, DAM current value/basis/change, and completeness metadata. Lazy expansion matched PHP for AMZN's 7 purchases and split-adjusted XLK's 24 purchases. Missing and invalid tokens returned the existing 401 responses, the member request returned 200, and the local route test covers the non-member denial path. Consecutive allocation and position responses were identical and materially faster on the second request, consistent with shared-cache reuse.

The deployed React asset (`/static/js/main.3cce9515.js`) exactly matches the local build containing the migrated Allocation source. Source inspection confirms the Allocation workflow has no `/api/damwidi/intraDayData` call; only Dashboard still invokes that route. The endpoint and deployed-bundle contracts were validated programmatically because an interactive rendered-browser session was unavailable. Phase 4 is complete.

### Phase 5 — Migrate Dashboard

Completed and merged through PR #74: `GET /api/damwidi/dashboardData` uses `auth`, one shared market snapshot, the existing allocation calculations, and portfolio valuation. It returns `asOf`, `fundQuote`, initial DAM/SPY/QQQ/DIA `indexQuotes`, gain-ordered `movers`, the Dashboard-only allocation summary, role-projected `positions`, and data quality. Non-members receive an empty `positions` array while retaining the public Dashboard projection.

React now derives heatmap presentation from `movers`, builds the pie from numeric summary rows, initializes all four index cards from the Dashboard response, and loads position performance through the existing per-symbol cache. The existing `/openPositions` request remains temporarily because it supplies shares for Finnhub WebSocket updates. Real-time DAM valuation starts from the complete server fund value and applies live price deltas, preserving CASH without exposing it as a position.

Deterministic tests cover response fields and scalar types, gain ordering, premarket previous-close behavior, role projection, missing inputs, service composition, removal of frontend legacy calls, initial-quote reuse, and lazy performance wiring. A live read-only comparison matched all 23 movers and gains in order, all 18 allocation-summary rows, all 10 member positions, the DAM quote, and data-quality status. Local route validation returned the existing missing-token and invalid-token 401 responses, member and non-member 200 responses with the correct projection, and database-failure 500 `server error`. All prior migration suites still pass and the production React build compiles without application lint warnings; the existing Browserslist-data freshness notice remains.

Post-deployment validation confirmed production serves the exact Phase 5 asset (`/static/js/main.0286c6c3.js`). The bundle contains `/api/damwidi/dashboardData` and lazy position-performance calls but no `/api/damwidi/intraDayData` call. A rendered smoke test of that exact build showed four index cards, both charts, ten member holdings rows, no client exceptions, and no initial quote or legacy intraday requests. Expanding a position made one lazy performance request; collapse/reopen reused Redux state without a second request, and both expanded Highcharts SVGs rendered. Production returned the expected missing-token and invalid-token 401 responses, but the retained member test token has expired and the local signing secret does not match production, so authenticated production response validation remains outstanding.

### Phase 6 — Retire `returnIntraDayData`

Remove the Node PHP proxy only after all known consumers have migrated, authentication and parity tests pass, production traffic shows no remaining calls, and legacy/internal callers have been audited. Remove the PHP implementation separately and only with explicit authorization.

`feature/retire-return-intraday-data` has been created from deployed `master`, but no proxy code has been removed. Repository and deployed-bundle audits found no active React caller. Intentional parity scripts still call PHP directly, and the legacy PHP `buildAllocationTable()` helper contains an internal direct call even though no repository caller of that helper is known. The branch adds a temporary `[legacyIntradayProxy]` console event containing only timestamp and role flags so a deployed observation window can identify authenticated proxy traffic without logging tokens, user IDs, IP addresses, or response data. DigitalOcean log access is not configured in the development environment, so the observation must be performed from the deployment environment before removal.

## Validation Gates

Each phase should record evidence for:

- response field names, ordering, scalar types, date/number formatting, and empty-result behavior;
- authentication and authorization parity;
- calculations against fixed fixtures and representative production-shaped data;
- missing-quote, Yahoo fallback, stale-cache, and provider-failure behavior;
- provider-call counts, cache hits/misses, and concurrent request coalescing;
- confirmation that migrated workflows no longer reach the PHP endpoint;
- front-end behavior for initial load, refresh, WebSocket updates, and expanded rows.

## Risks and Decisions Requiring Approval

The migration is not a syntax conversion. Legacy behaviors needing explicit decisions include the defective legacy missing-quote fallback, ambiguous premarket semantics, same-date purchase lots, inconsistent stock-split treatment, ordering assumptions in React, and mixed numeric/string response types. The repaired Node AWS/Yahoo fallback is an explicit replacement for that legacy defect. Authentication and role behavior also require review because route middleware, comments, navigation restrictions, and response redaction are not fully aligned.

Existing Sequelize mappings must be verified against the real schema before use. Defects found in PHP should not automatically be reproduced, but they also must not be silently corrected. Every intentional behavior change should be documented and approved.

## Completion Criteria

`returnIntraDayData` is considered migrated only when Dashboard, Allocation, DAM quote, and lazy position performance all use Node services; provider requests are shared through the snapshot cache; parity and failure-path tests pass; production monitoring shows no remaining proxy traffic; and the legacy endpoint has no verified caller.

This document should remain the concise source of migration status. The decomposition, Polygon/cache analysis, and Map-based plan remain the detailed design references; update this summary whenever actual implementation status diverges from those plans.
