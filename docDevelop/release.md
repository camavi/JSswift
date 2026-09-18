# Release and deployment

Published packages are @jsswift/core, @jsswift/ui, and jsswift. Before publishing: build runtime, run tests, inspect with npm pack --dry-run, and confirm version availability.

GitHub Pages deploys through .github/workflows/deploy-pages.yml. pages/public/CNAME declares jsswift.com. Do not change npm visibility, publishing, DNS, or deployment configuration without explicit user authorization.
