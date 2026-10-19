# Hom3lab upstream integration — October 19, 2026

## Authority and source

1. Maintainer requested another upstream integration and investigation of failing season requests. Upstream is fetch-only; its push URL remains DISABLED. No provider submissions, live request retries or service migrations are authorized as test actions.
2. Fork input/deployed source: `1949db7bf0ebb5c28d5d98660820a6c4ef5a10bb`. Pinned upstream: `f2d83c0e6553e6a7be858188e348d052b621d342`; common ancestor `10f06eab9a8c1852ea74d6dcf091d30fa061258a`. Actual divergence: 16 fork-only / 50 upstream-only commits. Published history is preserved with the previously accepted forward-merge workflow, without force-pushing.
3. Recovery ref: `recovery/upstream-pre-20261019`, pointing to the fork input. Isolated branch/worktree: `integration/hom3lab-upstream-20261019`, `/private/tmp/seerrng-upstream-20261019`. Private test evidence: ignored root `artifacts/upstream-integration-20261019/`. The prior deployment completion receipt is separately closed in the October 18 artifact directory.
4. AI assistance covers diagnosis, integration, conflict resolution, implementation, tests and records. Inherited attribution remains intact.

## Diagnosis

Confidence: high. Read-only HLOS logs show requests 820/821 rejected by Sonarr with HTTP 400 and `Language`/`SeasonType` validation failures. Live source is the fork input; Sonarr reports 5.0.0.2701. GET-only lookup evidence shows new series have a language and advertised `official` aired order but no selected seasonType. Existing series may carry seasonType; neither request configuration specifies an override. Upstream did not change the Sonarr adapter in this batch.

The adapter now keeps lookup language unless an explicit metadata-language override is selected. New v5 requests use explicit season order, then existing lookup order, then the advertised official order. It does not assume the first advertised order, invent a language, or send legacy languageProfileId to v5. Two regression cases use the live validation contract for new season/individual-episode requests, including profile, tags, root folder, monitoring and search boundaries. Existing override, legacy-v3 and existing-series tests remain.

Live lookup later found the affected title already present in Sonarr; that read is not evidence SeerrNG recovered the failed requests. No live retries or queue reconciliation were performed.

## Integration decisions and preservation

- Subscriber conflict combines Bindery dispatch with the fork's durable accepted-operation guard. Format dispatch uses verified per-format availability, preserving retry recovery rather than treating provider IDs as availability. Upstream shared Bindery dispatch is retained; no HLOS provider cutover is performed.
- ROMarr settings fixture keeps the typed recognition object/response assertion and adopts upstream category navigation. Existing preview/save assertions remain.
- Shared cross-media declarations remain in globals.css, with the established padded surfaces and layer order. Remove the resurrected import of the retired crossMedia.css and keep the authoritative style checker reading globals.css.
- Upstream responsive detail/settings declarations are moved intact to descriptive shared roles in globals.css; components consume those roles. Button module font declarations duplicate the established size owner and are removed. Upstream browser layout checks remain unchanged. This integrates upstream arrangement without adding a second stylesheet owner.
- Preserve the shipped reader-service fragment; its existing appended clarification and new upstream fragments describe current reader boundaries. No shipped release history is rewritten.
- Automatic overlap includes request status, cleanup, scanners, service admission, media identities and settings. Focused tests cover these paths and preserve accepted Bookshelf status recovery, format-specific paths/profiles, ROMarr standalone/catalog/artwork and Sportarr artwork. New 4K and per-user TV approval/default behavior retains upstream permissions and migrations for both databases.
- Preserve Request-page and shared heading/status/button/poster/layout owners. Audit scope is changed detail/settings/request/cross-media consumers, not a whole-application visual cleanup.

## Verification and limits

Runtime: Node 24.21.0, pnpm 10.24.0, frozen unchanged lockfile. Initial offline dependency install failed because a locked tarball was absent; online frozen install passed. Native package scripts and `.github/workflows/ci.yml` remain authoritative; no retired engine connected or required assertion weakened.

- Sonarr before fix: regression suite fails on the two new cases. After fix: 39 passed, zero failures/skips. Provider calls are mocked; read-only live lookup evidence is separate.
- Server typecheck passed. Shared style geometry tests: 69 passed. Shared style-reference check: 474 components inspected, passed.
- Focused request/Bookshelf checks, complete final gate and desktop/narrow visual evidence remain in progress. No publication/deployment claim is made for this candidate.

The initial focused run passed 115/116 tests. Upstream's new Bindery admission test expected COMPLETED immediately after receiving provider IDs while its operations remained monitoring. That conflicts with the accepted fork contract: provider admission is not verified availability. The assertion now requires APPROVED plus absence of verified eBook/audiobook files and AVAILABLE state, retaining all dispatch, format, provider and service-target assertions. Existing scanner/availability tests still verify eventual completion. This replaces an incompatible assertion with stronger current-state checks rather than bypassing it.

## Candidate check update

The final focused run passes all 116 request/Bookshelf cases. Production build, format, lint (warnings), server/client types, bundle budget, release workflow contract (48 tests), Helm security (7 tests after installing its missing prerequisite), and the full Playwright suite (47 tests) pass locally. Sonarr regression cases fail on deployed source and all 39 pass on the fix. Full Vitest/native Node remain running; the first Vitest attempt loaded the prior Bindery test expectation and was stopped rather than reported as passing.

Initial tooling: 276 passed / 14 failed / 0 skipped. Seven Helm failures were missing local executable and pass after its installation. Remaining deployment/package checks expose GNU stat/Bash requirements on macOS; browser/server boundary scripts also require mapfile absent from system Bash. These are unpassed local platform prerequisites, not waived gates or app fixes. Complete hosted Linux CI, CodeQL, Jellyfin bridge integration and full Cypress remain required before publication/deployment completion. No image or live service changed during this candidate work. Visual inspection is collected separately from the 47 automated browser results.
