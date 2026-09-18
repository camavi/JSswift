# Maintaining documentation

The documentions folder is optimized for selective reading. Keep its index current, document exact component contracts in documentions/components/<component>.md, and never recreate a monolithic catalog.

When a public component contract changes, update its split component document together with JSswift.ui.meta. Update docs/reference/core.md or docs/reference/ui.md for framework-level contracts. Generated metadata is the source for component props, slots, events, and methods.
