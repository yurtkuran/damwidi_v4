# Executive Summary — `returnIntraDayData` Decomposition and Migration

> Living migration document. Last updated: 2026-10-30. Update this summary after each implementation phase, behavior decision, and production validation milestone.

## Decision

The legacy PHP `returnIntraDayData` endpoint should not be migrated one-for-one into Node.js. It combines live market data, Damwidi portfolio valuation, Dashboard data, Allocation data, and per-position purchase performance in one large response. These responsibilities serve different React workflows, have different data requirements, and should be migrated incrementally behind focused Node endpoints.

The endpoint is also expensive. A representative response was approximately 36 KB and contained 28 market symbols, 17 open positions, 32 allocation rows, and 16 position-performance records. With 16 open positions, one request performs approximately 40 SQL queries because purchase basis and split information are queried separately for each position.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Legacy analysis and consumer inventory | Complete | Detailed findings are in `return-intraday-data-decomposition-analysis.md`. |
| Polygon usage and cache analysis | Complete | The analysis recommends one shared, cached market-snapshot service. |
| Map-based migration design | Complete | The phased design is documented in `return-intraday-data-map-cache-migration-plan.md`. |
| Shared market-snapshot foundation | Local work in progress | Uncommitted services/config/tests exist locally, but they are not wired into application routes and are not part of the documentation branch. |
| DAM quote migration | Not complete | `/api/marketData/quote/DAM` still calls PHP `returnIntraDayData`. |
| Position-performance endpoint | Not started | Performance is still generated for all positions by the legacy endpoint. |
| Allocation endpoint and React migration | Not started | Allocation still consumes `/api/damwidi/intraDayData`. |
| Dashboard endpoint and React migration | Not started | Dashboard still consumes `/api/damwidi/intraDayData`; its DAM card can cause a second PHP call. |
| Legacy proxy retirement | Not started | `routes/damwidi.js` still exposes the PHP-backed intraday route. |

The application therefore still has two active Node-to-PHP paths for this functionality:

- `/api/damwidi/intraDayData` proxies the complete legacy response.
- The DAM branch of `/api/marketData/quote/:symbol` calls `returnIntraDayData` to extract the fund quote.

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

This local branch has no unique committed changes relative to its base and is behind current `master`. It must not be treated as evidence that the DAM quote has migrated. Market-snapshot foundation work exists only as local uncommitted/stashed work and needs to be completed, tested, and committed on an appropriate feature branch before the DAM route can use it.

## Front-End Usage

The React application has two direct consumers of `/api/damwidi/intraDayData`: Dashboard and Allocation. `/api/marketData/quote/DAM` is an indirect consumer.

- Dashboard uses selected heatmap, allocation, holdings, fund-value, and position-performance data. It ignores the complete raw `intraDay`, `marketStatus`, and `status` sections. Mounting Dashboard can invoke the PHP endpoint twice: once for Dashboard data and once for the DAM `IndexCard`.
- Allocation primarily needs allocation rows and purchase-performance information. It does not use the heatmap, portfolio table, raw quote universe, market status, or diagnostics.
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

Finish and verify the cache, Polygon batch/status functions, Yahoo fallback, repository reads, session policies, single-flight behavior, stale-data behavior, logging, and focused unit tests. Keep this phase independent from route and React changes. Local work exists but is not yet a committed, integrated implementation.

### Phase 2 — Migrate the DAM quote

Replace only the DAM branch of `/api/marketData/quote/:symbol` with the shared snapshot and portfolio-valuation services. Preserve its existing URL, authentication behavior, response fields, scalar types, and errors. This is the first route migration because its five-field contract is small while exercising the shared valuation path.

### Phase 3 — Add lazy position performance

Implement `/api/damwidi/positionPerformance/:symbol` and update expanded Dashboard/Allocation rows to request only one symbol. Reuse cached current prices and locally stored historical data; expanding a row should not unconditionally issue a fresh Polygon request. Replace the legacy per-position query pattern with reusable, set-based repository functions where behavior permits.

### Phase 4 — Migrate Allocation

Implement `/api/damwidi/allocationData` and migrate only the Allocation workflow. Preserve ordering, scalar types, access rules, and calculation semantics used by the current component. Fetch position performance lazily.

### Phase 5 — Migrate Dashboard

Implement `/api/damwidi/dashboardData` and migrate Dashboard. Include initial fund and market-card quotes in the response, keep presentation styling in React where explicitly approved, and use the lazy performance endpoint for expanded positions.

### Phase 6 — Retire `returnIntraDayData`

Remove the Node PHP proxy only after all known consumers have migrated, authentication and parity tests pass, production traffic shows no remaining calls, and legacy/internal callers have been audited. Remove the PHP implementation separately and only with explicit authorization.

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

The migration is not a syntax conversion. Legacy behaviors needing explicit decisions include potentially defective missing-quote fallback, ambiguous premarket semantics, same-date purchase lots, inconsistent stock-split treatment, ordering assumptions in React, and mixed numeric/string response types. Authentication and role behavior also require review because route middleware, comments, navigation restrictions, and response redaction are not fully aligned.

Existing Sequelize mappings must be verified against the real schema before use. Defects found in PHP should not automatically be reproduced, but they also must not be silently corrected. Every intentional behavior change should be documented and approved.

## Completion Criteria

`returnIntraDayData` is considered migrated only when Dashboard, Allocation, DAM quote, and lazy position performance all use Node services; provider requests are shared through the snapshot cache; parity and failure-path tests pass; production monitoring shows no remaining proxy traffic; and the legacy endpoint has no verified caller.

This document should remain the concise source of migration status. The decomposition, Polygon/cache analysis, and Map-based plan remain the detailed design references; update this summary whenever actual implementation status diverges from those plans.
