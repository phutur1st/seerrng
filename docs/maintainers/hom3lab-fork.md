# Hom3lab fork maintenance

This fork is maintained at `phutur1st/seerrng`. `origin` is the only publication
remote. `upstream` points to `snapetech/seerrng` for fetching and has a disabled
push URL. Do not create pull requests or publish to upstream.

## Source and updates

The starting source is SeerrNG 3.58.0, commit
`b9b752a8606e8f5436b50147cd3a64ae03893f04`. Changes are on
`hom3lab/bookshelf-fixes` and are published to this fork's `main` for its existing
validation engine. Keep the branch based on upstream without rewriting published
history:

```sh
git switch hom3lab/bookshelf-fixes
git fetch upstream
git merge upstream/main
# Review conflicts and validate the integrated candidate.
git push origin hom3lab/bookshelf-fixes:hom3lab/bookshelf-fixes HEAD:main
```

No pull request is necessary. Preserve inherited attribution, release notes,
checks, and lockfile/runtime pins when integrating upstream changes.

## Fixes and boundaries

1. Numeric Bookshelf work identities are looked up using `work:` before generic
   numeric search. Request acceptance leaves the request approved; only scanned
   evidence for its requested format completes it and emits availability.
2. SQLite and PostgreSQL migrations add nullable eBook/audiobook availability.
   Existing backend links are not backfilled as proof of files. Library scans
   refresh those values after upgrading. Audiobookshelf item presence remains a
   separate source of audiobook availability.
3. When Bookshelf advertises format-specific paths, the selected format's author
   profile, metadata profile, and folder are configured before returning an
   already-monitored book. The other format and default author settings remain
   intact. Legacy providers without that capability keep their existing behavior.
4. Notification title lookup falls back to Bookshelf metadata. Recent-request
   cards preserve Bookshelf identities and support Sportarr metadata/artwork.
5. Upstream CI image publication and deployment, preview publication, and release
   entry points have repository guards. Fork images publish exclusively to
   `ghcr.io/phutur1st/seerrng` after the fork's successful main push CI run.
   Tags are `hom3lab` and the full `sha-<commit>`; deployment should pin a digest.

The image workflow builds Linux amd64 for HLOS. It does not deploy an application
or change Compose/Komodo resources. Once a validated fork image is deployed,
remove the compiled-file startup workarounds from that deployment in the same
change; applying both implementations is unsupported. Back up the database
before upgrading. The separate Bookshelf issue affecting file-record cleanup
across author format directories is outside this SeerrNG change.

## Verification record

Implementation and review are AI-assisted. Checks use Node 24.15.0, pnpm 10.24.0,
and the upstream lockfile. Focused evidence covers availability, author settings,
request dispatch, format scans, migration SQL, and recent-card identifiers. The
PostgreSQL migration SQL is also exercised through SQLite for portability; this
is not a live PostgreSQL integration test.

Server/client type checks and workflow boundary checks are separate from rendered
UI or live-provider evidence. No tests target production configurations, databases,
queues, or accounts. The complete Mode 2 validation engine runs on the exact
commit pushed to this fork's `main`. Its successful result is required before
image publication; focused tests or plan discovery alone are not a completed
gate. Visual inspection of the source-built cards and live verification of a
fork image remain separate evidence to collect when a preview/deployment exists.

The local Mode 1 plan was inspected: 665 discovered test files before the final
regressions were added. Linux CI owns the complete platform-specific inventory;
that local discovery count is not an executed or passing test count.
