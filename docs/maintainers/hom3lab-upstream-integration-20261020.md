# Hom3lab upstream integration — October 20, 2026

## Authority and source

1. The maintainer reported a TV season request (24, season 2) still showing Processing after the October 19 deployment, and new upstream commits. The maintainer authorized read-only HLOS database/log inspection for that diagnosis. Upstream remains fetch-only; its push URL remains DISABLED. No provider submissions, live request retries or service migrations are test actions.
2. Fork input/deployed source: `d675d0a44da0881a80d1f3c81afd3146b205b235`. Pinned upstream: `a2ae3cb234fb7b694e19e380e398b7dec141c4d2` (v3.71.1); common ancestor `881294bf7995e5a7aa0c6dae19b420ee15dd0bd1`. Four upstream-only commits; the merge is conflict-free.
3. Recovery ref: `recovery/upstream-pre-20261020` at the fork input. Isolated branch/worktree: `integration/hom3lab-upstream-20261020`, `/private/tmp/seerrng-upstream-20261020`. Private evidence: ignored `artifacts/upstream-integration-20261020/`.
4. AI assistance covers diagnosis, integration, implementation, tests and records. Inherited attribution remains intact.

## Diagnosis

Confidence: high. Read-only HLOS data shows the request completed and its requested season available after Sonarr imported it; the series stays partially available because other seasons are absent. The request card and request list item took TV status from the whole series. The card's status control renders only Available and Pending explicitly and labels every other status Processing, so any finished season request on a partially owned series stayed on Processing. Upstream has the same logic; this is inherited, not an integration regression.

## Changes

- Upstream: Episode Queue gate simplification in the TV request modal, owner Episode Queue settings test, software catalog platform mapping test and the v3.71.1 release preparation.
- TV request status now reflects the requested scope. Each requested, non-declined season must be available according to the library's own season status (4K-aware); request completion alone is not trusted. Completed episode selections count inside a partially available season. Deleted, blocklisted or season-less data keeps the series status. Both request card and request list item consume the shared helper.
- The change selects existing status branches. No style owner, role, copy or layout changed.

## Separate finding, not changed

Bookshelf requests 811/812 log `Sent request to Bookshelf` every five minutes. The retry job re-queues approved book requests without a terminal stage; the accepted-operation guard returns before any provider call, and status events are de-duplicated. The success log remains misleading and the retry does unnecessary work. Out of scope for this batch; no live change was made.

## Verification and limits

Runtime: Node 24.21.0, pnpm 10.24.0, frozen unchanged lockfile. Native package scripts and `.github/workflows/ci.yml` remain authoritative.

- New native helper cases: 8 pass, plus existing RequestCard identity cases. Server and client typechecks pass; ESLint, oxlint and formatting pass.
- New Playwright fixture covers finished and still-downloading season requests at 1440/390 widths. It fails both finished cases without the fix and passes with it. Clean production build, then the full Playwright suite: 53 passed, zero failures.
- Full Vitest: 4,302 passed, 5 PostgreSQL skips (605 files passed, 2 skipped).
- Full native Node: 3,637 passed, 5 skipped, 1 failed. The failure is a discover-route fixture login returning 401 in a server test unaffected by this client change; the isolated file rerun passes 146/146. The full-run failure is not counted as passing; hosted Linux CI on the exact commit remains required.
- Tooling, Cypress, CodeQL, Jellyfin bridge, documentation and Helm checks were not rerun locally for this batch; hosted CI owns them.
- Visual evidence: fixture card captures at desktop and narrow widths show Available with the shared success badge for the finished request. A narrow capture includes the fixed mobile menu over the card's lower edge; that is the capture position, not a layout change. No authenticated production visual verification is claimed.
