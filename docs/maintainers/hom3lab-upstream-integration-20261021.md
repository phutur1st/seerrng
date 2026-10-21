# Hom3lab upstream integration — October 21, 2026

## Source, authority and recovery

1. Maintainer authorized preparing the upstream catch-up and emphasized Bookshelf preservation. The maintainer explicitly selected upstream's slate/blue default theme and 24px controls (28px for coarse pointers). Upstream remains fetch-only with a disabled push URL. No live provider requests, retries or database changes are test actions.
2. Fork input: `0ed814d05ca6dd9b8d7ef4b7c1e13488d1d5d6a8`; pinned upstream: `2bae695931409a5b059afca220d166ffcf31dfc6`, 42 upstream-only commits. Recovery ref `recovery/upstream-pre-20261020-refresh` preserves the fork input; isolated branch `integration/hom3lab-upstream-20261020-refresh` uses a forward merge to preserve published history.
3. AI assistance covers source review, integration, regression tests and records. Inherited attribution is preserved. Private disposable evidence: `/private/tmp/seerrng-evidence-20261020` (three-way inventory and check logs).

## Bookshelf preservation review

- Upstream adds provider-ID-first lookup, with Chaptarr provider prefixes and bounded transient retries, before ISBN/title fallback. The fork's accepted-operation guard stays before lookup or provider writes. Existing BookRequestSearch rows and target identities remain durable on replay.
- Reproduced an integration regression: a numeric Bookshelf catalog work ID was sent as `384057` instead of `work:384057`. Preserve Bookshelf's explicit work prefix for numeric non-ISBN IDs; Chaptarr retains its hc/gr dialect. Valid ISBNs and already qualified identities remain unchanged. The prior subscriber fixture now stubs provider discovery, with the network guard retained.
- Upstream's new dispatch test expected COMPLETED without verified files. The replacement checks APPROVED, no verified availability, exact provider/edition identity, quality/metadata profiles, root folder and target format, plus one durable operation/no second add on replay. Both ebook and audiobook, successful identity and ISBN fallback paths are covered.
- Adopt sequential completed-request saves to avoid concurrent subscriber savepoints. New negative coverage rejects batched/overlapping writes and keeps audiobook/both requests Approved until the audiobook file arrives, even when an ebook and both provider links exist.
- `bookAvailability.ts`, the Readarr scanner and the Sonarr v5 payload fix are unchanged from the deployed fork. Format-specific author/profile/path and alongside-edition tests are retained. No provider admission is treated as proof of an imported file.

## Interface and history resolutions

- Keep the renamed Book Recommendations implementation with the fork's inset-surface padding role. Keep cross-media roles in globals.css and remove the resurrected competing stylesheet/import. New Services grouping declarations move into descriptive shared settings roles; its category grid and hidden state use the same owner, preserving upstream grouping and routing.
- Adopt upstream theme, target geometry, image throttling, responsive/overflow and light-mode corrections, plus their tests. Update current standards to the explicitly selected default heading/artwork treatment. Preserve Request-page, typography, poster and status owners, Sonarr defaults and requested-season availability.
- Preserve the shipped discovery fragment and append-only changelog wording; new upstream notes describe the current renamed feature.

## Verification status

Confidence: high in the reproduced Bookshelf regressions and source inventory; final compatibility remains unverified. Initial dependency install failed for missing node-gyp; installing the prerequisite in temporary storage allowed the unchanged frozen lockfile to install. Runtime Node 24.21.0 / pnpm 10.24.0. The initial native test attempt used macOS's symlinked /var temporary path and failed the log-directory security check; subsequent runs use canonical /private/tmp without weakening that check.

Initial focused run failed on the new premature-COMPLETED assertion and the old fixture's unstubbed provider discovery. The next run reproduced the missing work prefix with discovery stubbed. These failures remain recorded. Server typecheck and the current-batch/style checks (73 geometry tests) passed before the subsequent regression additions. Final focused/full checks, production build and separate visual evidence remain pending. No new source, image or deployment is published by this record.

## Verification follow-up

