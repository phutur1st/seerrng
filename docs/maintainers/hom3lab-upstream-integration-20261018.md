# Hom3lab upstream integration — October 18, 2026

## Authority, source and recovery

The maintainer requested repeating the upstream update after another 20 commits.
The same fork-only publication, native CI, image, and HLOS deployment workflow
applies. Upstream remains fetch-only; no upstream push, pull request or release.
Implementation, integration review, test updates and this record are AI-assisted.

- Fork input: `a5c5800deff02aa88ca5b49c676f083672695654`.
- Previous upstream/common ancestor: `322d60ba985f8ea0344614b4303086212cc70021`.
- Pinned upstream: `10f06eab9a8c1852ea74d6dcf091d30fa061258a`.
- Initial divergence: 13 fork-only and 20 upstream-only commits.
- Recovery ref: `recovery/upstream-pre-20261018`.
- Integration branch: `integration/hom3lab-upstream-20261018` in an isolated worktree.

A forward merge preserves already published fork history. Upstream adds v3.67.0,
category-aware setup, age restrictions, cross-media discovery and editions,
share-to-request, following, Kobo collection sync and request server selection.
Native package scripts and `.github/workflows/ci.yml` remain authoritative.

## Resolution and preservation inventory

1. The sole textual conflict is `ReadarrAPI.addBook`. Retain the fork's selected
   format author profiles/path configuration before upstream's alongside-edition
   handling. An integration regression checks the author update occurs before
   wanted-edition tracking while preserving the other format's author fields.
2. Automatic subscriber merge retains the accepted-operation dispatch fast path,
   failed-status recovery and upstream edition policy/music release choice.
   Provider add/search remains skipped when replaying the matching accepted
   operation. Request identity, quality, format, user authority and original
   service target remain preserved. No live queue reconciliation is part of
   this update.
3. ROMarr standalone catalog/artwork/timeouts, Sportarr request artwork, verified
   format-specific availability and cleanup remain. New selection payloads and
   upstream routing restrictions are retained alongside them. Existing nullable
   availability fields and all fork migrations remain.
4. Native CI and fork image guards remain unchanged. New public-fork PR workflow
   is upstream-repository gated; its referenced reusable workflow cannot run on
   this fork's PRs. The optional gVisor manual smoke is not invoked. Main CI uses
   hosted runners; inherited publication and Helm release remain disabled here.
5. Scoped UI integration includes setup/age permissions, new related-tool links,
   discovery/edition/share/following screens, and their shared roles. Request
   cards, headings/status, navigation, poster and button owners remain. The
   upstream cross-media CSS declarations move intact into `globals.css`, the
   required shared owner, and its redundant imported file is removed. No visual
   redesign or whole-application audit is claimed. Existing legacy consumers
   outside this update remain outside its cleanup scope.
6. Required current-batch checks found new Setup/Share/Vibes labels spelling
   Ebook/Ebooks. They now consume Book/Books terminology, retaining internal
   format IDs and translation keys. Shared style-reference checks detected the
   separate CSS owner; consolidation fixes the source instead of weakening
   assertions. Standards and audit guidance record the ownership relationship.
7. Release-note preview detected upstream rewriting a previously shipped
   reader-delivery fragment. Preserve its shipped body and capture the Kobo
   SmartScope/Collection distinction in a new structured fragment instead.
   Authentic release tags and append-only history remain unchanged.
8. Upstream Docker appdata warnings are retained; startup configuration and
   mounts must be checked before deployment. New SQLite/PostgreSQL migrations
   remain paired; tests use isolated data, never production as a merge fixture.

## Verification and evidence

Runtime: Node 24.21.0 / pnpm 10.24.0, frozen lockfile. Full hosted native CI,
image publication and HLOS live verification remain pending on this source.
Current source is an integration candidate, not a completed deployment.

- Server/client type checks: passed before subsequent label/CSS-only changes.
- Current-batch/style checks: passed after source corrections; 72 style tests.
- Initial focused Vitest invocation without sandbox network access failed
  loopback tests and was interrupted. It is not a passing run. The rerun uses
  the existing isolated fixtures with loopback access.
- Initial new alongside test omitted the capability contract in its fixture;
  the assertion correctly detected skipped author configuration. The fixture
  now advertises the same explicit Bookshelf contract as the existing tests.
- Focused/final results, CI identities, visual evidence and deployment receipts
  are recorded under ignored `artifacts/upstream-integration-20261018/` in the
  shared workspace once available; no runtime backups or credentials go in Git.
- Readarr adapter: 44 Vitest tests pass. Focused native Node: 95 pass, zero
  failures/skips (adapter, subscriber and new OpenAPI surface).
- Production build and bundle budget: passed. Format, lint (warnings), workflow
  boundaries (33 workflows), and changelog coverage (153 tags): passed.
- Initial cumulative Vitest: 4246 pass / 5 skips / 1 failure during fixture
  login (HTTP 401), before its malformed-book-ID assertion. An isolated repeat
  passes. The initial suite is not claimed as passing; a lower-concurrency full
  rerun passed 4247 tests with 5 PostgreSQL skips; hosted CI remains required.
- Upstream CI 39188147581 at the pinned source fails format and browser build
  prerequisites on the same five formatting files and Ebook terminology;
  corrections here retain the existing assertions and required gate.
- Native compilation caught a missing required title in the new test fixture;
  corrected before the 95-test native pass. No application type errors remain.
- Initial desktop/narrow previews of Share, Following, Game Finder and Book
  Vibes exposed new framed cards missing the established padded surface role.
  New cross-media consumers now attach refreshed-card-surface or
  refreshed-inset-surface as appropriate, preserving the existing shared paint
  and padding owners. A browser regression verifies actual computed padding
  and horizontal containment at both widths. Initial captures remain iteration
  evidence; final rendered evidence is collected separately.
- Card-spacing browser regression: all 8 desktop/narrow cases pass with computed shared padding and no horizontal document overflow. Production build, bundle budget, and 72 style tests pass after the role attachments.
- Visual inspection: final captures pending; initial preview evidence is not claimed as acceptance of provider-backed states. Automated checks are separate evidence.
- Live provider mutation/new request submission: not performed or required.

The earlier October 17 deployment finished on a5c5800: native CI run
39058387469, fork image run 39061754915 and Compose deployment run 39062482548
passed. Its existing requests 811/812 were reconciled successfully; those prior
results do not verify this new candidate.
