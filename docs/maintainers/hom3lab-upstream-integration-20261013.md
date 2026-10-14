# Hom3lab upstream integration — October 13, 2026

AI-assisted implementation, source review, and verification with Codex.
Inherited snapetech and SeerrNG contributor attribution is preserved.

## Authority, sources, and recovery

The maintainer authorized trying the planned local integration and explicitly
excluded publication to upstream. No remote push, pull request, release, image
publication, deployment, provider mutation, or live database migration is part
of this work. Only a later explicitly authorized push may publish to
`phutur1st/seerrng`.

- Upstream source: `snapetech-org/seerrng` main,
  `b9aea6c55527c919a32191a7b2d49dcff1c8655c`.
- Published fork source: `phutur1st/seerrng` main,
  `f1d15b1bf747aae2e10d8065ef73b9892bae995c`.
- Original Bookshelf checkout: `da9f4a5697ea5877d0c150f1058e2224c7288052`.
- Common ancestor: `b9b752a8606e8f5436b50147cd3a64ae03893f04`.
- Published fork divergence before integration: eight fork-only and 116
  upstream-only commits. The older checkout had only two fork-only commits.
- Recovery refs: `recovery/hom3lab-pre-upstream-20261013` and
  `recovery/hom3lab-published-pre-upstream-20261013`.
- Pinned target ref: `integration/upstream-pinned-20261013`.
- Candidate branch: `integration/hom3lab-upstream-20261013`.
- Isolated worktree: `/private/tmp/seerrng-upstream-integration-20261013`.

The original checkout and published branch history remain unchanged. The
upstream remote has an explicit disabled push URL. Upstream publication workflow
guards retain their existing literal repository allowlist; it excludes this
fork even after the upstream organization rename. No upstream registry names
or inherited attribution were rewritten. The Hom3lab image workflow remains
limited to validated same-repository main pushes.

## Integration decisions and preservation

1. Forward-merge the pinned upstream into the published fork source. Preserve
   all eight fork commits, including standalone ROMarr/DAT capabilities,
   request identities, catalog covers, Sportarr artwork, slow DAT reads, and
   Bookshelf scanner reconciliation. Do not rebase published history.
2. `server/lib/requestStatus.ts`: combine the format-availability helper with
   upstream's active-season helper. Keep verified-format completion and new
   active-season/request-count behavior.
3. `server/subscriber/MediaRequestSubscriber.ts`: retain both availability
   helpers and upstream's active-season import. Keep Bookshelf admission
   approved until scanned format evidence exists, work-prefixed numeric
   identity lookup, format configuration, and evidence invalidation. Preserve
   upstream's Radarr/Sonarr recovery and active-season processing.
4. `.github/workflows/ci.yml`: combine fork repository guards with upstream's
   engine reconciliation dependencies for image publication and scanning.
   Preserve automatically merged deployment validation/scan dependencies.
5. `scripts/release-workflow.test.mjs`: assert the combined guard and dependency
   contract, retaining the fork image checks and inherited release checks.
6. Review automatically merged scanner, cleanup, subscriber, route, settings,
   API schema, and request-item changes against both pinned sources. Preserve
   nullable SQLite/PostgreSQL book-format availability migrations, backend
   identity invalidation, separate Audiobookshelf evidence, and upstream's
   runtime, package manager, lockfile, and dependency security changes.
7. Repair `server/routes/media.test.ts`'s partial TV metadata fixture. Upstream's
   stale-availability regression now reaches request routing, which reads
   keywords and other metadata. Supply those fields without weakening the
   assertions: stale availability blocks requests, clearing requires a verified
   empty inventory, and a new request becomes pending afterward.

## Automated verification

Iteration checks use temporary Node 24.21.0 and pnpm 10.24.0. A frozen-lockfile
install succeeded in the integration worktree. No dependency pins or lockfile
contents were changed relative to the pinned upstream.

- Focused fork preservation run: **15 files, 221 tests passed**, no skips.
  Coverage includes Readarr API/profile behavior, book availability/search,
  request status/cleanup, Readarr scans, subscribers, migration SQL, request-card
  identity, ROMarr contracts/routes/artwork, software preview, and service
  availability.
- Overlap run: **11 files, 400 tests passed and one failed**. The stale-series
  fixture failed before its expected assertion because keywords were missing.
  After the fixture repair, the complete media-route file passed **45/45**;
  the other ten files' **356 tests passed**. Combined focused coverage is
  **26 distinct files and 622 passing tests**, no final skips. This is focused
  evidence, not a complete engine result.
- Workflow regression checks: **33/33 passed**, no skips.
- Button geometry and Sportarr role checks: **72/72 passed**, no skips.
- Server and client TypeScript checks passed; Next route type generation passed.
- Conflict-file ESLint passed. Source contract check passed for 610 files;
  shared UI style check inspected 430 components; workflow boundary check
  validated 29 workflows. These are source assertions, not rendered evidence.

Earlier local attempts are not passing evidence: the default macOS temporary
path was rejected for containing `/var` symlinks before any tests ran; a
subsequent sandboxed run denied local fixture sockets and was terminated. The
successful focused run used `/private/tmp`, disposable test configuration,
in-memory databases, mocked providers, and permitted loopback fixture sockets.
The test bootstrap kept external networking blocked.

## Discovery and incomplete complete gate

The local engine JSON plan discovered **683 repository test files**: 538 Vitest,
58 native JavaScript, and 87 registered tooling files, with zero platform
exclusions in that plan. Discovery does not mean those files executed. Its
staged coverage remains planned-only: repository checks, CodeQL, build, and
browser validation, with full supplemental scope.

The initial no-flag Mode 1 attempt refused unmerged index entries. After
resolving and staging conflicts, the no-flag engine stopped during preparation:
`An actual read-only dependency reference is required`. It also observed the
host's BSD `find` rather than required GNU tooling. No validation stages were
completed. The upstream guide additionally blocks the shared-UID proof-parent
topology and directs complete verification to GitHub-hosted Mode 2. No engine
boundary was bypassed, no Mode 3 service was activated, and no focused run is
reported as full validation.

Complete Mode 2 on the exact candidate remains pending because publication is
not authorized in this work. The candidate is a recoverable local checkpoint,
not a validated release or finalized integration. Any later candidate repair
requires fresh applicable verification; upstream must be refreshed and repinned
before finalization if it has advanced.

Local iteration logs and discovery JSON are retained outside tracked source
under `/private/tmp/seerrng-integration-*-20261013.*`. They are temporary local
receipts, not hosted artifacts or proof of a complete gate.

## Visual inspection and live integration

No source-built desktop/narrow render inspection, physical interaction check,
or live provider round trip was performed. A production preview build was not
created outside the incomplete engine. Preserve accepted Request/Series and
shared heading/status/button/poster/layout work; review affected request cards,
navigation, discovery, filters, and request controls in bounded asset batches
when a preview is available. Automated source/role checks do not establish
rendered correctness. No live configuration, account, queue, or database was
used for tests.