- Focused native provider/dispatch/availability/subscriber/Sonarr run: 171 passed, zero skips/failures. Added HTTP facade fixtures then passed 49 adapter cases (including both formats on the Readarr-branded Bookshelf contract). The earlier full scanner-inclusive run passed 182/185 and failed only the two subscriber assertions plus their network-guard after-hook; it is retained as a failure.
- Separate read-only HLOS diagnostics identify both providers as Readarr-branded BookshelfNG 0.4.21.65, gr dialect, format-scoped routes, format-specific paths and availability statistics. Only GET status/capabilities were used; this is not a request round-trip or permission to migrate providers.
- Production build, server/client types, formatter, lint (warnings), bundle budget, 443 shared-style/native-action tests and production dependency audit passed. Audit reports no known vulnerabilities. Workflow boundaries validate 36 workflows; release history covers 162 applicable tags.
- Initial complete Playwright: 67 passed / 2 failed, both fork card-padding fixtures still using removed /discover/vibes. Fixtures now target Book Recommendations, with the same real padding assertions and source-specific mock endpoint. Repeat remains required.
- Initial tooling: 275 passed / 15 failed. One outdated negative frame-color fixture still targets blue instead of the adopted theme token; update its mutation and required diagnostic together, retaining the negative test. Remaining failures require GNU stat/Bash and Helm, with a macOS temporary-directory group prerequisite, rather than weakened checks.
- Documentation security tests passed 10/10 and API generation passed. Docs build found an upstream attribution link outside the documentation plugin; replace it with the actual upstream NOTICE source link and rebuild.
- These are iteration results; full Vitest/native Node and final browser/tooling/docs evidence remain incomplete.

## Native gate and publication boundaries

- The complete first Vitest run passed 4,329 tests with five PostgreSQL skips (609 files passed, two skipped); the subsequent two-file run passed all 50 cases, including the two later facade regressions. A final full run is in progress.
- The first full native run passed 3,662 tests, skipped five and failed one file: upstream's new JSONEditor test uses import.meta under the native CommonJS runner. Preserve its Ace-worker assertion and use the same repository-relative path in both runners; focused native 1/1 and Vitest 50/50 pass. A complete rerun is required, rather than counting the failed run as passing.
- Tooling/security council passed 290 tests after prerequisites; adding explicit fork guards to both inherited image-alias promotion jobs then passed the complete council again with 291 tests, no skips, plus browser/server boundary scripts. Release-workflow checks pass 32/32. The fork image workflow and its same-repository, main-push, successful-CI requirements are unchanged. The new alias jobs are disabled in phutur1st/seerrng so they cannot target upstream registries.
- Semgrep completed (622 rules, 3,287 files, 30 reported matches), using upstream's existing report-only mode; this is not a zero-findings result. The fork image checkout match is constrained by the tested successful same-repository main-push guard. Remaining matches include guarded filesystem paths, escaped dynamic patterns, validated assignment and email-template URLs; their report is retained for context review, without adding suppressions or blanket exclusions.
- Strict docs build passed after the attribution-link repair; docs security 10/10 and API generation passed. Helm lint passed; Helm security cases are part of the passing tooling run. Hosted generated Helm documentation, Jellyfin bridge build/integration, CodeQL and external documentation links remain unrun locally.
- Card-padding browser fixtures pass all eight desktop/narrow cases on the renamed route. The full browser rerun and local Cypress run remain in progress. Cypress uses its own seeded config and database, separate from preview and Playwright runtimes.
- Separate rendered inspection: inspected Services and Books settings at 1440/390, including grouping, compact actions and wrapping, and Book Recommendations at 390. Ten desktop/narrow fixture captures (Services, Books, Requests, Recommendations, Posters) record zero page errors and zero page-wide horizontal overflow; computed default action token is 1.5rem. The Whisparr-error fixture and Audiobookshelf test connection are disposable test state. This does not establish authenticated production UI or a live provider request round-trip. The phone poster-width decision remains pending separately.

## Final local results and browser follow-up

