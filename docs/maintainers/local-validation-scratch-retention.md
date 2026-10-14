# Local Validation Scratch Retention

The validation engine owns per-run temporary workspaces and removes them only
when its lifecycle cleanup succeeds. An interrupted run can leave temporary
workspaces or bundles behind.

On the configured Linux development host, a separate daily host task removes
top-level `/tmp/seerrng-*` entries after every item beneath them has been
unmodified for at least 48 hours. It retains paths referenced by a live
process's command line, working directory, executable, environment, or open
file descriptor, and skips paths used as a mount source or mount point in a
live mount namespace.

This host policy is a final cleanup path for abandoned scratch. It does not
replace the validation engine's cleanup proof, change what counts as a
successful run, or remove persistent evidence outside `/tmp/seerrng-*`.
Tooling that leaves disposable validation bundles or worktrees in `/tmp`
should use a unique top-level `seerrng-*` name. Keep evidence that must survive
the 48-hour scratch window in a persistent location.
