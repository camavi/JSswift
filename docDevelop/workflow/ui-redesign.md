# UI redesign — 2026-10-08

## Scope

Redesign all UI CSS for modern palette-driven light/dark themes; split component JS/CSS and shared helpers; add automatic discovery. Audit component props against behavior and documentation. Component development pages remain local and untracked. No publication requested.

## Initial findings

- base.css mixes palette, semantics, component defaults and dimensions. Text/shadow declarations repeat; brand overrides replace only part of the primary scale.
- ui-components.css contains fixed colors for focus, status, surfaces and decoration. Palette changes cannot currently theme everything.
- 10-primitives-layout.js combines layout, Button and form controls. Extraction must preserve lexical dependencies and initialization order.
- select-ui.mjs resolves JS references from a concatenated IIFE AST. CSS ownership relies on a manually maintained prefix map and retains unknown/functional selectors conservatively.
- Vite and configured builds require explicit component lists. Automatic application discovery remains to implement.
- Button supports semantic colors and outline directly; applyCommonProps handles dense/flat. Its documented commonProps omit dense/flat. Verify rendered behavior and combined states before updating contracts.
- Core already owns theme selection/storage; coordinate with that API.

## Target and sequence

1. Inventory exports, lexical helpers, initialization side effects, CSS ownership, tokens and props.
2. Define palette scales, semantic light/dark mappings and component override tokens. Keep theme identity separate from mode; validate contrast for generated palettes.
3. Register component JS/CSS, aliases, dependencies and assets in one manifest. Share dependency resolution across full/selective/Vite builds; reject missing files and cycles.
4. Add syntax-based application discovery with explicit inclusions for dynamic names, installed-package support and development invalidation.
5. Pilot Button, FormField, Input and Select; then migrate remaining families. Preserve public signatures during extraction.
6. Check full/selective parity, documented props, themes, responsive behavior, keyboard interaction, reactive models and cleanup.

## Local baseline

ui-lab.local is outside pages and ignored by the existing *.local rule. Serve the repository root and open /ui-lab.local/button.html. Button fixtures exercise current generated runtime/CSS in light and dark without optional assets. Other components need tailored fixtures.

This initial stage does not complete the CSS rewrite or automatic discovery. Runtime changes require UI/umbrella builds, npm test and relevant browser checks.

## Button baseline corrections

- Dark outline text now follows semantic theme text instead of the text-on-dark-fill token, including dense combinations.
- Button base font consumes --jss-font-size so numeric size applies to the label; named sizes keep their existing scales.
- Regenerated UI CSS and umbrella assets. Chrome regression passed for named/numeric font sizes and outline text in both modes, with full and selective CSS.
- npm test: 71 passed; package installation check blocked by npm cache permissions, then missing offline esbuild cache with a temporary writable cache. No application test assertion failed.
- git diff --check passed. Overall redesign remains active.

- Follow-up: Outline light also follows theme text, including dense variants. Extended Chrome regression covers both neutral colors in light/dark modes and full/selective CSS.

- Neutral Outline borders now follow the same semantic theme text as their labels. Chrome regression also checks solid borders of at least 1px for light/dark and dense combinations in both modes and builds.

- Glass Button labels consume semantic theme text directly, avoiding pale text-on-fill overrides on translucent light surfaces. Text Gradient keeps its explicit treatment. Chrome regression covers eight colors, Glass/Outline+Glass, both modes, blur preservation and full/selective CSS.

## Button accepted; Input/FormField next

User accepted the Button baseline and requested moving on. Close its visual review; structural extraction, complete token redesign and automatic discovery remain part of the active objective. Added local input.html with semantic colors/effects, states, messages, sizes, native types, addons, shared rod and custom FormField control. No runtime changes made in this step. Input contract currently lists semantic colors as native type values: audit this documentation error separately.

- Input clear now scopes its text token to the field text mapping, avoiding inherited text-on-fill colors on secondary/dark surfaces. Extended browser regression checks the rendered clear icon against native input text in both modes and full/selective CSS. UI CSS and umbrella assets regenerated.

