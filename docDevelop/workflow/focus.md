# Current focus

- Status: active — release JSswift/core/UI 1.0.54 and knowledge MCP 0.1.10.
- Changes: ui-light.css/ui-light.min.css exported by UI and umbrella packages; generated base utilities retain all unprefixed rules. Full ui.css remains byte-identical. All JS props, base tokens, component states and component-specific mobile styles remain.
- Documentation: AI start uses light CSS; setup/AI explain responsive.css addon ordering and color/dense/outline props. Bundled docs and portable skill regenerated.
- Measurement: minified full CSS 331379 bytes / 42944 gzip; light 199322 bytes / 31373 gzip (26.9% gzip reduction). CSS only; no JS or installation-size reduction claimed.
- Verification: 61 unit checks and 6 knowledge/MCP checks pass. 23 existing browser checks pass; new light/full/addon browser check passes on rerun after correcting an erroneous hard-coded gap expectation (actual existing md Grid gap 26px). Mobile and desktop compare equal with addon; desktop without addon retains base columns. All unprefixed rules match full responsive source; diff check passes.
- Verification: full runtime build, 61 unit, 24 browser and 6 knowledge/MCP checks pass. Package dry-runs confirm new CSS exports and updated AI guide.
- Next: commit and publish the authorized release, then verify npm registry availability.
- Blockers: none.
