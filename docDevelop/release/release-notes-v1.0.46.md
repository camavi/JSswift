# JSswift 1.0.46 and knowledge MCP 0.1.2

UI bundles no longer register descriptive component metadata or its normalization tables. Applications relying on the bundled UI.meta catalog must use the separate component contracts; core helpers still accept explicitly supplied metadata. The minified UI bundle is about 23% smaller.

AI.md provides a short supported entrypoint with imports, six components, exact callbacks, model values, validation and dialog lifecycle. Available as jsswift/AI.md and MCP guide:AI. Common property definitions live once in ui/common-props.md, inherited through commonProps.keys; component-specific contracts remain complete. MCP 0.1.2 validates these references and points agents to the quick start. Portable Skill is updated.

This release does not add public focus/getValue/setValue control methods or automatic label/error associations. No benchmark token reduction is claimed.