- Input Text Gradient now clips only native editable text; labels/addons/clear retain opaque text fill. Gradient endpoints mix palette with semantic theme text and caret uses theme text. Regression covers all eight colors with/without Outline in both modes and builds.

- Outline FormField no longer draws a second border on its message-containing wrapper. The control retains its rounded border, uses a transparent surface, and receives a theme focus ring while preserving effect shadows. Chrome regression checks wrapper/control border ownership and transparent surface for all gradient Outline colors in both modes and builds.

- Dark Glass fields now use a 92% theme panel surface with a subtle semantic tint, 8px backdrop blur, a restrained highlight and softer colored borders. Input/textarea/select text, addons and clear consume theme text; labels consume secondary theme text. Outline keeps its transparent surface. Browser regression covers all colors with/without Outline in full/selective builds.

- Refined dark Glass after visual feedback: translucent tint, visible upper reflection, colored lower/lateral light and contained pseudo-element stacking. Chrome regression passed; inspected screenshot of all eight dark Glass colors confirms visible reflection with readable labels/text. Local glass-preview.html remains untracked.

- Dark Glass foreground now mixes 82% theme text with 18% component color, including clear/addons; label uses the same tint ratio with secondary text. CSS/umbrella rebuilt.

- Gradient Input surfaces now actually paint a two-stop gradient on the control; theme-specific palette blends preserve readable tinted text/clear and labels. Dark neutral endpoint has a separate lighter mapping to avoid a flat result. Full/selective browser checks passed and light/dark screenshots inspected.

- Light Gradient now starts at dedicated white --jss-gradient-surface and ends at a 45% palette tint, replacing the gray panel base. Existing dark mappings remain unchanged. CSS and umbrella rebuilt.

- Field Glow redesigned for light/dark: crisp tinted edge, soft exterior halo, theme surface, readable tinted foreground and no blurred text shadow. Focus strengthens halo; Outline combinations retain single-border ownership. Chrome regression covers eight colors with/without Outline, both modes/builds and focus changes; inspected light/dark screenshots.

- Increased Glow visibility following user feedback: centered near-edge bloom plus wider halo on all four sides, stronger dark intensity and focus bloom. Text remains sharp. Browser regression passed; inspected refreshed light/dark previews.

- Input size correction: FormField now applies shared property tokens; native input consumes the font token, field height/float label/clear icon scale with it. Named sizes map to font scales and numeric sizes apply to the wrapper. Full UI and umbrella builds passed; Chrome checks font/height/icon scaling for xs–xl and 20 in both modes/builds passed. npm test application checks passed; package-build remains blocked by npm cache write restrictions.

- Dense fields now reduce control height, clear/addon spacing and label inset without adding wrapper margin/padding. Flat removes actual control borders/shadows while preserving a focus ring. Added local Dense+Flat samples. Chrome regression passed for xs/md/xl/numeric sizes, both modes and full/selective builds.

- Dense text shifted down with 6px top margin and 3px top padding to separate it from the floating label. Browser regression confirms Dense stays shorter than Default across tested sizes/modes/builds; inspected local screenshot for label separation.

## Input/FormField accepted — 2026-10-08

User closed this visual step and requested preserving the results for Select. Treat these as the accepted shared field baseline:

- Light/dark foreground, label and clear contrast, including neutral secondary/light/dark states.
- Outline: one rounded control border, no wrapper border; transparent surface and visible focus.
- Glass: readable tinted foreground; dark reflection, translucency and contained stacking.
- Gradient: visible control surface gradient, white origin in light and separate dark palette mappings.
- Text Gradient: editable text only; opaque labels/clear and visible caret.
- Glow: centered visible halo on all sides, no text blur and increased focus intensity.
- Size: named/numeric font sizes with proportional height, floating label and clear icon.
- Dense: compact control without wrapper padding/margin; text offset below label (6px margin, 3px top padding).
- Flat: no control border/shadow; focus indicator retained.