- Final complete native Node: 3,665 passed, five PostgreSQL skips, zero failures/cancellations; 3,670 tests in 724 suites.
- Final complete Playwright: all 69 passed. This includes requested-season status, missing-media edit, admin queue geometry, cross-media heading/padding, no self-429 and responsive detail/overflow cases.
- First complete Cypress/Electron on macOS: 192 passed, five failed, 32 pending (229 tests/56 specs). Three failures encode superseded 16px heights in Settings/Users and book/music management. Replace them with the maintainer-selected 24px target while preserving font, alignment and no-stretch checks. Theme chrome expects retired blackout and also inherits account preferences from other specs: reset the seeded account's palette/overrides through fixture-only APIs and assert the adopted slate chrome, retaining real picker save/reload verification.
- The fifth Cypress failure is the previously recorded unchanged Discover slider restoration case: expected 572, received 571.5 on macOS Electron. Its assertion and production restoration are not weakened. Hosted Linux Chrome evidence remains necessary; local Cypress is not yet a passing complete gate.

## Final source verification and remaining decisions

- Final complete Vitest: 4,331 passed, five PostgreSQL skips, zero failures (609 passed files, two skipped files). Together with the native rerun, both complete inventories include the new Bookshelf facade and portable JSONEditor tests.
- The unchanged carousel restoration assertion passes in Chrome for Testing 153 on macOS; the Electron half-pixel failure is browser-specific evidence, not a reason to loosen it. The complete Chrome attempt passed its initial specs and then stalled between specs after Bindery; it was stopped with exit 130 and is incomplete, not passing. Hosted Linux Chrome remains required.
- An intermediate Cypress fixture edit incorrectly applied 24px to the 16px form selection circle as well as ordinary actions; that expectation is restored to 16px while ordinary actions stay 24px. Classic's browser chrome uses its slate surface (1e293b), distinct from SeerrNG's gray surface (1f2937). Those current palette assertions and seeded account reset preserve real save/reload coverage. The affected three-spec repeat remains in progress.
- The formatter initially raced Playwright's generated .last-run.json deletion. Moving completed test reports outside source and rerunning the unchanged formatter passed. Type checks passed on the final implementation. No test exclusions or gate bypasses were added.
- Final fetch confirms upstream remains at the 42-commit pin. No source has been pushed, no image published and no HLOS deployment or provider request mutated by this integration. The fork's existing published source remains intact.
- Maintainer selection is still required for upstream's sub-390px two-column poster resize versus the written fixed-width poster standard. It remains preview-only until selected. Native CI, CodeQL, Jellyfin bridge, full hosted Cypress, generated Helm docs and external docs-link checks must run on the final candidate before release completion.

## Review checkpoint

The final affected Cypress/Electron repeat passes all 37 cases across Settings/Users layout, book/music management and theme persistence. The exact unchanged carousel assertion passes separately in Chrome. These receipts do not convert either the failed complete Electron run or the interrupted complete Chrome run into a passing full Cypress gate. Hosted Linux Chrome remains required. Final formatter and release-note preview passed; fourteen new user-facing fragments validate against the fork input. No shipped fragment or changelog entry was rewritten.

The three merge conflicts are resolved and the candidate is staged in the isolated worktree, not committed to its branch or published. An unreferenced two-parent Git object is used only for release-note preview, and its identity is recorded with the source inventory. A binary source patch and all local evidence are saved under the root checkout's ignored `artifacts/upstream-integration-20261021/` for recovery if temporary directories are cleared. The source checkpoint is a review preview, not a final release candidate: the phone poster-width decision and hosted checks remain outstanding.

## Maintainer layout selection and finalization

The maintainer explicitly selected upstream's two-column phone layout below 390px, superseding the fixed-width-only rule for that viewport range. The shared stylesheet, narrow poster geometry tests and browser cases already exercised this preview implementation; no runtime source changes are needed after that selection. Update the current poster standard to the accepted narrow-width exception while retaining the 169.2px desktop width, 2:3 frame and hover behavior. Earlier pending-decision entries are historical. The candidate can now proceed through the previously authorized fork-only CI/image/HLOS workflow; upstream remains fetch-only and live queue/provider mutations remain excluded. Final fetch still matches the 42-commit pin.
