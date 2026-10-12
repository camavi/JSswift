# UI functional bug audit

2026-10-12. Baseline commit: 75b73e8. UI/CSS redesign accepted and committed; user requested bug research afterwards.

## Confirmed findings

1. Time readonly value can be cleared by Delete. Create Time with readonly:true and value:'12:30'; dispatch keydown Delete on _input. _getValue() returns empty string. Keyboard handler calls setTimeState without readonly guard. Source: packages/ui/src/31-form-advanced.js, Time keydown handler.
2. Checkbox, Radio, Toggle, Slider, Rating and Time retain model watchers after JSswift mount replacement. For each caller-owned rod, _actions grows by one at creation and stays at +1 after _.mount(host, replacement). Changing the model still updates detached Slider/Rating/Time values. Source: model.watch calls in packages/ui/src/31-form-advanced.js. Reproduction: /tmp/jss-ui-lifecycle-audit.html; results /tmp/jss-ui-lifecycle-audit.out. This is an actual JSswift lifecycle disposal, not arbitrary DOM removal.
3. Shared Light/Dark Glass Card rules override Table dedicated Glass surface. Full suite and isolated Table test fail: Light Glass computed rgba(241,245,249,.28), expected rgb(241,245,249). Table explicitly owns its body surface and reflections only in headings; late more-specific Card rules override it. Preserve Table-specific contract when narrowing shared Card neutral rules. Sorting, search, pagination and accessibility portions passed.

## Verification

Full npm run test:browser: 62 tests, 61 passed, 1 failed (Table surface above). Log: /tmp/jss-ui-audit-browser.log. Isolated Table reproduction: /tmp/jss-ui-audit-table.log. Prior implementation unit suite: 77 passed. No framework source was changed during this audit. Findings await correction; this first pass does not certify the absence of other bugs or exercise real network upload transports.

## Corrections verified

All confirmed findings corrected in source. Choice/Slider/Rating/Time own and dispose model subscriptions; Slider/Rating/Time render/value effects also stop, and Time closes its overlay on disposal. Time keyboard/manual commits and actions honor readonly/disabled. Card neutral surface rules exclude Table so its dedicated Glass surface wins. New signal regression additionally exposed and fixed Rating calling an undefined serializeValue function; numeric equality now uses Object.is.

Final verification: UI and umbrella builds passed; all 77 unit tests and all 64 browser tests passed. Browser regressions cover repeated mount replacement with rod and signal models and Time keyboard/manual readonly protection. Log: /tmp/jss-audit-fix-all-final.log. Documentation updated; user subsequently accepted and closed the audit and requested commit.

User accepted and closed this audit; committing verified fixes, regressions, documentation and generated mirrors.