For Select, reuse FormField rather than duplicate these rules. Audit Select-specific font/height overrides, arrow/clear contrast, value/chips, search, option menu/portal, keyboard navigation, disabled state, models and cleanup. Shared styling does not establish that Select-specific behavior is verified. Keep local labs outside Git and the site build. Structural component extraction, full token redesign and automatic discovery remain outstanding.

## Select local baseline

Added untracked select.html using the accepted field variants and eight colors; fixtures include filtering, multiple/custom values, disabled options, groups, empty/async options, statuses, addons, named/numeric sizes and a shared rod. No Select runtime change at this stage. Size/control-specific overrides and arrow/menu foreground need focused review.

- Select color light dropdown now owns an opaque theme surface, border, radius and shadow. Options/search consume theme text; hover/active/selected have a subtle neutral background and readable foreground. Disabled opacity remains distinct. Chrome regression verifies portal frame, option and search colors in both themes and full/selective CSS.

- Reopened shared Glossy visual treatment following user feedback: control surface paints a visible upper reflective band with a midpoint transition, theme-specific base/tint and readable Input/Select foreground. Covers Glossy border and Outline combinations via shared FormField selectors. Chrome regression passed for all colors, both controls/themes/builds; light/dark screenshots inspected.

- Glass Select menu now uses an 82%-opaque theme surface and 14px backdrop blur, replacing pale palette-based backgrounds/reflections. Options and search use theme text with subtle tinted selected/active/hover states. Full/selective browser regression passed for eight colors in both modes; dark menu screenshot inspected.

- Glass menu translucency increased after visual feedback: surface opacity reduced from 82% to 60%, backdrop blur from 14px to 6px so underlying colors/shapes remain visible. Browser regression updated for both themes and full/selective builds.

- Dark Glass dropdown now blends theme surface with 22% palette shade at 72% opacity, plus a restrained colored upper reflection. This reduces gray bleed-through while retaining translucency; light treatment unchanged. Chrome regression passed.

- Reproduced persistent pale Glass menu on actual lab: legacy selected-option ::before was absolutely positioned against the menu and painted a pale reflection over the entire popup. Disabled that pseudo-element; keep reflection solely on menu surface. Added regression asserting selected pseudo content none. Real lab screenshot confirms dark translucent tint; earlier cache hypothesis was not the cause.

- User requested preserving the earlier light Glass reflection. Restricted selected-item pseudo-element removal to dark mode; light retains its earlier reflection. Regression explicitly verifies reflection present in light and absent in dark, across all colors and both builds.

- Outline+Glossy Select options keep theme foreground for default/selected/active/hover, with a theme surface tint and restrained reflective highlight instead of pale glossy fills and low-contrast semantic text. Search text also follows theme. Chrome regression checks hover rules via equivalent test-only selector classes for all colors/themes/builds.

- Outline+Glow shared field controls now add a subtle inset halo (12% light, 16% dark) retained during focus alongside the exterior glow. Chrome checks cover Input and Select, all colors, both themes and builds. CSS/umbrella regenerated.

- Select Dense now shares field height/font metrics, compact padding and label-aware top space; selected value bottom offset removed. Multiple controls retain automatic height. Baseline Select height/font now follows shared size tokens. Browser regression verifies Dense shorter than Default and no label/value overlap for xs/md/xl/20 in both themes/builds.

## Select accepted and commit requested

User accepted and closed the Select visual step and authorized a local Git commit. Include canonical source, tracked generated compatibility mirrors, workflow documentation and browser regression. All ui-lab.local artifacts remain ignored and excluded. The overall redesign stays active; no release/push requested.

Precommit verification caught a sizing compatibility regression: default fields must retain inherited --jss-input-height-default; only explicit named/numeric size sets proportional field height. Corrected FormField and shared CSS, then regenerated outputs.

Validation: npm test passed all 72 tests, including package installation. UI, umbrella and site builds passed (existing non-module script warnings remain). All 27 browser cases verified: the full run passed 26, with one Menu case missing its requestAnimationFrame result in headless Chrome; isolated retry passed. Catalogue height compatibility and the new full/selective field regression passed. git diff --check passed.
