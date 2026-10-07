# Current focus

- Status: npm accepted JSswift/core/UI 2.0.0 and knowledge MCP 0.1.11.
- Scope: explicit incompatible jss CSS namespace migration, comment-free JS, priority guides, responsive resolution and cleanup improvements, conservative CSS deduplication.
- Verification: runtime/site builds, 64 unit, 25 browser and 6 knowledge/MCP checks pass; package dry-runs validate CSS entries and themes map.
- Release commit: 1260e78 (local). All four publish commands succeeded.
- Next: verify registry availability after npm processing; do not republish.
- Compatibility: old application cms selectors/theme variables must be migrated; imports retained.
- Pending: first fresh-cache registry check returns E404 for all four versions.
