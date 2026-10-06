# Release and deployment

Published packages are @jsswift/core, @jsswift/ui, and jsswift. Before publishing: build runtime, run tests, inspect with npm pack --dry-run, and confirm version availability.

The application knowledge MCP is prepared separately in `ai/mcp` as `@jsswift/knowledge-mcp`. Publication must be authorized by the user. Build with `npm --prefix ai/mcp run build` and verify with `npm run test:knowledge`. The framework release must include the bundled documents before users can use the MCP with that version. Do not republish an existing framework version; choose an available version during the authorized release workflow.

GitHub Pages deploys through .github/workflows/deploy-pages.yml. pages/public/CNAME declares jsswift.com. Do not change npm visibility, publishing, DNS, or deployment configuration without explicit user authorization.
