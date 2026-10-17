# Hom3lab upstream integration — October 17, 2026

## Authority and pinned source

The maintainer requested repair of eBook/audiobook request failures after successful
Bookshelf submission and an upstream update. The maintainer explicitly selected
upstream native CI in place of the retired validation engine. Upstream is fetch-only;
no upstream push, pull request, merge or deployment is part of this work.

- Fork source: `43e4f75453b8f8b41d3a5a8fc26b7da7bcc3bb61`.
- Pinned upstream: `322d60ba985f8ea0344614b4303086212cc70021` (v3.66.0).
- Previous integrated upstream: `b9aea6c55527c919a32191a7b2d49dcff1c8655c`.
- Initial divergence: 11 fork-only and 249 upstream-only commits.
- Recovery ref: `recovery/bookshelf-status-pre-20261017`.
- Candidate: `integration/hom3lab-upstream-20261017`, isolated worktree.

Use the fork's documented forward-merge workflow to preserve published history.
No force push or rewritten upstream/fork release history is required. Attribution,
shipped release fragments, current lockfile and runtime pins remain intact.
Implementation, conflict review, tests and this record are AI-assisted.

## Reproduced failure and repair

Read-only HLOS evidence showed accepted requests with a local provider book ID,
monitoring search operation and saved format-specific service target, followed by
coarse FAILED status. Sanitized machine logs identify the exact error:
`UNIQUE constraint failed: book_request_search.requestId, book_request_search.format`.
The durable dispatch retry was inserting a new operation for an already accepted
request. Neither a service link nor acceptance proves file availability.

The subscriber now reuses active operations belonging to the selected format and
service target, preserving command/search progress instead of adding the book again.
An incomplete or terminal operation is updated by its existing primary key during
redispatch. Successful recovery records retry history, restores APPROVED status and
refreshes status projection. Normal dispatch retries recover affected requests;
there is no production database rewrite or forced queue execution.

Regression coverage includes eBook replay, recovery from persisted FAILED status,
audiobook progress preservation, partial both-format retry, real dispatch failures,
and nullable verified availability. Tests use disposable databases and mocked
providers. No live requests, provider queues, files or statuses were mutated.

## Integration resolutions and preservation

1. Native CI replaces engine jobs and retired engine-binding tests. Native Linux
   runner/shard and release dependency assertions follow upstream. The owner image
   workflow still requires successful same-repository main push CI and publishes
   only `ghcr.io/phutur1st/seerrng`. Inherited upstream publication guards remain.
   Upstream's stable semantic release-tag boundary check is retained alongside
   fork publication tests. An optional guard-name update was rejected by automatic
   approval review as publication risk and was not applied.
2. API schema retains nullable eBook/audiobook availability and adds upstream
   service-status schemas. Public settings retain standalone emulation-catalog
   availability and upstream swipe availability. Notifications retain both
   Bookshelf metadata fallback and upstream Stash identity normalization.
3. ROMarr keeps standalone catalog/artwork/provider capability behavior while
   adopting upstream's named DAT timeout and force-refresh cache handling.
4. The TV metadata fixture keeps the fork's routing fields alongside upstream's
   test changes. Shared UI style owners and upstream functional/security changes
   are preserved; no new design or global CSS change was introduced by conflict
   resolution. Request cards retain Bookshelf/Sportarr identity and artwork,
   verified book-format availability and upstream failure details.
5. Existing fork availability migrations, scanner evidence invalidation, format
   profiles/paths, cleanup behavior and service authority checks remain. New
   upstream migrations are retained for both supported databases.
6. The fork AGENTS router remains with native verification instructions, following
   the maintainer's explicit CI decision. The current upstream UI guides already
   describe native checks; historical validation records remain historical.

## Verification and remaining evidence

Runtime: Node 24.21.0 and pnpm 10.24.0; frozen upstream lockfile installed.

- Production build, server/client type checks, lint, formatting and bundle budget:
  passed. Lint emits existing warnings; it exits successfully.
- Focused subscriber regression: 47 passed under Vitest. Native-runner results
  and final cumulative counts are recorded in the completion receipt.
- Workflow/release guard tests: 37 passed.
- Initial cumulative Vitest: 4188 passed, 1 failed, 5 skipped. The failed test
  replaced a mock twice under the Vitest compatibility shim; it was corrected
  to inspect the original mock. The corrected focused run passed. This initial
  run is not claimed as a successful final gate.
- Native tooling on macOS: 272 passed, 14 failed. Missing GNU `stat`, Helm and
  Linux fixture prerequisites prevent a complete native tooling pass here.
  Assertions and test inventory were not weakened or excluded.
- Final Vitest/native Node and browser results: pending completion receipt.
- Linux native CI, CodeQL, Jellyfin container smoke, documentation and Helm:
  unrun on this candidate; required hosted verification remains outstanding.
- Visual inspection: not yet collected for this candidate. Automated browser
  results are separate evidence and do not prove rendered preservation.
- Live integration: read-only diagnosis only; no post-fix deployment/provider
  round trip is claimed. HLOS continues running its previously deployed image.

No push, release, image publication or deployment has been performed for this
candidate. The original root checkout remains at the recovery source.
