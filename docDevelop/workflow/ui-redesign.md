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

## Checkbox local baseline

Checkbox visual review accepted and closed by the user on 2026-10-09. Preserve the accepted dimensions, Dense/Flat, Outline indicator contrast, borderless Light Shadow/Glass and moderated Glow.

- 2026-10-09: requested Checkbox marker width and height increased from font size + 2px to font size + 4px, preserving a square marker.
- Checkbox Dense now reduces marker dimensions by 2px and label gap to 6px with compact wrapper padding. Flat removes marker border/shadow, rather than only decorating the wrapper. Native keyboard focus gets an offset outline, including Flat. Rules are scoped to Checkbox to preserve Radio/Toggle pending their review.
- Checkbox Outline checked/indeterminate icons now use the semantic edge color instead of pale text-on-fill. Neutral secondary/light/dark indicators and borders use theme text for visibility in both modes; marker remains transparent.
- Checkbox Light Shadow removes the marker border while retaining its effect shadow and keyboard focus. Outline + Light Shadow retains the outline border.
- Checkbox Glass also removes the marker border; Outline + Glass retains its outline.
- Checkbox Glow uses two restrained outer halos (3px/7px light, 3px/8px dark), reduced opacity and no inset bloom; other component glow treatments remain intact.
- Visual feedback found the reduced Glow barely visible. Increased outer halos to 4px/10px light and 4px/11px dark with 1px/2px spread and moderate opacity; retain no inset bloom for sharp indicators.

After Select acceptance and commit, start Checkbox, the next form control. Added ignored ui-lab.local/checkbox.html with eight colors, shared decorative variants, checked/unchecked/indeterminate/disabled states, named/numeric sizes, Dense, long labels, custom icons and a shared rod with programmatic true/false/null updates. Material Symbols are explicitly enabled. This starts visual review without changing framework behavior; Radio and Toggle share buildChoiceControl and require attention when later changing it.

## Radio local baseline

Radio visual review accepted and closed on 2026-10-09. User requested a local commit of Checkbox/Radio corrections and moving to the next component.

- Radio Dense reduces marker/icon dimensions and label gap. Flat removes the marker border/shadow and replaces the default ring icon with a selected dot; custom icons remain. Keyboard focus uses an offset outline.
- Corrected Dense Radio icon centering: icon box dimensions now match the reduced font size and use flex centering, replacing the inherited larger Material icon box.
- Radio Outline now shares Checkbox semantic edge/icon foreground mapping, including readable neutral colors in both modes. Selected center and unselected icon use the same visible foreground.
- Radio Glow reuses the moderated Checkbox outer halos in light/dark, replacing the aggressive generic inset bloom while keeping the effect visible.
- Radio Glass icons use theme text blended with semantic color and paint above the glass reflection, preserving selected-center visibility in both themes.
- Long Radio labels wrap independently of a fixed square marker, aligned with the first text line; Dense preserves its compact marker dimensions. Long unbroken text may wrap within the label.
- Dark Radio Shadow adds a subtle inner top reflection and directional palette-tinted shadows to remain visible on dark surfaces; light Shadow is unchanged.
- Default Radio icon box now follows the field font size and uses flex centering, matching the Dense correction. This removes inherited Material icon box/font mismatch in normal model-backed groups and decorative variants.

Added ignored ui-lab.local/radio.html with light/dark themes, eight colors, effect variants, selected/unselected/disabled states, sizes, Dense, labels/icons and a named model-backed group with programmatic selection/reset. Radio has no indeterminate state. No framework change in this step.

## Toggle local baseline

User accepted and closed Toggle visual review. Preserve Glass reflection/tinted thumb, Outline thumb color and custom icon centering/color with original dimensions. Extended local custom-icon matrix covers eight colors, three states and Default/Outline/Glass combinations.

- Custom Toggle icons now match thumb dimensions, use flex centering and a readable theme/semantic foreground instead of text-on-fill colors.
- User requested preserving custom icon dimensions: removed thumb-sized icon override; retained original icon size tokens with centered layout and readable foreground.

- Toggle Outline default thumb now uses semantic hover foreground instead of transparent track background, with stronger selected fill. Subsequent Glass overrides retain the reflective thumb in Outline + Glass.

- Glass default thumb now derives its fill from the semantic hover color rather than the transparent Glass background. It paints above the reflection, with theme text mixed for contrast; Glass track no longer desaturates the thumb in off/indeterminate states.
- Follow-up restores Glass appearance: translucent tinted thumb with upper reflection and inset highlights; isolated track keeps its Glass reflection below the thumb instead of losing it behind the surface.

Added ignored ui-lab.local/toggle.html with light/dark themes, eight colors, effects, on/off/indeterminate/disabled, sizes, Dense, custom icons, long labels, shared boolean/null model and radio-behavior group. No Toggle runtime changes at this stage. All labs remain excluded from Git.

Closure validation: UI and umbrella builds passed; npm test passed 72/72; shared field full/selective browser regression passed. Local browser audits covered Checkbox Dense/Flat/Outline and Radio Dense/Flat in both themes. Toggle lab loaded in Chrome. git diff --check passed. No push requested.

## Slider local baseline

User accepted and closed Slider visual review and requested a local commit plus the next component. Commit also includes accepted Toggle changes since the preceding commit. All local labs remain excluded; no push requested.

- Slider Dense defaults to an 18px thumb, 4px track and 28px control box with compact wrapper spacing; explicit size tokens retain precedence. Flat uses a filled borderless thumb without shadow. Native keyboard focus gets an offset thumb outline.
- Slider Outline removes the unintended wrapper rectangle; outlined selection and theme-surface thumb own the treatment. Shadow adds directional thumb shadows with theme-specific dark tint/reflection.
- Increased Slider Shadow opacity and blur slightly after visual feedback, in both themes.
- Slider Light Shadow now owns a borderless raised thumb: directional upper-left light, lower-right shadow, inner highlights and a subtly recessed rail, with dedicated dark surface/light ratios.
- Strengthened Light Shadow thumb semantic tint after visual feedback: light gradient mixes 25–60% component color; dark uses 45–65%, retaining directional highlights and shadows.
- Slider Glossy paints a distinct upper reflective band on its tinted thumb and active track, with theme-specific dark thumb stops and restrained inset/exterior shadows.
- Slider Glow adds two soft outer thumb halos and a lighter active-track halo. Track halo resolves the actual selected color, including literal CSS colors; dark uses moderately stronger intensity. Value labels remain sharp.
- Slider Glass uses a translucent palette-tinted thumb, radial upper reflection, backdrop blur and inset edge light; active track has a translucent reflective finish. Dark gets dedicated reflection/surface ratios; value badge keeps opaque readable text.
- Slider Gradient paints palette stops on active track and thumb, consuming shared --set-gradient-deg. Existing numeric gradient prop controls the angle; local fixtures cover 45/90/135/180/270 degrees.
- Slider Text Gradient applies readable theme/palette gradients to header label, header value and endpoint labels; track/thumb keep semantic colors and the floating value badge keeps its contrasting foreground. Outline combinations share the same treatment.

- Slider passed semantic color names directly to CSS, which rejected them and retained primary defaults. Resolve palette names to CSS tokens for color/selectionColor/trackColor/thumbColor; value badge foreground follows the semantic text token. Literal CSS colors remain supported.
- Value badge correction: current semantic text tokens often match the fill itself. Use dark palette text on warning/success/light badges and light palette text on primary/secondary/danger/info/dark to restore visible numbers.

Added ignored ui-lab.local/slider.html for eight colors, effects, light/dark, sizes, disabled, markers, steps, icons, endpoint labels, long labels and shared rod. No Slider runtime changes at this stage.

## Rating local baseline

User accepted and closed Rating visual review and requested a local commit followed by the next component. Date lab added at ignored ui-lab.local/date.html with color/effect matrix, sizes, range/multiple, constraints, manual input, time and shared model. No Date runtime changes yet; no push requested.

- Date Dense display now consumes shared compact field height/font, removing its fixed-height override. Calendar addon icon has transparent background, inherited readable color and centered layout. Date Flat removes internal field separators as well as its outer border.
- Date calendar addon and clear now stretch to the full control interior height; icon box uses automatic height and centered content instead of fixed icon height.
- Date popup inherits the field color through an explicit portal accent token; panel surface is lightly tinted, selected/range endpoints and primary action use the accent, with theme text and tinted hover states.
- Uncolored Date popup now defaults to neutral theme secondary text rather than primary, preserving explicit color accents.
- Light uncolored Date popup uses the page background token without gray tint; explicit palette colors retain tinted surfaces.
- User accepted and closed Date visual review. Next is Time; ignored ui-lab.local/time.html covers colors/effects, both themes, sizes, disabled/readonly, seconds, minute steps, limits, manual input and shared model. No Time runtime changes yet; no commit requested in this transition.
- Time display fixed min-height override removed at user request; shared Input/FormField sizing now determines its minimum height.
- Time now shares Date full-height addon/icon/clear alignment and transparent centered addon icon rules, including Flat separator removal.
- Time popup propagates field color through a portal accent token for surface, selected options and primary actions. Uncolored uses neutral theme accent and page background in light mode, matching Date.
- User accepted and closed Time and requested a local commit of Date/Time changes. Next Textarea lab is ignored ui-lab.local/textarea.html with themes, colors/effects, multiline values, rows, sizes, states/messages and shared model. No Textarea runtime changes yet; no push requested.
- Textarea Dense now uses tighter multiline line height, reduced bottom/horizontal padding and no Input top margin; top padding reserves floating-label space. Default stays unchanged.
- Colored Textarea editable foreground now blends 85% theme text with 15% semantic hover color, retaining a theme-colored caret in both modes.
- User accepted and closed Textarea. Added ignored Search lab with themes, palette/effects, suggestions, empty/disabled/initial value, sizes and shared model. No Search runtime change in this transition; no commit requested.
- Search addons/icon boxes and clear stretch to the full control interior height, with centered glyphs, including Dense.
- User accepted and closed Search. Added ignored Card lab covering light/dark, eight colors, effects, header/body/footer, neutral card, long title, actions and sizes. No Card runtime changes in this transition; no commit requested.
- Colored Card subtitle inherits card foreground with 85% opacity instead of using neutral muted text on colored fills.
- Card Shadow uses stronger two-layer elevation distinct from Default; dark adds a restrained upper reflection and tinted exterior shadow.
- Neutral dark/light Card Outline uses theme text foreground rather than text-on-fill, restoring title/subtitle/body/footer visibility on transparent surfaces.
- Card Light Shadow removes its border, replaces the bright rim with restrained directional inner highlights and soft upper-left/lower-right elevation, and softens section dividers. Dark gets dedicated highlight/shadow ratios.
- Increased Light Shadow visibility after feedback: wider inset highlights/shading, directional surface lighting and stronger diagonal exterior shadows; border remains absent.
- Card Glow uses theme-adjusted exterior halos without text blur. Glass owns translucent tinted surface/reflection, backdrop blur, edge highlights and theme-tinted readable foreground; removes generic pseudo overlay and border, with dedicated dark ratios.
- Increased Card Glow intensity, blur and spread slightly at user request, in both themes.
- Card Glass correction: component-owned foreground/surface/pseudo rules now outrank later generic singularity/state effects, preventing pale text-on-fill and legacy Glass overlays from returning.
- Increased Card Glass translucency: 40% surface opacity light, 48% dark, reduced upper reflection and 4px backdrop blur. Local Glass fixtures include a subtle colored backdrop to make transmission visible rather than testing only a uniform surface.
- User rejected the Glass surface redesign. Removed all Card-specific Glass surface/pseudo/blur/shadow overrides and local colored backdrop; restored shared original Glass treatment, retaining only the readable Card foreground correction.
- Removed Card Glass outer border at user request, preserving original reflection/surface and internal dividers.
- Uncolored Card surface now follows --jss-bg (body theme background) instead of the gray panel default; explicitly colored cards retain their palette fills.
- Audit found a shared .jss-card rule enabling --jss-shadow-sm by default. Cards without explicit Shadow/Light Shadow/Glow/Glass now reset that implicit elevation; custom inline shadow and explicit effects retain precedence.
- Dark Card Glass uses a darker panel-dominant translucent base and dims only the existing reflection pseudo-layer to 55% brightness, preserving original Glass structure and readable foreground.

- Rating Default increases icon size by 6px over the font token and adds 3px icon padding. Dense uses the base font size, 2px padding and tighter gaps. Flat removes icon fill/border/shadow and uses semantic foreground, with theme text for neutral colors. Numeric sizes retain inline precedence.
- Rating Outline removes wrapper border and uses transparent per-icon surfaces with semantic foreground/borders; neutral colors use theme text. Shadow adds directional per-icon elevation with a dark highlight/tint treatment.
- Rating Light Shadow adds per-icon upper-left highlights and lower-right soft shadows with dark mappings; Border owns per-icon edges rather than the wrapper; Glossy adds an upper reflective band and inset edge light in both modes.
- Rating Glow uses moderated outer halos without text blur. Glass applies translucent tinted per-icon surfaces, upper reflections, backdrop blur and readable theme/semantic icon foreground, with separate dark ratios.

Slider closure validation: UI/umbrella builds passed, npm test passed 72/72, shared field full/selective Chrome regression passed. Earlier local Slider audit verified eight palette colors in light/dark. Rating lab loading verified in Chrome. git diff --check passed.

Added ignored ui-lab.local/rating.html covering light/dark, eight colors, effects, sizes, empty/half/disabled/readonly, custom icons, long labels, clearable and shared model. No Rating runtime changes at this stage.

Card closure: user accepted the final styling. Textarea, Search and Card changes consolidated into a local commit. Validation: npm test 72/72; shared field browser regression 1/1. Prepared ignored Chip lab for the next visual review; overall redesign remains active.

Chip sizing: default width follows content, opts out of flex/grid stretching and flex growth, with container max-width. Explicit width remains supported. Rebuilt UI; Chrome checks passed for flex row, flex column, grid and explicit 240px width. npm test passed 72/72; git diff --check passed. Visual Chip review remains active.

Chip close icon now inherits Chip foreground instead of the nested button semantic foreground. UI rebuilt; Chrome verified matching foreground across all eight colors in light/dark (16/16).

Chip Outline dark/light foreground now follows theme text on transparent surfaces, including both icons and removal. UI rebuilt; Chrome verified both semantic neutral colors in both themes (4/4).

Chip Glow now uses two restrained exterior halo layers with dedicated dark ratios and removes inherited text blur. UI rebuilt; Chrome verified Glow and Outline+Glow across eight colors in both themes (32/32). git diff --check passed.

Increased Chip Glow halo opacity, blur and spread moderately after visual feedback; text remains unblurred. Rebuilt UI CSS.

Chip Glass foreground now blends 85% theme text with semantic accent, preserving existing Glass surface. Icons and close inherit the readable foreground. UI rebuilt; Chrome checked Glass/Outline+Glass icon inheritance for eight colors in both modes (32/32).

Chip Shadow dark now owns a visible upper inset reflection, deeper black elevation and soft semantic-tinted outer shadow; explicit box-shadow overrides shared rules and retains optional Glow composition. UI rebuilt; Chrome verified all eight dark Shadow colors.

User accepted and closed Chip. Prepared ignored Badge lab with themes, palette/effects, sizes, neutral labels, icon positions and reactive notification. Overall redesign remains active.

Badge now defaults to content width and opts out of flex/grid stretching and growth; explicit width remains supported. UI rebuilt; Chrome sizing checks passed for flex row, flex column, grid and explicit 240px width. npm test 72/72 and git diff --check passed. Badge visual review remains active.

Badge Glow now uses two proportional exterior halo layers with dedicated dark intensities and no text blur. UI rebuilt; Chrome verified Glow/Outline+Glow across eight colors and both themes (32/32), including label text-shadow. git diff --check passed.

Badge Glass uses readable theme-dominant tinted text while preserving the shared surface. UI rebuilt; Chrome verified final foreground and label across eight colors, Glass/Outline+Glass and both themes with transitions disabled (32/32).

Badge Outline dark/light foreground follows theme text for transparent surfaces, including Outline+Glow. UI rebuilt; Chrome checked labels for both neutral colors, both themes and Glow on/off (8/8). git diff --check passed.

User accepted and closed Badge. Consolidating approved Chip and Badge styling in a local commit. Prepared ignored Avatar lab with themes, colors/effects, initials, icons, sizes, shapes and badge overlay. UI builds and component browser audits passed; overall redesign remains active.

Avatar Dense defaults to 32px with 12px type and tighter margins; explicit numeric/token sizes retain precedence. Flat removes fill, border and elevation, uses semantic foreground with theme text for neutral colors, and clears media fallback fill. UI rebuilt; Chrome checks across palette/themes and explicit sizes passed (20/20), npm test 72/72, git diff --check passed. Avatar review remains active.

Removed Avatar Light Shadow outer border at user request, retaining shared light/shadow treatment. Rebuilt UI CSS.

Avatar Outline dark/light foreground now follows theme text on transparent surfaces. UI rebuilt; Chrome verified root and initials for both neutral colors in both themes (4/4). git diff --check passed.

Avatar Glow uses two proportional exterior halo layers with dedicated dark ratios and removes text blur. UI rebuilt; Chrome verified Glow/Outline+Glow across eight colors and both themes including initials text-shadow (32/32). git diff --check passed.

Avatar Glass foreground uses theme-dominant tinted text, including Outline+Glass, preserving the shared Glass surface. UI rebuilt; Chrome verified root and initials across eight colors and both themes (32/32).

User accepted and closed Avatar. Prepared ignored Banner lab with themes, colors/effects, native variants, neutral and long text, actions and dismissal. Overall redesign remains active.

Banner Glossy now derives its reflective gradient from --jss-banner-accent instead of shared neutral singularity colors, with dedicated dark ratios and existing Banner base surface. UI rebuilt; Chrome verified eight distinct palette gradients in each theme. npm test 72/72; git diff --check passed.

Softened Banner Glossy after feedback: theme background with 6% accent base, reduced reflective gradient saturation in both themes. Rebuilt UI CSS.

Banner Border explicitly owns solid outer edges using Banner accent and configured border width. UI rebuilt; Chrome verified four borders for eight colors in both themes (16/16).

Banner Glow uses Banner accent for both exterior halo layers, with dark ratios and no text blur; retains explicit Shadow composition. UI rebuilt; Chrome verified eight distinct colored shadows in each theme; git diff --check passed.

Banner Glass owns a translucent theme surface, soft diagonal reflection and semantic radial tint, 8px backdrop blur, subtle edges/elevation and theme text. Preserves the leading accent stripe rather than shared Glass pseudo overlay; dark uses a darker base and restrained reflections. UI rebuilt; Chrome checked eight distinct palette reflections, backdrop blur and theme foreground in both themes. git diff --check passed.

Banner Gradient uses subtle semantic accent blends with theme surfaces (4–18% light, 4–16% dark), theme foreground and shared gradient angle support. UI rebuilt; Chrome verified eight distinct palette gradients in each theme and gradient:45. git diff --check passed.

Banner Text Gradient now applies semantic accent/theme text gradients to title, message, description and meta instead of clipping the whole Banner with neutral tokens. Icon uses accent; action/close buttons retain normal foreground. UI rebuilt; Chrome verified eight distinct title gradients in each theme.

Corrected Banner Text Gradient surface after feedback: neutral body-theme background and disabled root gradient token; gradient remains only on text nodes. Chrome verified neutral root background/no surface gradient, text clipping and distinct semantic title gradients across palette in both themes. UI rebuilt; git diff --check passed.

Banner native variants now override shared singularity paint: Soft has a subtle theme/accent surface, Solid has a full accent fill and contrasting foreground, Outline has transparent fill and visible perimeter, Ghost is transparent without perimeter/stripe. Neutral light/dark icons follow theme text outside Solid; Solid icon and close follow contrasting foreground. Chrome verified four distinct variants for every color/theme and neutral icon contrast (32/32); UI rebuilt, npm test 72/72, git diff --check passed.

Banner Outline+Glossy outer border now follows Banner accent instead of shared neutral border tokens. UI rebuilt; Chrome verified border width/style and accent color for eight colors in both themes (16/16); git diff --check passed.

Banner Outline+Text Gradient outer border now uses Banner accent, retaining neutral surface and text-only gradient. UI rebuilt; Chrome verified border style/width and accent for all eight colors in both themes (16/16). git diff --check passed.

Banner light accent now remains pale (#f1f5f9) independently of dark theme background tokens: Solid has pale fill/dark foreground, Outline a visible pale edge, Ghost readable neutral icon. UI rebuilt; Chrome verified all three light variants in dark; git diff --check passed.

User accepted and closed Banner. Consolidating Avatar and Banner approved changes in a local commit. Prepared ignored List lab covering themes, palette/effects, density, dividers, ordered/marker modes, empty state and sizes. Overall redesign remains active.

List now participates in shared singularity state mapping. Component-owned baseline uses subtle palette surfaces, theme foreground, accent markers/dividers, neutral uncolored surface, compact Dense, transparent Flat and bordered Outline. UI rebuilt; Chrome verified state classes, six distinct semantic fills and theme foreground in both themes. npm test 72/72; git diff --check passed. Public List contract updated; visual review remains active.

List light/dark now have distinct pale/dark surfaces with opposing readable foreground and marker tones in either theme. Flat/Outline neutral foreground follows the theme on transparent surfaces. UI rebuilt; Chrome verified both surfaces and child foregrounds in both themes.

List Outline light/dark now have distinct neutral perimeter colors: pale slate for light, dark slate for dark with a brighter dark-theme edge; transparent surfaces retain theme foreground. UI rebuilt; git diff --check passed.

List Glass foreground and markers now follow theme text, including neutral light/dark states, preserving shared surface/reflections. UI rebuilt; Chrome verified root/child foreground for eight colors in both themes.

List Text Gradient now keeps neutral theme surface and applies readable theme-dominant accent gradients per item, preserving markers. UI rebuilt; Chrome verified text clipping/fill and per-item gradients for eight colors in both themes (16/16).

List Text Gradient clips the inner Item row instead of the li element so native bullet/ordered markers remain visible. UI rebuilt.

Reduced List Glow to restrained two-layer halos with lower opacity/spread, dedicated dark ratios and no text blur. UI rebuilt.

List Glossy owns a visible upper reflective band and restrained lower shading plus inset highlights, with dark-specific ratios; overrides baseline background shorthand that hid the shared effect. UI rebuilt; Chrome verified gradient and inset reflection in both themes.

Refined List Glossy after feedback: replaced abrupt midline band with continuous diagonal shading and soft upper radial reflection, reset shared background sizing/offset and added gentle inset edge depth in both themes. UI rebuilt.

Dark List Glass now uses a darker panel-dominant translucent base and dims existing reflection pseudo-layer to 45% brightness, retaining readable theme foreground. UI rebuilt.

List Outline+Glass perimeter derives from semantic hover independently of theme text/marker foreground, with distinct neutral edges. UI rebuilt; Chrome verified eight distinct palette border colors in both themes.

List size maps supported tokens to font, padding and gaps; numeric/CSS sizes set font size and propagate to items. UI rebuilt; Chrome verified xs/sm/md/lg/xl and numeric20 root/item font sizes; npm test 72/72, git diff --check passed.

User accepted and closed List. Prepared ignored Item lab covering themes, palette/effects, structured texts/icons, active/selected/disabled, actions and sizes. Overall redesign remains active.

Item subtitle/meta/aside inherit surface foreground; subtitle uses 85% opacity. Dense reduces surface padding and row gap without outer margin. Flat removes fill/border/elevation and uses semantic foreground with neutral theme text. UI rebuilt; Chrome verified subtitle foreground, compact height and transparent Flat across eight colors in both themes. npm test 72/72; git diff --check passed.

Item Flat light/dark now have distinct neutral foregrounds: slate/dark ink in light theme, pale/slate in dark theme. Subtitle/aside inherit the differentiated foreground. UI rebuilt.

Item Outline neutral light/dark uses theme foreground on transparent surfaces, inherited by subtitle and aside. UI rebuilt; Chrome checked both neutral colors in both themes.

Item Shadow now uses restrained two-layer elevation; dark adds a subtle upper reflection and semantic-tinted outer layer. Optional Glow composition retained. UI rebuilt; Chrome verified shadow layers for eight colors in both themes.

Removed Item Light Shadow outer border at user request, preserving shared directional light/shadow. UI rebuilt.

Item Border now owns a visible solid perimeter, mixing semantic hover with theme foreground to differentiate from fill; configured width preserved. UI rebuilt; Chrome verified four sides for eight colors in both themes.

Item Glow reduced to restrained two-layer exterior halos with dedicated dark ratios and no text blur. UI rebuilt.

Item Glass foreground uses readable theme-dominant semantic tint, inherited by subtitle/aside, preserving shared Glass surface. UI rebuilt; Chrome verified root/subtitle palette foreground in both themes.

Uncolored Item surface now uses body theme background (--jss-bg) instead of the gray singularity default. UI rebuilt.

Corrected uncolored structured Item inner row (no singularity root): its background now matches --jss-bg; surfaced Item rows stay transparent. Chrome verified actual inner-row/body background equality in both themes. UI rebuilt.

User accepted and closed Item. Consolidating List and Item approved changes into a local commit. Prepared ignored Separator lab for themes, colors/effects, horizontal/vertical orientation and sizes. Overall redesign remains active.

Separator now participates in shared color state mapping and owns horizontal/vertical line styling; removed hardcoded inline neutral border. Distinct light/dark tones and neutral theme border fallback. UI rebuilt; npm test 72/72; Chrome palette audit covers both orientations and themes with explicit fixture dimensions. Effects and size review remain pending.

Separator density decision accepted: Default keeps a 1px line, Dense reduces axis margins from 12px to 6px; Flat retains the plain Default appearance. Local lab uses a tighter Dense sample gap. UI rebuilt.

Separator Shadow uses a restrained directional shadow below horizontal lines/right of vertical lines, with a darker and subtly tinted dark-theme treatment. UI rebuilt; git diff --check passed.

Separator Outline uses a hollow 3px line with a 1px semantic perimeter and transparent center, including vertical orientation and distinct light/dark edge colors. UI rebuilt.

Separator Border uses a filled 3px line with a 1px contrasting semantic perimeter, distinct from hollow Outline, for horizontal and vertical orientations. UI rebuilt; git diff --check passed.

Separator Glossy uses a rounded 4px colored line with upper/left reflection and lower/right inset shading, oriented across line thickness. UI rebuilt.

Separator Glow reduced to two compact low-opacity halo layers without spread. UI rebuilt.

Separator Glass uses a rounded 4px translucent tinted strip, directional edge reflection, backdrop blur and a darker dark-theme base. Shared pseudo overlay disabled for this narrow geometry; vertical reflection rotates across thickness. UI rebuilt.

Separator Gradient fades semantic color toward both ends with strongest color at center. Defaults follow length (90deg horizontal, 180deg vertical); numeric gradient angle remains supported via component angle token. UI rebuilt.

Separator has no text: Text Gradient now retains Default line paint and disables shared text clipping that hid the line. UI rebuilt.

User accepted and closed Separator. Prepared ignored Tabs lab covering themes, colors/effects, variants, orientation, disabled tab, sizes and shared signal model. Overall redesign remains active.

Tabs baseline redesigned with neutral contained bar/nav, restrained active tint, semantic foreground, aligned underline, consistent icon sizing and compact Dense. Flat removes baseline/active fill; pills/soft use subtle grouped surfaces. UI rebuilt; visual review remains active.

Restored Tabs Default nav background after feedback: subtle 10% accent tint on theme surface with rounded corners. Flat remains transparent. UI rebuilt.

Tabs Shadow uses restrained two-layer elevation, matching 8px root/nav radius and no root/nav baseline border; dark has dedicated black/tinted depth. UI rebuilt.

Tabs Light Shadow removes outer/nav border, aligns rounded geometry and uses directional upper-left light/lower-right shadow with subtle inset nav depth; dedicated dark ratios. UI rebuilt.

Tabs Glossy reflection now paints the visible nav surface with soft upper lighting and lower inset depth, preserving subtle palette background; dark has dedicated ratios. UI rebuilt.

Adjusted Tabs Glossy to match the shared Button reflective-band pattern: bright upper half with a distinct transition near 50% and shaded lower half, replacing continuous gradient-like lighting. UI rebuilt.

Tabs Glow reduced to restrained exterior halos with dark ratios and no text blur; transparent borderless root shares 8px nav radius and nav baseline removed to avoid bright corner artifacts. UI rebuilt.

Tabs Glass nav no longer hides the glass with opaque theme fill: translucent semantic tint, diagonal reflection and 6px backdrop blur; dark uses darker translucent panel and restrained light. Root remains transparent/borderless with aligned radius. UI rebuilt.

Tabs Text Gradient now clips gradients on label/note nodes instead of root/buttons, preventing active background shorthand from hiding text. Theme-dominant semantic stops retain readable contrast; icons keep normal foreground. UI rebuilt.

Uncolored Tabs accent now defaults to theme text instead of primary; neutral nav surface follows body background. UI rebuilt.

Tabs variants differentiated: Line transparent active surface/underline, Pills rounded selection, Soft subtle rectangular selection without underline, new Solid full accent selection with contrasting foreground. Added Solid runtime normalization/public contract/local fixture.

Tabs light accent remains pale slate independently of theme background tokens, restoring dark-theme active label/icon and indicator contrast. UI rebuilt.

Dark Tabs Glass darkened using translucent body-background base, reduced upper/nav highlights and dimmed shared reflection overlay to 45% brightness. UI rebuilt.

Adjusted dark Tabs Glass after feedback: restored visible nav reflections and shared overlay brightness to 80%; dark body-tinted base now only 55% opaque to retain transmission rather than flattening the Glass effect. UI rebuilt.

- Tabs dark Glass correction: removed overlay brightness filtering, restored stronger translucent reflections and reduced the dark base to 20% opacity so the shared radial glass highlights remain visible. UI build and diff whitespace check passed.

- Tabs Glass: removed the navigation-specific gradient, backdrop blur and inset shadows that obscured the shared Button Glass radial reflections. Both themes now use the shared glass surface without an extra navigation layer.

- Accepted restored Tabs Glass surface. Dark theme now reduces only the shared Glass pseudo-element brightness to 72%, preserving radial reflections and transparency; light state is excluded. UI build and whitespace check passed.

- Applied requested dark-theme Tabs Glass navigation background #00000057. Light theme remains transparent. UI build and whitespace check passed.

- User accepted and closed Tabs. Separator and Tabs completed changes committed together; next visual review is RouteTab. Latest full test run: 72 passed; UI build and whitespace checks passed.

- RouteTab baseline review: removed implicit borders unless border/outline is requested; Flat now has a transparent surface for inactive/active/hover, theme foreground and semantic active text/indicator. Dense spacing retained. UI rebuilt and whitespace check passed.

- RouteTab Outline dark state uses theme foreground to keep inactive text readable on the transparent surface in both themes. UI rebuilt; whitespace check passed.

- RouteTab Shadow uses compact two-layer elevation (1px/2px and 3px/6px) instead of the broad shared halo, with dedicated dark-theme opacity. UI build and whitespace check passed.

- RouteTab Glow reduced to 2px/6px semantic halos at 30%/20% opacity and no text shadow. UI build and whitespace check passed.

- RouteTab Glow increased slightly after visual feedback: 3px/8px halos at 40%/28%, retaining sharp text. UI build and whitespace check passed.

- RouteTab Glass foreground now follows theme text on the translucent surface, with a theme-mixed semantic active foreground. Shared Glass reflections unchanged. UI build and whitespace check passed.

- RouteTab Text Gradient now clips the gradient on label/note instead of the root, keeping active labels visible with theme-mixed semantic stops and readable icons. UI build and whitespace check passed.

- RouteTab variants: inactive line/pills/soft use transparent surfaces with theme foreground; Pills has a full rounded silhouette; Soft uses subtle active tint without underline and readable active text. UI build and whitespace check passed.

- RouteTab Solid added to runtime normalization, public contract and local preview. Solid uses full accent active fill, contrasting text, no underline and transparent inactive state; light/dark states have dedicated foregrounds. UI rebuilt; all 72 tests passed after granting npm cache access.

- RouteTab Glass dark theme: slightly darkened only the shared reflection pseudo-element to 85% brightness, retaining the radial glass pattern and translucency. UI build and whitespace check passed.

- RouteTab Glass dark-theme light/dark active states use theme foreground and indicator for readable labels/icons; Glass surface unchanged. UI build and whitespace check passed.

- RouteTab dark Glass reflection brightness set to requested 0.65, excluding light state. UI build and whitespace check passed.

- User accepted and closed RouteTab. Next component: Breadcrumbs; prepared local review lab. RouteTab changes remain uncommitted pending a commit request.

- Breadcrumbs baseline rebuilt with shared singularity integration, neutral uncolored default, semantic tinted surface, theme-readable links, tinted current item and separators, borderless geometry, Dense spacing and transparent Flat. Light accent remains pale independently of theme. UI build and whitespace check passed; visual review active.

- Breadcrumbs Glow slightly reduced to 3px/8px semantic halos at 40%/25% opacity without text shadow. UI build and whitespace check passed.

- Breadcrumbs Gradient foreground changed to white as requested, including links/current entry, inherited icons and separators; Text Gradient remains independent. UI build and whitespace check passed.

- Breadcrumbs Text Gradient now clips a distinct semantic-to-theme gradient on each label/note, including current entry, instead of the container. Root/item text fill restored so icons and backgrounds remain visible. UI build and whitespace check passed.

- Breadcrumbs variants differentiated: Line underlines current entry, Pills rounds current selection, Soft uses a subtle rectangular selection, Solid fills current entry with accent and contrasting foreground (dedicated light/dark states). Solid added to runtime normalization, contract and local lab. UI build, whitespace check and all 72 tests passed.

- Breadcrumbs dark Glass slightly darkened using 80% brightness on its reflection pseudo-element only, preserving radial reflections/translucency and leaving light state unchanged. UI build and whitespace check passed.

- Breadcrumbs dark Glass brightness set to requested 0.6, excluding light state. UI build and whitespace check passed.

- User accepted and closed Breadcrumbs and requested commit. RouteTab and Breadcrumbs completed changes grouped in the commit; next component Pagination, local review lab prepared. Latest full suite: 72 passed.

- Breadcrumbs follow-up: dark-theme Glass light/dark current entries now use theme foreground and matching Line underline for readability, leaving the accepted Glass surface unchanged. UI build and whitespace check passed.

- Extended Breadcrumbs dark-theme light/dark current foreground and Line indicator correction to all effects, preserving Solid contrasting foregrounds. Text Gradient light/dark uses bright theme-dominant stops. UI build and whitespace check passed.

- User accepted the final Breadcrumbs light/dark contrast corrections and closed the component. Next review remains Pagination; follow-up contrast changes await the next requested commit.

- Pagination palette baseline: shared singularity root with semantic tinted surface, reactive accent resolution, neutral uncolored default, borderless neutral controls, semantic hover and full accent current page with dedicated light/dark contrast. Dense and Flat baseline preserved. UI build and whitespace check passed.

- Pagination visual feedback: container background is transparent for both neutral and semantic colors so navigation integrates with the page/body surface; accent remains on current page and hover. UI build and whitespace check passed.

- Pagination Prev/Next foreground follows the selected accent on transparent controls; dark state in dark theme uses readable theme foreground. UI build and whitespace check passed.

- Pagination Flat: removed current-page solid fill/shadow, using bold accent text with readable dark-theme dark state. Reduced control spacing and inline padding to keep navigation together at common lab widths. UI build and whitespace check passed.

- Pagination Shadow moved from container to individual buttons with compact two-layer elevation and dark-theme opacity. UI build and whitespace check passed.

- Pagination Outline now belongs to buttons: thin tinted borders, transparent fills, stronger semantic active border/text and subtle hover. Dark-state active uses theme foreground/border in dark theme; container remains borderless. UI build and whitespace check passed.

- Pagination Shadow corrected per feedback: explicit box-shadow:none on root and inactive buttons; compact elevation applies only to active button in both themes. UI build and whitespace check passed.

- Pagination Outline visible border restricted to active button; inactive borders transparent to retain consistent sizing. UI build and whitespace check passed.

- Pagination active Shadow strengthened to 2px/4px and 5px/10px layers for clearer elevation, with stronger dark-theme opacity. Container and inactive controls remain shadowless. UI build and whitespace check passed.

- Pagination Light Shadow moved exclusively to active button with directional light/tinted shadow and dedicated dark values; root shadow explicitly disabled. UI build and whitespace check passed.

- Pagination Light Shadow refined with inset upper-left highlight/lower-right shade plus directional exterior light and shadow, including dedicated dark-theme values. Effect remains restricted to active button. UI build and whitespace check passed.

- Pagination Border enabled on active button only, with a contrasting semantic edge retaining full active fill and borderless container. UI build and whitespace check passed.

- Pagination Glossy, Glow, Glass, Gradient and Text Gradient are forwarded exclusively to active Button, omitted from container property application. CSS preserves Button effect layers, restrained glow, readable Glass and label gradient. UI build, whitespace check and all 72 tests passed.

- Fixed Pagination runtime ReferenceError by replacing unavailable uiOmit with a local props copy and effect-key removal. Rebuilt UI; Chrome local preview ready with no lab runtime error; all 72 tests passed.

- Pagination container explicitly clears background images, shadows, glass pseudo-element/backdrop filtering and text clipping, preventing shared effects from painting the box while active Button retains its own effects. UI build and whitespace check passed.

- Pagination Glass container pseudo-element disabled with higher specificity than the later shared Glass rule, fixing the remaining box reflection. Active Button Glass unaffected. UI build and whitespace check passed.

- Pagination Outline + Text Gradient corrected: explicit root/inactive text fill reset and higher-specificity active gradient prevents shared descendant clipping and Outline background shorthand from hiding labels. UI build and whitespace check passed.

- Pagination dark Glass active foreground, including Outline combinations, uses pale text and subtle contrast shadow instead of semantic dark text; glass reflections and colored borders retained. UI build and whitespace check passed.

- User accepted and closed Pagination after the effect-placement and contrast review. Next component in source order is TabPanel. Pending Pagination and Breadcrumbs follow-up changes remain uncommitted; no commit requested on closure.

- Started TabPanel review: local lab covers palette/effects, navigation variants, horizontal/vertical layouts, after position, disabled tab, animated/swipeable panels, empty state and model shared with Tabs. Chrome initial load ready without lab runtime error. Framework styling unchanged pending baseline visual review.

- TabPanel palette baseline implemented: theme-token navigation surfaces; normal, hover, pressed, selected, focus-visible and disabled colors; tinted Pills/Soft selection; inherited icon/note foreground; readable Light and dark-theme Dark text and indicators. Rebuilt UI; all 72 unit/package tests and 27 browser tests passed. Visual review and effect refinement remain open.


- User requested reverting the modern TabPanel surface pass. Removed only its container/navigation/spacing/Dense/Flat styling; retained the preceding palette baseline.

- TabPanel Dense now reduces navigation spacing, button height/padding, icon gap and panel padding. Flat clears container/nav background, borders and shadows while retaining active indicator. UI build and whitespace check passed.

- TabPanel implicit elevation removed: shadow is disabled unless Shadow or Light Shadow is explicitly requested. Flat continues to suppress elevation. UI build and whitespace check passed.

- TabPanel Glossy now paints the visible navigation with the Button-style upper reflection band, distinct center transition and lower shading, with dedicated dark-theme reflections. UI build and whitespace check passed.

- TabPanel Glass restricted to navigation: root reflection/backdrop disabled; nav uses transparent tint and shared radial Glass pseudo-element/reflections used by other components. Content remains unaffected. UI build and whitespace check passed.

- TabPanel Outline root/navigation borders now follow semantic indicator color, retaining neutral light/dark contrast adaptations. UI build and whitespace check passed.

- TabPanel default root/navigation borders removed unless Border or Outline is explicitly requested. Active indicator retained. UI build and whitespace check passed.

- TabPanel Text Gradient now clips distinct semantic/theme stops on nav labels/notes only, resetting container/button clipping to preserve readable panel content and icons. UI build and whitespace check passed.

- TabPanel Gradient enabled on navigation using shared gradient stops/angle; white nav foreground and active indicator, dark foreground for light state. Panel content remains unaffected. UI build and whitespace check passed.

- TabPanel Gradient softened to shared stops mixed at 16%/30% with theme background; theme foreground and semantic indicator restored for contrast on the lighter surface. UI build and whitespace check passed.

- TabPanel variants differentiated: Line indicator, rounded Pills selection, Soft rectangular tint without indicator, Solid full accent selection with readable light/dark states. Solid added to runtime normalization, public contract and local lab. UI build, whitespace check and all 72 tests passed.

- TabPanel dark Glass reflection brightness reduced to 0.6, excluding light state; shared radial reflections and translucency preserved. UI build and whitespace check passed.

- User accepted and closed TabPanel and requested commit. Completed Pagination, TabPanel and Breadcrumbs contrast follow-ups grouped in commit. Latest full suite: 72 passed. Next visual review: Spinner; local lab prepared.

- Spinner Dense uses 14px default indicator, tighter spacing and smaller text; explicit size remains authoritative. Flat uses transparent default track, retaining the colored rotating arc; explicit trackColor remains authoritative. CSS defaults routed through fallback variables. UI build, whitespace check and all 72 tests passed.

- Spinner Outline removes text-container border and gives the indicator a defined semantic contour with open rotating segment. Shadow applies only to the ring via drop-shadow, with dedicated dark strength. UI build and whitespace check passed.

- Spinner Outline differentiated from Flat after approval: complete 1px ring at 55% semantic opacity with stronger rotating top/right segment; Flat retains open arc. UI build and whitespace check passed.

- Spinner Light Shadow adds directional highlight/shade on the indicator; Border adds an outer semantic contour; Glossy adds a distinct reflective band with dedicated dark values. Text/root remain undecorated. UI build and whitespace check passed.

- Spinner lighting corrected: Shadow and Light Shadow now belong to the stationary indicator wrapper, while only the inner arc rotates. Directional lighting remains fixed in both themes. UI build and whitespace check passed.

- Spinner Glow enabled as restrained stationary semantic halos; Glass uses a translucent indicator surface with stationary radial reflection, inset edges and dark-theme values. Root/text remain undecorated and only arc rotates. UI build and whitespace check passed.

- Spinner Glossy reflection/background and inset shading moved from rotating pseudo-element to stationary circular indicator wrapper, including dark theme. Only arc remains animated. UI build and whitespace check passed.

- Spinner Outline + Light Shadow color fixed: indicator resolves semantic hover color rather than shared border-color, which becomes a four-color border shorthand in this combination and is invalid as a foreground. Stationary lighting preserved. UI build and whitespace check passed.

- Spinner light state in dark theme now uses a pale slate semantic indicator color (#e2e8f0), keeping all indicator effects visible independently of inverted theme light tokens. UI build and whitespace check passed.

- Spinner Text Gradient now applies semantic-to-theme gradient directly to label, copy and note, with root text clipping reset and indicator unchanged. UI build and whitespace check passed.

- User accepted and closed Spinner. Next component: Progress; local lab prepared. Spinner changes remain uncommitted pending a commit request.

- Progress Dense uses 4px default height, smaller text and tighter heading spacing; explicit height/size retained. Flat removes borders/shadows and uses square track geometry. UI build, whitespace check and all 72 tests passed.

- Progress Outline removes wrapper border and outlines only fill with semantic edge/transparent surface. Shadow applies to filled bar only; track overflow allows elevation to remain visible, dedicated dark strength. UI build and whitespace check passed.

- Progress Border enabled on filled bar with contrasting semantic contour and border-box sizing; wrapper remains borderless. UI build and whitespace check passed.

- Progress Text Gradient now styles label, note, percentage and edge labels directly, with explicit wrapper effect class and readable root text fill. UI build and whitespace check passed.

- Progress light state in dark theme uses pale slate component-owned fill/border/effect tokens, restoring Outline and other fill effect visibility. UI build and whitespace check passed.

- Progress Glow text readability: removed wrapper/header text-shadow and raised dark-theme note contrast; bar glow retained. UI build and whitespace check passed.

- User accepted and closed Progress and requested commit of completed Spinner/Progress changes. Next review: LoadingBar; inline local lab prepared to avoid overlapping fixed bars.

- LoadingBar Dense uses a 2px default height versus 3px baseline; explicit sizing preserved. Flat defaults to transparent track, preserving explicit trackColor. UI build, whitespace check and all 72 tests passed.

- LoadingBar Outline removes the shell border/outline; semantic contour remains only on the advanced Progress fill. UI build and whitespace check passed.

- LoadingBar Border/Glossy default height raised to 4px (Dense 2px and explicit heights preserved) to expose detail. Border shell cleared; Glossy fill has stronger upper reflection and lower shade. UI build and whitespace check passed.

- LoadingBar lab Text Gradient labels now render a semantic/theme text gradient. These labels belong to the lab, not LoadingBar itself, which has no text in the baseline fixture.

- LoadingBar dark Glass light fill now uses translucent pale slate background and bright reflection tokens, restoring contrast while retaining translucency. UI build and whitespace check passed.

- LoadingBar dark light-state contrast extended to Outline + Glass with explicit pale border/translucent fill and Text Gradient with visible pale gradient surface. UI build and whitespace check passed.

- Verified LoadingBar Outline + Glass light in dark theme in Chrome: computed border rgb(226,232,240), translucent fill rgba(226,232,240,0.3). Updated lab CSS cache key to ensure latest compiled stylesheet loads.

- LoadingBar Outline + Glass dark light-state visibility reinforced at shell scope: pale translucent track, brighter 55% fill and explicit inset pale contour, retaining glass transparency. UI build and whitespace check passed.

- Fixed Progress/LoadingBar inline light track/buffer colors at their source: semantic light resolves through component --jss-progress-light, overridden to pale slate in dark theme. Previously inline background still referenced inverted --jss-light. UI build and whitespace check passed.

- User accepted and closed LoadingBar. Next component: Notify; prepared interactive local fixture. LoadingBar changes await a future commit request.

- Notify container radius now consumes common --set-border-radius with shared --jss-b-radius-default fallback, removing dedicated large radius. Existing common property application handles explicit radius/borderRadius. UI build and whitespace check passed.

- Notify Dense gains 4px padding and 8px content gap to preserve compact spacing without touching edges. UI build and whitespace check passed.

- Notify Flat removes container fill, border, shadow and backdrop blur; icon loses its badge surface while semantic side stripe and readable theme foreground remain. UI build and whitespace check passed.

- Notify Flat corrected after feedback: opaque theme background with 8% semantic tint prevents underlying page content showing through; borders/shadows remain disabled. UI build and whitespace check passed.

- Notify Outline (shared prop/native variant) uses opaque theme background, semantic border, no elevation/backdrop blur and readable dismiss control. UI build and whitespace check passed.

- Notify Shadow refined to compact downward two-layer elevation (2px/4px and 6px/14px with negative spread), dedicated dark opacity. UI build and whitespace check passed.

- Notify Light Shadow differentiated with upper-left inset/exterior light and lower-right inset/exterior shade, including dedicated dark-theme values. UI build and whitespace check passed.

- Notify implicit container shadow disabled unless Shadow or Light Shadow is explicitly requested. UI build and whitespace check passed.

- Notify Border uses explicit 1px semantic accent contour while retaining tinted surface. UI build and whitespace check passed.

- Notify Glossy now uses distinct upper reflection band and lower tint/shade with dedicated dark values, preserving existing tinted base and explicit-only shadows. UI build and whitespace check passed.

- Notify Glow enabled with restrained 3px/9px semantic halos at 40%/25% opacity and no text shadow. UI build and whitespace check passed.

- Notify Glass enabled with translucent theme base, radial upper reflection/lower semantic tint and 8px backdrop blur, readable theme foreground and darker dark-theme surface excluding light. UI build and whitespace check passed.

- Notify Gradient enabled with restrained 12%/30% semantic tint stops mixed against opaque theme background and readable theme foreground. UI build and whitespace check passed.

- Notify Outline + Glossy restores upper reflection band and lower semantic shading over the theme base, overriding Outline background reset while preserving semantic border and no elevation. Dedicated dark reflection values. UI build and whitespace check passed.

- Notify Outline + Glow restores restrained semantic halos over Outline shadow reset, retaining colored contour and sharp text. UI build and whitespace check passed.

- Notify Outline + Glass overrides Outline opaque background/disabled backdrop with shared translucent radial reflections and 8px blur, preserving semantic border and darker dark-theme surface except light. UI build and whitespace check passed.

- Notify Outline + Light Shadow restores directional upper-left light/lower-right shade over Outline shadow reset, retaining semantic border and dedicated dark values. UI build and whitespace check passed.

- Notify Text Gradient applies semantic-to-theme stops directly to title/message/description/meta, preserving root background, icons and dismissal readability. UI build and whitespace check passed.

- Notify variants differentiated: Soft opaque 10% tint with no visible contour; Outline semantic border and hollow icon badge; Solid full semantic fill with contrasting text/icon/dismiss controls and dark foreground for warning/light. UI build, whitespace check and all 72 tests passed.

- Notify without type/state/color now normalizes to a neutral theme surface and foreground instead of Info; explicit semantic colors and shortcuts remain supported. Neutral default title retained. Public contract updated; UI build and all 72 tests passed.

- Notify dark-theme light accent now stays pale (#e2e8f0) instead of inheriting the inverted shared light token. All effects, icon badges, borders and Solid surfaces consume the same accent; Solid retains dark foreground. UI build and all 72 tests passed.

- User accepted and closed Notify. Next visual review: Dialog; local interactive lab prepared for colors/effects, sizes, alignment and persistent dismissal. LoadingBar and Notify remain uncommitted pending a commit request.

- Dialog subtitle inherits the resolved dialog foreground, matching title/body semantic color and effect contrast instead of fixed muted gray. Applies across all semantic colors and both themes. UI build and 72 tests passed.

- Dialog Secondary foreground now uses theme text instead of pale palette step 2, restoring title/subtitle/body and dismiss contrast on the tinted surface in both themes. UI build and 72 tests passed.

- Dialog Light foreground now uses theme text instead of pale palette step 2, restoring title/subtitle/body and dismiss readability on the light surface. UI build and 72 tests passed.

- Dialog Dark foreground now uses theme text instead of pale palette step 2, matching Secondary/Light contrast fixes while retaining the dark semantic accent. UI build and 72 tests passed.

- Dialog Light icon badge now uses theme foreground with subtle matching background/border instead of the near-white accent, making both glyph and badge visible. UI build and 72 tests passed.

- Dialog Flat keeps opaque semantic/theme surface, removes elevation, contour and section dividers, and renders icon/dismiss without badge/button borders. Shared rule covers every semantic color, including Light badge override. UI build and 72 tests passed.

- Dialog Outline uses opaque theme background/foreground, semantic contour (theme foreground for light/dark visibility), no elevation or backdrop blur, and readable dismiss. Global Outline descendant button recoloring excludes Dialog so action buttons retain their own contrast. UI build and 72 tests passed.

- Dialog Shadow uses compact two-layer downward elevation (2px/4px contact and 8px/20px spread -4), with dedicated dark opacities and explicit shadow token to override generic effect defaults. UI build and 72 tests passed.

- Dialog Shadow strengthened after visual feedback: 3px/8px contact shadow plus 18px/36px elevation with -6px spread, light opacity 28%/48% and dark 50%/75%, for clearer separation over the dimmed backdrop. UI build and 72 tests passed.

- Dialog Light Shadow replaces uniform halo with directional upper-left exterior/inset light and lower-right contact/elevation shade. Dedicated dark values keep reflection restrained and depth visible. UI build and 72 tests passed.

- Dialog Border now uses explicit semantic accent contour and shared border width, with theme foreground contour for light/dark visibility. UI build and 72 tests passed.

- Dialog Glossy reflection moved to title bar only: upper highlight/lower semantic shade with dedicated dark values, while root/body/actions retain uniform opaque surface. UI build and 72 tests passed.

- Dialog Glow reduced to tight 3px/9px semantic halos at 35%/22%, removing broad generic glow and inherited text shadow. UI build and 72 tests passed.

- Dialog Glow recalibrated after feedback: previous 35%/22% halos disappeared over backdrop; now 4px spread 1px at 65% and 14px spread 2px at 42%, preserving sharp text. UI build and 72 tests passed.

- Dialog Glass now uses 62% translucent theme surface (65% dark), 16px backdrop blur with saturation, diagonal reflection and inset top highlight; removes generic glass pseudo-layer. Theme foreground and independent action button colors preserve readability. UI build and 72 tests passed.

- Dialog Glass made subtler: 5% semantic tint over 82% theme surface reduces strong background color bleed while retaining backdrop blur/translucency in both themes. UI build and 72 tests passed.

- Dialog Glass opacity reduced from 82% to 68% theme surface after visual feedback, retaining 5% semantic tint and 16px blur to restore translucency. UI build and 72 tests passed.

- Dialog Gradient replaces saturated generic fill with opaque three-stop semantic tint (6%/12%/22%) over theme background; theme foreground and readable dismiss restore contrast across colors/themes. UI build and 72 tests passed.

- Dialog Gradient tint increased to 10%/20%/32% after user feedback, retaining theme foreground. UI build and 72 tests passed.

- Dialog color Dark now owns a dark local surface (#1f2937), light foreground (#f1f5f9), and slate effect/border accent in either app theme. Local surface/foreground feed Flat, Outline, Gradient and Glass; icon, dismiss and flat actions keep contrast. UI build and 72 tests passed.

- Dialog Light Shadow reflection reduced and elevation softened. Dark color now receives the restrained dark-surface preset even in light app theme, eliminating bright exterior halo (4% white exterior, 16% inset). UI build and 72 tests passed.

- Dialog Dark Glow uses dedicated deep slate halos (#0f172a at 80%/55%) instead of light border accent, removing white glow. UI build and 72 tests passed.

- Dialog Text Gradient restores opaque root surface and normal icon/button fill, applying semantic-to-theme text stops only to title/subtitle/body. Scoped button rule overrides generic descendant gradient. UI build and 72 tests passed.

- Dialog Text Gradient made more distinct with accent-to-theme foreground three stops; title/subtitle fit content width so full ramp appears across actual text. UI build and 72 tests passed.

- Dialog Light now owns pale surface (#f1f5f9), dark foreground (#1f2937) and readable slate accent in either app theme, feeding all effect surfaces including Flat/Outline/Gradient/Glass. Dismiss and flat actions inherit dark foreground. UI build and 72 tests passed.

- Dialog dark-surface Light Shadow enhanced with cool upper-left inset highlight and directional exterior reflection, contact shade and deeper lower-right elevation. Softer semantic/theme contour reduces competing bright border. UI build and 72 tests passed.

- User accepted and closed Dialog and requested commit. Completed LoadingBar, Notify and Dialog revisions grouped for commit. Latest suite: 72 passed. Next visual review: Tooltip; interactive local lab prepared.

- Tooltip radius now consumes shared --set-border-radius with default radius fallback, respecting user radius/borderRadius through property props. Added color/state semantic panel classes and eight palette surfaces/icon accents, neutral without color, explicit pale/dark surfaces across themes. Public Tooltip contract updated. UI build and 72 tests passed.

- Tooltip implicit elevation removed, including inherited overlay panel shadow. Only explicit Shadow, Light Shadow or Glow applies an effect; component-owned rules preserve those requested effects. UI build and 72 tests passed.

- Tooltip Outline now uses opaque theme surface, readable theme text and semantic accent contour instead of tinted fill; Light/Dark keep contrasting contours. UI build and 72 tests passed.

- Tooltip default border removed; only explicit Border/Outline draws semantic contour. Light Shadow refined with upper-left inset/exterior reflection, subtle contact shadow and softer lower-right elevation; dedicated dark surface values also apply to Dark color in light theme. UI build and 72 tests passed.

- Tooltip Glossy now renders upper reflection band and lower semantic tint over its base, with restrained white/black stops for dark surfaces and readable unchanged text. UI build and 72 tests passed.

- Tooltip Glass now uses translucent 68% theme surface with 5% semantic tint, diagonal reflection and 12px backdrop blur/saturation. Dedicated dark reflection and no generic pseudo-layer preserve clarity. UI build and 72 tests passed.

- Tooltip Glass aligned to Button after user request: shares the actual radial reflection pseudo-layer and inset contour, 40% semantic translucent base, 1px backdrop blur; isolated stacking preserves foreground and overlay positioning. Replaces previous frosted-glass treatment. UI build and 72 tests passed.

- Tooltip Gradient now renders three semantic tint stops (10%/20%/32%) over opaque local theme surface, preserving readable foreground and Light/Dark surface identity. UI build and 72 tests passed.

- Tooltip Outline + Glossy restores reflection over Outline background reset: upper highlight, restrained lower semantic tint and dedicated dark shading, retaining explicit semantic border. UI build and 72 tests passed.

- Tooltip Outline + Glass excluded from generic Outline Glass pseudo-layer override, preserving the same radial reflections/translucency as normal Glass plus semantic contour. Also prevents generic relative position override of anchored overlay. UI build and 72 tests passed.

- Tooltip Dark Glass now uses deep slate 80% translucent base and dims shared radial reflection layer to 25% brightness, retaining pale readable foreground; applies to Outline + Glass too. UI build and 72 tests passed.

- Tooltip Dark Glass translucency increased: deep slate base alpha 55% and shared reflection layer opacity 45%, retaining dimmed dark reflections without opaque veil. UI build and 72 tests passed.

- Tooltip Text Gradient now clips semantic-to-theme three-stop gradient directly to title/body, fitted to actual text width with full opacity; root keeps opaque base and normal icon fill. UI build and 72 tests passed.

- Tooltip wrapper now uses intrinsic fit-content width instead of stretching across grid cells, so right/left placement anchors to the actual trigger bounds. Automatic viewport collision flip remains supported. UI build and 72 tests passed; browser suite running.
- Browser verification completed: all 27 browser tests passed.

- Tooltip Shadow dark-surface elevation strengthened with 3px/6px contact and 10px/22px ambient shade at 50%/80%, plus subtle 12% top inset reflection to distinguish edges against dark background. Applies to Dark color in either theme. UI build and 72 tests passed.

- Tooltip Glass dark theme now uses translucent deep-slate base with 12% semantic tint and dimmed radial reflection layer (35% brightness, 50% opacity), excluding Light. Shared Glass rule also covers Outline + Glass. UI build and 72 tests passed.

- User accepted and closed Tooltip. Next component: Popover; interactive local lab prepared for themes, palette, effects and placement. Tooltip changes remain uncommitted pending a commit request.

- Popover Glow slightly attenuated independently of Dialog: 3px/11px halos with 1px spread at 50%/32%, dedicated deep slate Dark halo at 65%/42%. Text remains sharp. UI build and 72 tests passed.

- Popover implicit panel contour removed with component-specific rule; border renders only when Border or Outline is explicitly requested. UI build and 72 tests passed.

- Fixed Popover stale entry after overlay-managed closure: onClose clears only the matching current entry, so outside click/Escape can reopen on the same trigger without touching a newer overlay. Added Chrome regression covering both closure paths and repeated opening. UI build, 72 unit tests and targeted browser regression passed.

- User accepted and closed Popover and requested commit. Completed Tooltip and Popover changes grouped, including Popover reopen regression. Latest checks: UI build, 72 unit tests, 27 browser tests plus targeted reopen test. Next visual review: Menu; local interactive fixture prepared.

- Menu surface aligned with Popover through shared CSS declarations/selectors for palette, Outline, Flat, Border, Shadow, Light Shadow, Glossy title bar, Glow, Glass, Gradient and Text Gradient. Menu retains its item structure, keyboard behavior, dimensions and overlay placement. Shared/user radius replaces overlay radius; no implicit borders/elevation; compact density metrics; Light/Dark surface identity retained. Neutral surface and readable item foreground defined locally. UI build, all 72 unit tests and 3 Menu/ContextMenu browser tests passed.

- Fixed the same stale-overlay entry bug in Menu: overlay-managed outside click/Escape now clears matching entry before callbacks, enabling reopening on the same button. Popover fix remains intact. Added Menu browser regression and reran both Menu/Popover reopening tests. UI build, 72 unit tests and both browser regressions passed.

- Menu Dense now resets generic wrapper padding/margin, retains 4px inner gutter, uses compact 28px-minimum entries with 4px/8px padding and 2px list gaps, tighter group/header/footer spacing and corrected Glossy header margins. UI build, 72 unit tests and 4 Menu/ContextMenu browser tests passed.

- Root cause of unchanged Menu Dense: common effect classes were mounted on inner shell instead of overlay panel. Moved class/style application to panel, matching Popover and avoiding nested effect surfaces. Added Chrome regression asserting effect classes on panel and Dense height reduction >15px. UI build, 72 unit tests, 4 existing Menu browser tests and new density regression passed.

- Menu Outline refined with explicit semantic contour, matching title/icon accents, subtle semantic hover/focus fill and coordinated separators while retaining neutral base and readable item labels. Shared Glass/Glossy combinations retained. UI build and 72 tests passed.

- Menu without color now uses opaque neutral surface mixed with 5% theme foreground, distinguishing it from page background without semantic tint, implicit border or elevation. UI build and 72 tests passed.

- Menu dark-theme semantic base tint increased from 12% to 28% so palette colors remain visible on dark surfaces; Light/Dark keep their dedicated surfaces and theme foreground remains readable. UI build and 72 tests passed.

- Menu and Popover focus restoration now uses preventScroll:true, preserving page scroll when closing after scrolling away from trigger. Added Chrome regression verifying scroll unchanged and focus restored for both; reran both reopen regressions. UI build, 72 unit tests and 3 targeted browser tests passed.

- User accepted and closed Menu. Next visual review: ContextMenu; interactive fixture prepared with right-click, keyboard binding and click preview. Menu and scroll-restoration changes remain uncommitted pending a commit request.

- User accepted and closed ContextMenu. Next component: Table; local fixture prepared with palette/effects matrix, sortable columns, search/pagination and empty/loading states. Completed Menu work remains uncommitted pending request.

- Table redesigned for both themes: neutral data surface, semantic header accents, compact independent search/pagination controls, readable numeric alignment, explicit density and effect surfaces, theme-independent Light/Dark identity and user/default radius. Removed inherited internal palette/effect wrappers and redundant pagination metadata; pagination:false hides navigation and page-size controls. Added search/pager accessible labels and sortable header aria-sort. Updated Table contract and CRUD custom header surface token. Visual Chrome review covered both themes, palette, effects and narrow layouts. UI build and 72 unit tests passed; browser suite passed 31/32 initially, with the CRUD custom-white-header example corrected and its failing test passing on rerun. New Table browser regression passes sorting, search, pagination, density, contrast and mobile overflow checks. Table remains open for user visual review; no commit requested.

- Table Glass now reuses the shared Button radial reflection pseudo-layer, inset optical edge and 1px backdrop blur, with a 40% translucent semantic surface. Removed flat frosted wash and opaque header fill; dark theme uses a deep translucent base and attenuated reflections, preserving Light identity. Applies to Outline + Glass too. UI build, 72 unit tests and Chrome screenshot review in both themes passed; diff check clean.

- Per user review, Table Glass moved to the column header band only: shared Button radial reflections and translucent semantic fill now belong to thead; Card root uses the normal surface with no Glass pseudo-layer or backdrop blur. Body, status and footer remain neutral. Dark reflection attenuation follows the header. UI build and Chrome light-theme screenshot review passed; diff check clean.

- Table heading and hover separated after user review: normal semantic header tint increased to 16% (26% on dark surfaces), row hover reduced to 5%. Applies across semantic palette without flattening specialized heading effects. UI build, targeted Table browser regression (both themes, contrast and interactions) and diff check passed.

- Fixed dark-theme Card Glass rule overriding Table root background: component-specific dark selector now preserves local Table surface, including Light. Extended Table browser regression to assert Light Glass remains rgb(241,245,249) in both themes. UI build, targeted browser regression and diff check passed.

- Light Glass heading now uses pale slate-gray base and fixed white/pale-gray reflection colors, independent of global dark palette. UI build, Table browser regression and diff check passed.

- Adjusted Light Glass heading after review: previous pale-gray correction was too bright. Set medium cool-gray base with restrained silver radial reflections, closer to original gray while slightly lighter. UI build and diff check passed.

- User accepted and closed Table. Next visual review: Stat; local palette/effects fixture prepared with metric, trend, note and footer in both themes. Pending changes remain uncommitted; no commit requested.

- Stat Shadow strengthened with 3px/7px contact and 14px/28px ambient shadow at 22%/32%; dark surfaces use 55%/80% depth and subtle top inset reflection. Changes scoped to explicit Shadow. UI build, Chrome visual review and diff check passed.

- Stat Light Shadow refined: soft upper-left light, restrained top reflection and layered lower-right shade; dedicated dark-surface intensities avoid white halo. Removed implicit Stat border, retaining explicit Border/Outline. UI build, Chrome screenshot review and diff check passed.

- Stat Light Shadow now visibly lights the surface itself: broad upper-left radial highlight and diagonal lower-right shade, retaining directional exterior elevation and no border. Dark surfaces use reduced highlight and deeper shade. UI build, Chrome visual review and diff check passed.

- Stat supporting text (note/subtitle, meta, footer and aside) now inherits component foreground instead of global page-muted color; eyebrow opacity increased to 85%. Fix follows semantic surface foreground across themes and effects. UI build, Chrome screenshot review and diff check passed.

- Stat Dark Outline foreground now follows theme text because its surface is transparent, fixing white-on-light title, value and supporting text. Explicit dark outline contour retained. UI build and diff check passed.

- Stat Glass foreground now uses theme text rather than semantic text-on-fill, correcting washed-out title, value and supporting text on translucent Primary/Warning surfaces. Applies to Glass combinations. UI build, Chrome screenshot review and diff check passed.

- Stat Glow slightly attenuated: outer halo 15px/2px full color reduced to 13px/1px at 80%; near halo reduced to 2px spread at 45%, text glow reduced to 2px/55%. Inner lighting retained. UI build and diff check passed.

- Uncolored Stat now owns a neutral surface mixed with 5% theme foreground, preserving readable theme text, trend semantics and no implicit border/elevation. Outline stays transparent. UI build, Chrome visual review and diff check passed.

- Dark-theme Stat Glass darkened with translucent deep-slate base and 12% semantic tint; shared radial reflection layer dimmed to 35% brightness at 50% opacity. Light explicitly excluded; applies to Outline + Glass. UI build, Chrome dark-theme visual review and diff check passed.

- Per explicit user setting, Stat dark Glass reflection brightness increased from .35 to .6; opacity remains .5 and Light stays excluded. UI build and diff check passed.

- User accepted and closed Stat and requested commit. Grouped approved Menu/ContextMenu, Table and Stat refinements with generated mirrors and documentation. Final checks: UI build, 72 unit tests, all 32 browser tests and diff check passed. Next component Kpi; local palette/effects/trend fixture prepared.

- Kpi aligned with approved Stat styling by sharing selectors, without duplicating declarations: explicit border ownership, Shadow/Light Shadow, directional surface light, foreground/supporting text, Dark Outline, Glass dark reflection brightness .6 (except Light), attenuated Glow and neutral surface. Kpi retains its value/delta row, media and spacing. Fixed Kpi trend normalization/classes to match Stat positive/negative/neutral behavior, including reactive inputs. UI build, all 72 unit tests, light/dark Chrome screenshot review and diff check passed. Kpi awaits user visual review; no commit requested.

- User accepted and closed Kpi. Next component Header; local theme/palette/effects fixture prepared with title, subtitle and action, plus neutral and stacked examples. Kpi changes remain uncommitted pending request.

- Header aligned to approved Stat/Kpi shared surface selectors: semantic backgrounds, readable supporting text, neutral surface, Dark Outline foreground, Glass with dark reflection brightness .6 excluding Light, explicit borders, Shadow/Light Shadow and attenuated Glow. Preserved Header composition, restored shared Glossy/Gradient image layers overridden by panel shorthand, default/user radius and inherited foreground for uncolored action buttons. UI build, 72 unit tests, light/dark Chrome screenshot review and diff check passed. Header awaits user review; no commit requested.

- Header Dense fixed: common props emit jss-dense while legacy CSS targeted dense. Added 8px/12px padding, tighter heading/copy gaps, 16px title and compact 28px action controls. Uncolored Header buttons now have a foreground-tinted surface, subtle contour and stronger hover, with inherited readable text. UI build, Chrome Default/Dense comparison and diff check passed.

- Fixed Header Light Outline in dark theme: theme foreground and pale slate contour replace dark text/border designed for solid Light fill; uncolored action inherits readable foreground. UI build and diff check passed.

- User accepted and closed Header. Next component Drawer; local palette/effects fixture prepared with navigation, nested items and active selection. Header and Kpi remain uncommitted pending request.

- Drawer redesigned with neutral surfaces and semantic selection, 42px navigation rows, distinct 32px Dense rows, consistent 12px gutters, readable secondary text, restrained header/footer separators, continuous nested guide lines and opt-in outer borders. Light/Dark identity retained, including Glass; shadows, directional light, Glow and dark Glass reflection brightness .6 share approved surface rules. Added inline SVG chevrons, applied missing common props/singularity, linked disclosure aria-controls and hid collapsed groups from keyboard navigation; leaf links now update active state. Updated Drawer contract. New browser regression covers groups, selection, semantic props, SVG, Dense, Light identity and mobile overflow in both themes.

- Drawer verification: UI build, 72 unit tests, all 33 browser tests and diff check passed. Chrome visual review covered light/dark Default, Dense, Glass plus Outline, Light Shadow and Text Gradient. Final neutral Outline correction keeps Light/Dark outline text on theme surface. Drawer remains open for user visual review; no commit requested.

- Drawer semantic background now takes a very subtle 4% accent tint in both themes, preserving stronger active selection and dedicated Light/Dark/neutral surfaces. UI build, targeted Drawer browser regression and diff check passed.

- Drawer Dark/Light Flat now derive foreground, muted text, separators and neutral selection from page theme because the surface is transparent. Fixes white-on-light Dark Flat and inverse Light Flat mismatch. UI build, Drawer browser regression and diff check passed.

- Drawer Glossy now visibly reflects on active navigation entries, replacing barely visible header wash. Two-part upper highlight/lower shade uses dedicated dark intensities, retaining neutral Drawer background. UI build and diff check passed.

- Drawer Glass moved from enclosing surface to selected entry. Reused shared Button radial optical layer on active entry pseudo-element, 30% translucent semantic fill and 1px backdrop blur; root restored to regular surface with pseudo-layer disabled. Dark reflections retain brightness .6/opacity .5; Light keeps pale optical colors. Contract updated. UI build, Drawer browser regression and diff check passed.

- Corrected Drawer Glass selector attachment: active entry now uses the actual shared Button radial optical declarations, rather than an unrelated Dialog pseudo selector. Chrome screenshot confirms visible silver reflection and optical edge. Added browser regression asserting radial reflection presence in both themes; this exposed generic Glass position:relative overriding fixed mobile Drawer placement, now corrected alongside sticky placement. UI build, targeted browser regression and diff check passed.

- Drawer Glow slightly softened independently of Stat/Kpi/Header: near halo intensity 45% to 40%, outer halo 80%/13px to 68%/12px. Inner reflection retained. UI build and diff check passed.

- Drawer Glow attenuation made visible after review: replaced inherited intense inner rim with 18% accent/3px inset, 35% near glow and 32%/8px ambient halo, removing broad spread. Chrome screenshot confirms softer optical edge. UI build and diff check passed.

- User accepted and closed Drawer and requested commit. Grouped approved Kpi, Header and Drawer refinements, docs, generated mirrors and Drawer regression. Final UI build, 72 unit tests, all 33 browser tests and diff check passed. Next component Page; local palette/effects/composition fixture prepared.

- Page aligned with Drawer: added missing common props/singularity, quiet 4% semantic surfaces, dedicated Light/Dark, theme-adapted neutral Outline/Flat, default/user radius, opt-in borders, readable supporting text and visible action buttons. Refined header/body/footer hierarchy, density, mobile aside and long-title wrapping. Shared Shadow/Light Shadow; attenuated Glow, subtle Gradient, actual title Text Gradient; Glass/Button radial reflections and Glossy on structured header only, dark Glass brightness .6 excluding Light. Corrected shared dark Glass root override caught by regression. Contract updated. UI build, 72 unit tests, 64 browser combinations (8 colors x 4 variants x 2 themes), light/dark visual review and diff check passed. Page awaits user review; no commit requested.

- User accepted and closed Page. Next component AppShell; local composition fixture prepared with Header, Drawer, Page and layout variants in both themes. Page remains uncommitted pending request.

- AppShell now supplies reactive default color to generated Header/Drawer/Page/Footer, respecting explicit color/state (including null opt-out), custom nodes, slots and nested component colors. Footer now applies common props. Fixed double Reverse inversion, full-width Stack regions and closed mobile Drawer visibility; shell uses theme background/text and Footer supporting text inherits its surface foreground. Public contract updated. UI build, 72 unit tests, browser regression across both themes and desktop/mobile widths, light/dark screenshots and diff check passed. AppShell awaits user review; no commit requested.

- User accepted and closed AppShell. Next component in shell source order: Parallax. Prepared local light/dark palette/effects fixture; Page and AppShell remain uncommitted pending request.

- Parallax now uses semantic common colors and shared Stat elevation/Glass/Glow/neutral treatments instead of interpreting color as foreground. Removed hard-coded fallback gradient; moving media and readability overlay remain separate from the semantic surface. Added explicit textColor contract, dedicated Light/Dark Glass, theme-adapted neutral Outline/Flat, title-only Text Gradient, visible actions, compact Dense and content-driven minimum height. Reduced-motion preference disables movement and cleans up its listener. UI build, 72 unit tests, browser palette/media/reactivity regression (both themes), light/dark visual inspection and diff check passed. Local fixture includes a moving background example. No commit requested; awaits review.

- Parallax motion review: uniform palette samples could not show background displacement. Added prominent first showcase with local SVG mountain landscape, speed .38, 150px offset range and sufficient background overscan. Actual Chrome scroll regression confirms independent background movement and foreground scroll position. No runtime change required; diff check passed.

- Corrected Parallax source URL quoting: SVG data URIs containing parentheses yielded invalid unquoted CSS URLs, leaving a moving but empty background. URLs now use quoted CSS strings. Extended actual-scroll regression to reject missing background images; screenshot confirms the landscape is rendered. UI build, 72 unit tests, both Parallax browser regressions and diff check passed. Earlier movement-only test did not detect missing media.

- Parallax now places a visible semantic translucent veil above media, with a pale Light veil/dark text and explicit overlay override. Visual review also exposed uncovered bottom strips at maximum offset; background overscan now follows maxOffset. Updated contract and browser tint/override assertions.

- Verification: UI build, 72 unit tests, both Parallax browser regressions (themes, media, tint, override and scroll) and diff check passed. Primary/Secondary/Warning media tint visually confirmed.

- Parallax optical effects moved above media: stationary composed Light Shadow, Gradient and Glossy veils; shared Button Glass reflection raised above image, retaining dark brightness .6 except Light. Foreground remains above all veils; Glass text follows its surface foreground. Both-theme visual inspection, UI build, both Parallax browser regressions (including optical layer ordering) and diff check passed.

- User accepted and closed Parallax and requested commit of approved Page/AppShell/Parallax work. Next visual component Footer, completing the shell composition. Made Parallax scroll regression self-contained so it does not depend on ignored lab fixtures.

- Final approved shell batch checks: UI build, 72 unit tests, all 37 browser tests and diff check passed. Committing Page/AppShell/Parallax with public docs and generated mirrors; ignored labs remain local. Next Footer.

- Footer aligned with Header shared semantic surfaces, elevation, Light Shadow, Glow and dark Glass reflections. Supporting text inherits local foreground; actions have visible fills/contours, Dense tightens all parts and Stack avoids flex-basis-driven excess height. Dedicated Light/Dark Glass foregrounds, theme-adapted neutral Flat/Outline and title-only Text Gradient. Default divider remains subtle; explicit Outline/Border encloses all sides. Contract updated. UI build, 72 unit tests, Footer browser comparison across both themes/palette/effects and desktop/mobile, visual inspections and diff check passed; awaits review.

- Footer Flat Dark correction: removed inappropriate page-theme foreground override from filled neutral surfaces. Flat retains Header filled-surface text, restoring light copy/actions on Dark and dark copy on Light. Extended Footer browser matrix to Flat with Header foreground comparison in both themes and viewport widths. UI build, targeted browser regression, visual Flat Light/Dark inspection and diff check passed.

- Header and Footer Text Gradient now use an 8% semantic tint on the theme background instead of a saturated gradient surface. Gradient is restricted to the title, with readable theme foreground for supporting copy/actions and neutral title treatment for Light/Dark. Outline stays transparent. Contracts updated. UI build, extended Header/Footer comparison including Text Gradient in both themes/viewports, light visual review and diff check passed.

- Corrected Header/Footer Light Outline + Glass foreground precedence: pale Glass surfaces now retain dark text (#1f2937) even with dark-theme Outline rules. Action buttons inherit the corrected foreground. Extended browser matrix to Outline + Glass in both themes/viewports. UI build, targeted browser regression and diff check passed.

- Header/Footer Text Gradient Light now retains a dedicated #f1f5f9 surface and #1f2937 foreground in both themes, with slate title gradient. Outline remains transparent. Browser regression asserts Light surface/foreground explicitly. UI build, targeted browser regression and diff check passed.

- Header/Footer Light Outline + Text Gradient keeps a pale 92% translucent Light surface rather than page-dark fill, with dark foreground, slate title gradient and light contour. Contracts and browser assertions updated for the combination in both themes/viewports. UI build, targeted browser regression and diff check passed.

- User accepted and closed Header follow-ups and Footer. Next visual component Toolbar; prepared local palette/effects fixture with title/subtitle/actions and neutral/stack examples. Footer and Header follow-ups remain uncommitted pending request.

- Toolbar now applies common props and singularity/panel surface classes, enabling semantic color/effects while retaining structured and plain regions. Shared Header/Footer elevation, readable supporting text/actions, neutral Light/Dark Glass and combined Outline cases. Text Gradient uses a quiet surface with actual gradient title and dedicated Light treatment; corrected duplicate background-image precedence caught by visual review. Dense tightens padding/gaps/title/buttons without wrapper margin; explicit responsive spacing remains supported and Glass keeps sticky positioning. Contract and local composition example updated. UI build, 72 unit tests, Toolbar responsive + Footer comparison + Toolbar palette/effects browser regressions, light/dark visual inspection and diff check passed. Await user review; no commit requested.

- User accepted and closed Toolbar. Next components Grid/GridCol; local fixture prepared for responsive columns, spacing, spans and nested grids. Header/Footer follow-ups and Toolbar remain uncommitted pending request.

- Grid/GridCol functional audit complete without source changes. Four browser tests passed: responsive tracks, col alias, nested-span isolation plus new mobile/tablet/desktop coverage for full/responsive spans, row/column gaps, item slots, empty state, auto-fit and overflow. Next Container; local section/layout fixture prepared.

- User accepted and closed Grid and GridCol after functional audit. Container is the active review component; existing local fixture covers width, padding, sections and grid layout.

- Container behavioral audit found explicit body bypassed start/end rendering. Preserved side regions with body in a central main wrapper; body-only placement remains direct. Added self-contained Chrome regression at 390/820/1200 for constrained width, fluid mode, axis padding, grid/gap, responsive flex direction, reactive body, semantic tag, section gap, side regions, child colors and overflow. Contract updated. UI build, 72 unit tests, targeted browser audit and diff check passed. Await user review; no commit requested.

- User requested commit after Container audit; Container accepted and closed. Grouping approved Header/Footer follow-ups, Toolbar, Grid/GridCol regressions and Container correction. Next layout components Row/Col.

- Final commit checks: UI build, 72 unit tests, eight relevant browser regressions and diff check passed. Local Row/Col fixture prepared; no publication requested.

- Row/Col audit found percentage columns ignored horizontal gap, wrapping two halves/three thirds prematurely. Generator now emits gap-aware direct Row child widths, preserving columns outside Row and auto columns. Row supplies base horizontal gap; token/arbitrary responsive gap rules update the inherited calculation. CSS build now regenerates canonical responsive source from the generator before bundling, preventing stale full-vs-light outputs. Added three-breakpoint browser coverage for spans/gaps, explicit/inline/full width, alignment, reverse, regions, reactive content and child colors. Final full checks running.

- Row/Col final verification: UI build, all 72 unit tests, all 42 browser tests, desktop visual review and diff check passed. Responsive gap and half/third columns now fit as intended; tested explicit/inline/full sizing, alignment/reverse, reactive regions and child color preservation. No commit requested.

- User accepted and closed Row/Col and requested commit. All 72 unit and 42 browser tests passed; next component Spacer, with a local horizontal/vertical flex fixture prepared.

- Spacer audit found missing setPropertyProps, so documented common dimensions and responsive overrides were ignored. Added the shared property application without changing default transparent flex behavior. Chrome audit at 390/820/1200 in both themes verifies horizontal/vertical spacing, equal spacers, minimum responsive widths, reactive slot content, child colors and no overflow. UI build, 72 unit tests, targeted browser test and diff check passed. Awaiting review; no commit requested.

- User accepted and closed Spacer and requested commit. UI build, 72 unit tests and targeted three-breakpoint/two-theme browser audit passed. Next component Layout; local composition fixture prepared.

- Layout audit found disposition and custom grid areas resolved only the current device object, dropping tablet values on desktop. Reused cumulative responsive resolution for both properties. Browser regression at 390/820/1200 in light/dark verifies inheritance, regions, controlled rods, panel open/close/toggle, Escape behavior, runtime updates, preserved child colors and no overflow. UI build, 72 unit tests, Layout audit plus AppShell composition and Layout watcher cleanup regressions passed. Public contract clarified; awaiting review, no commit requested.

- User accepted and closed Layout and requested commit. Build, 72 unit tests, Layout responsive audit, AppShell composition and watcher cleanup checks passed. Next component Icon; local palette/effects fixture prepared.

- Icon Glass glyphs inherited filled-surface foregrounds and became unreadable on pale glass. Added Icon-specific contrasting foreground, dedicated Light/Dark surfaces, dark-theme veil dimming and isolated background layering. Preserved shared Glass texture. UI build, browser regression for eight colors with/without Outline in both themes, light visual inspection and diff check passed. Awaiting review; no commit requested.

- Expanded the local Icon demo after comparison with Button: all 20 decorative variants/combinations across eight colors, plus no-color inheritance, named/numeric sizes, built-in SVG and clickable samples. Button-only loading/disabled behavior is not part of the Icon contract. Local fixture remains ignored.

- Icon Dense had no component styling and matched default dimensions. Added a local rendered-size variable: Dense scales configured size to 75%, removes outer margin and uses flex centering for font/SVG glyphs. SVG fits the inner surface; semantic foregrounds and effects remain consistent. Public Dense prop documented. UI build, 72 unit tests, Dense matrix and Glass browser regressions, desktop screenshot review and diff check passed. Awaiting review; no commit requested.

- Removed implicit Icon surface border width, retaining explicitly requested Border and Outline variants. Expanded Dense/Glass browser audit to include Border, Glossy and Gradient; both regression checks passed.

2026-10-12 — Icon review: explicit visible border, stronger shadow, reduced glow, palette-colored Glass, borderless Outline and distinct Light/Dark. Refreshed local lab CSS version. Verification: 72 unit tests, two Icon browser tests across themes, light lab screenshot inspected. Awaiting user review.

2026-10-12 — Icon Glow follow-up: replaced the nearly invisible 5px/28% halo with two colored layers, 3px/50% and 9px/40%, preserving a moderate effect. Local lab CSS version refreshed. CSS rebuild, 72 unit tests and both focused Icon browser tests passed; visual acceptance pending.

2026-10-12 — Icon fill:true: use the existing material-icons-fill class (Material Symbols FILL axis 1) only for text glyphs; false/default remains axis 0. Reactive getters supported; prop is consumed rather than leaked to DOM. SVG/custom content and legacy SVG -fill names preserved. Updated component contract, UI reference, type generator/output and local Icon lab with static/outline/comparison/reactive examples. UI build, 72 unit tests and three Icon browser tests passed; raster comparisons of the configured font confirm different default/filled forms for home/favorite/star/person/settings. User visual acceptance pending.

2026-10-12 — Icon lab examples: added six interactive Fill cards before the visual matrix, with concise source snippets, dynamic action labels, pressed state and explicit current values. Includes independent favorite/bookmark/notification/playback state, 1–5 star selection/reset and three effects driven by one signal. Chrome QA clicked every control in both themes, checked filled classes/labels/reset/shared state and found no page errors; desktop screenshot inspected. Framework implementation unchanged.

2026-10-12 — User accepted and closed Icon and requested commit. Includes Dense, explicit Border, borderless Outline, palette Glass, visible moderate Glow/Shadow, neutral glyph fixes and static/reactive Material Symbols fill:true with updated contracts/types and regressions. Local interactive labs remain ignored. Next visual component Alert; preparing palette/effects, action/dismissal and reactive-copy fixture.

- Icon final commit verification: umbrella build, 72 unit tests, all 47 browser tests and diff check passed. Alert local fixture opens with 128 palette/effect examples; reactive copy, dismissal and prevented dismissal smoke checks pass. Alert styling/props audit and user visual acceptance remain pending.

2026-10-12 — Alert Header alignment: removed old tone-specific surface overrides and conflicting accent pseudo-element; shared Header elevation, Light Shadow, Glow, Glass and title-only Text Gradient selectors now include Alert. Added component-owned Dense/sizing/gap/stack/elevated treatment, foreground inheritance for copy and uncolored actions/dismissal, dedicated readable neutral Glass surfaces and Secondary Outline fallback. Common props were already applied by normalization; semantic type/state/color now resolve before that step, avoiding conflicting tone classes. Explicit roles preserved and default roles follow reactive tone; dismissal/preventDefault and slots retained. Updated Alert contract and expanded local lab to 160 palette/effect examples. UI and umbrella builds, 72 unit tests, Alert surface/behavior and Footer/Toolbar shared-style regressions (four browser tests) passed; light/dark screenshots inspected. Await user review; no commit requested.

2026-10-12 — User accepted and closed Alert and requested the next component. Next EmptyState: preparing a local palette/effects and composition fixture, including compact/inline modes, illustration/custom slots, actions and reactive messages. Alert changes remain uncommitted; no commit requested.

- EmptyState local fixture ready: 144 palette/effect combinations and eight composition examples. Chrome smoke checks passed in both themes for reactive title/action/reset, action feedback, no-icon mode, illustration and custom slots; no page errors. Runtime unchanged; visual/props audit and acceptance remain pending.

2026-10-12 — EmptyState aligned with Alert: shared semantic surfaces, borders, elevation, Shadow/Light Shadow, Glow, Glass and title-only Text Gradient; removed old pale per-tone overrides and inherited readable supporting text/actions. Added Dense, gap, elevated and icon sizing; retained centered composition, Compact/Inline, icon:false, media/illustration, custom slots, children and reactive content. Resolve state before color normalization to avoid conflicting tone classes. Updated public contract and local lab (168 palette/effect combinations plus eight composition examples). UI/umbrella builds, 72 unit tests, three browser tests (EmptyState surfaces across eight colors, both themes and desktop/mobile widths, plus Alert surface/behavior regressions), lab interaction smoke checks and diff check passed. Light/dark screenshots inspected; Chrome software rendering omitted some glyphs in the dark screenshot, resolved by using GPU rendering for visual QA without source changes. Await user review; no commit requested.

2026-10-12 — User accepted and closed EmptyState and requested commit and next component. Commit approved Alert/EmptyState source, contracts, generated mirrors and regressions together; ignored labs stay local. Next Form: initial audit found the forms guide uses values/form.model(field), while implementation exposes model/form.field(field); preparing a fixture against the actual API before reconciling documentation.

2026-10-12 — User requested a Form bug audit rather than visual color redesign. Reproduced in real Chrome with /tmp/jss-form-audit.html: initial model name Ada yields empty field; setValue Grace leaves field empty; explicit reset returns model Ada while field remains Lin; reset without initial leaves Changed. Concurrent submits execute twice and the second completion clears submitting while first remains pending. Older async validation overwrites a newer successful result; pending validation also restores errors after reset. Form receives semantic color class but owns no surface CSS; padding/width props are ignored because setPropertyProps is absent. Forms guide uses unsupported values/form.model(name) instead of model/form.field(name). Source review additionally finds unregistered submitting effect and no field outside-pointer listener disposal; lifecycle concerns are not yet dynamically verified. No framework implementation changed; findings reported for correction.

2026-10-12 — Implemented authorized Form/useForm fixes: initialize/synchronize field rods with plain/rod models and duplicate bindings; restore cloned initial snapshot on reset; reject concurrent submits without clearing active state; invalidate outdated validation and pending pre-reset submission; sync input rod before input validation. Field dispose stops model effect and removes outside-pointer/timer resources; interacted controls register field disposal on lifecycle cleanup. Form owns/disposes submitting effect, supports documented default slot, native reset and common sizing/spacing. Updated forms guide to actual model/form.field API and fixed lab rule success return. UI/umbrella builds, all 77 unit tests (five new useForm regressions), native-browser submit/input/reset/sizing/lifecycle regression and diff check passed. Visual palette unchanged. Await user review; no commit requested.

2026-10-12 — User accepted and closed Form and requested the next component. Form fixes remain uncommitted. Next cardHeader/cardBody/cardFooter: local card-sections.html fixture prepared for composition, dividers, slots, reactive body and mobile/desktop action layout; framework unchanged for this step.

2026-10-12 — User requested commit of approved Form/useForm fixes, contracts, generated runtime mirrors and regressions. Verification: 77 unit tests, native browser regression, UI/umbrella builds and diff check passed. Local labs remain ignored; next card sections audit.

2026-10-12 — User requested parent Card as reference for cardHeader/cardBody/cardFooter. Added explicit-section marker and scoped styles: inherit parent foreground, transparent section surfaces, no additional header top margin, opt-in header/footer divider and currentColor separator. Existing structured Card sections retain defaults; parent Dense remains authoritative. Lab now includes 104 palette/effect samples plus six compositions; contracts explain parent-owned effects. UI/umbrella builds, 77 unit tests and browser regression across eight colors, ten effects, both themes and mobile/desktop passed, including slots, reactive body, density and responsive footer. Await user review; no commit requested.

2026-10-12 — Glass Card action contrast: excluded Card from generic Glass descendant Button foreground/border override so child Button retains its own palette and effects. Secondary Outline now owns theme foreground rather than inheriting ancestor tone. Lab cache key refreshed. UI/umbrella builds, 77 unit tests and two browser regressions passed; 384 Glass Card/child Button color/effect/theme combinations match standalone Button appearance. Diff check passed; await review.

2026-10-12 — Fixed the analogous Outline ancestor override of child Button foreground/border by excluding Card. Extended regression to Glass, Outline and Outline+Glass parents: 1,152 combinations across child palette/effects and both themes match standalone Button. UI/umbrella builds, 77 unit tests, both targeted browser regressions and diff check passed. Lab cache key refreshed; await review.

2026-10-12 — Light Card Outline/Text Gradient: explicit neutral #cbd5e1 border replaces theme-dependent dark Light border; Text Gradient uses a readable slate ramp in light theme and pale ramp in dark theme. Card Text Gradient no longer forces descendant Button gradient/transparent fill; child Button effects remain independent. UI/umbrella builds, 77 unit tests, three browser regressions including Light neutral checks and 1,536 child Button combinations passed. Lab cache key refreshed; await review.

2026-10-12 — Light Glass Card brightened to translucent pale slate in both themes with #1f2937 foreground, neutral veil and no dark brightness filter. Supporting structured text inherits readable foreground; buttons retain independent styles. Covers Glass and Outline+Glass. UI/umbrella builds, 77 unit tests, four targeted browser regressions and diff check passed. Cache refreshed; await visual review.

2026-10-12 — User rejected opaque Light Glass appearance. Reduced pale backing alpha from .88 to .28 and neutral veil alpha from .50 to .08 with .45 veil opacity; retained glass highlights and adjusted dark-theme foreground to pale text. UI/umbrella builds, 77 unit tests and two browser regressions passed; await visual review.

2026-10-12 — User accepted and closed card sections and requested commit. Includes explicit section composition/dividers and Card child Button independence plus neutral Light Outline/Text Gradient/Glass refinements. Verification: UI/umbrella builds, 77 unit tests and targeted browser regressions passed. Next Upload/BoxUpload; local fixture uses form mode for file selection without network requests.

2026-10-12 — Upload/BoxUpload aligned with parent Card surface/effect classes and neutral rules. Added Dense, common sizing/responsive props, state/status/color precedence, readable inherited copy/file details and foreground-based internal boundaries; title-only Text Gradient and independent Button palettes retained. Browse now reflects disabled/readonly; render/state effects disposed with active request abort. Lab loads Material Symbols and includes 104 palette/effect combinations plus six functional examples. Visual dark-theme inspection found narrow-panel action placement issue, corrected with container/mobile overrides. UI/umbrella builds, 77 unit tests and two browser regressions passed (eight colors, 13 effects, both themes, desktop/mobile, internal overflow, file add/remove/clear, disabled guard, reactive tone and effect disposal). Public uploads guide added. Diff check passed; await visual review.

2026-10-12 — Upload Clear contrast: internal clear action now inherits surface foreground with matching translucent fill/border instead of Secondary Outline theme text; disabled alpha .65 preserves readable label while indicating no-file state. Lab cache refreshed. UI/umbrella builds, 77 unit tests and both Upload browser regressions passed; palette test checks Clear text/opacity across eight colors, 13 effects, both themes and widths.

2026-10-12 — Dark Glass Upload used theme-neutral pale Card glass in light theme. Shared Card/Upload Dark Glass now uses translucent navy backing, restrained dark veil and pale foreground in both themes (including Outline+Glass); supporting structured Card text inherits foreground. UI/umbrella builds, 77 unit tests, four targeted browser regressions and diff check passed. Upload lab cache refreshed; await visual review.

2026-10-12 — Dark Outline Card/Upload now uses defined slate foreground/edge in light theme and readable pale foreground/slate edge in dark theme; transparent surface retained, Glass/Text Gradient combinations keep their own rules. UI/umbrella builds, 77 unit tests and three targeted browser checks passed. Lab cache refreshed; await review.

2026-10-12 — User authorized Upload closure after bug audit. Final code review found async file validation could repopulate selection after clear/dispose/disable; invalidated pending selections and added browser regression for all three transitions. UI/umbrella builds, 77 unit tests and three targeted browser tests passed. Upload/BoxUpload accepted and closed; no commit requested. Next standalone Calendar, separate from previously reviewed Date popover.

2026-10-12 — Started standalone Calendar review at user request. Shared buildDateControl inspected; local calendar.html prepared with six functional examples and 80 palette/effect combinations. Initial audit notes Calendar root uses static classes and returns before applying common sizing props; verify before implementation. Upload changes remain uncommitted.

2026-10-12 — User requested complete Calendar color/effect implementation, preserving shared Date calendar. Added shared panel factory for standalone Calendar and Date overlay with reactive Card surface classes, common sizing/responsive props and Dense. Calendar controls inherit foreground, boundaries/selected/range/today/focus derive from surface text, native options retain theme contrast; Text Gradient clips month titles only. Responsive month tracks avoid mobile overflow. UI/umbrella builds, 77 unit tests and shared Calendar/Date browser palette/selection/popup regression passed across eight colors, eight effects, both themes and mobile/desktop. Public Date contract updated. Await visual review; no commit requested.

2026-10-12 — User authorized Calendar closure after bug audit. Functional browser regression covers single/range reversed endpoints/multiple toggle, weekday/min/max limits, disabled/readonly actions, external rod update and lifecycle. Found and fixed unguarded Reset/Today/Now/Apply actions and unregistered model/render disposers in shared Date/Calendar implementation. UI/umbrella builds, 77 unit tests, both Calendar browser regressions and diff check passed. Calendar accepted and closed; no commit requested. Next InputRaw standalone audit.

2026-10-12 — User declared UI/CSS revision complete, excluded native InputRaw from palette work and requested commit before general bug research. Committing approved Upload/Calendar work and shared Card neutral refinements with tests/contracts/generated mirrors. Next full UI browser regression and focused functional/lifecycle audit.

2026-10-12 — Commit 75b73e8 created. First general bug research pass complete: full browser suite 61/62 passed; isolated Table Glass surface regression reproduced. Dynamic audit confirmed leaked model watchers after mount replacement in Checkbox/Radio/Toggle/Slider/Rating/Time and Time readonly Delete clears value. Findings saved in ui-bug-audit.md; no source corrections made during research.

2026-10-12 — Authorized UI audit fixes complete: Time readonly/disabled protection; choice/Slider/Rating/Time model and owned effect cleanup; Table-specific surfaces preserved against Card neutral effects. Also fixed undefined serializeValue in Rating signal watcher discovered by new regressions. UI/umbrella builds, 77 unit tests, all 64 browser tests and diff check passed. Fixes remain uncommitted.

2026-10-12 — User accepted and closed the functional bug audit and requested commit. All confirmed findings corrected and verified with 77 unit and 64 browser tests; no remaining work in this audit.

## Automatic application discovery — 2026-10-12

Implemented opt-in `ui.auto: ['src', 'index.html']` (or `true` for the application root) in standalone CLI and Vite. AST scanning of JS/JSX/TS/TSX and inline HTML scripts discovers static public component references and dialog/notify/loading/useForm services, merges explicit dynamic inclusions, and uses the existing shared dependency resolver and CSS selection. Reports include scanned files and discovered names. Hidden/generated standard directories and symlinks are excluded; narrow explicit source paths are recommended. Arbitrary namespace aliases, destructuring and dynamic component names require explicit inclusion.

Vite invalidates selection on application source changes, additions and removals; tests verify recomputation and listener cleanup. Packaged tooling now includes the scanner; installed-tarball CLI/Vite verification uses automatic discovery. Application configuration contract and declarations updated. UI graphics and component implementations unchanged. Physical JS/CSS splitting remains the next milestone.

Verification: umbrella package build passed; 80 unit/package tests passed; targeted Chrome automatic-runtime rendering/reactivity/CSS test passed outside the sandbox (Chrome aborted with SIGABRT inside it). No publication or commit performed.

## Physical component extraction pilot — 2026-10-12

Extracted Button/Btn, FormField, InputRaw, Input, Textarea, Search and Select into individual `packages/ui/src/components` JavaScript files. Shared reactive functions, field accessibility/constraint wiring and owned subscription cleanup moved into `helpers`. Layout boxes and the remaining Upload/layout implementations stay grouped for subsequent migrations. The IIFE scope and original statement order are preserved through `modules.json.buildOrder`.

Extracted 23 CSS sections into `css/components/<component>/`. The source entry imports each section at its original position; `readCSSSource` expands only local source imports and rejects missing files, unsupported forms and cycles. Expanded component CSS matches the original byte for byte; rebuilt full JavaScript and CSS compatibility mirrors have no content diff. Shared effect/composition selectors remain in the source entry pending their own migration.

`modules.json.components` registers the seven extracted components, aliases, CSS sections and extracted helper files. Manifest validation checks registered assets, initialization membership and duplicate aliases. Runtime dependencies remain derived by the existing shared AST resolver, rather than a second manually maintained dependency graph. Package copying preserves nested JS/CSS source paths and removes stale source copies; the installed-tarball test verifies extracted files and automatic CLI/Vite selection. The CSS watcher now watches nested directories. Source and framework architecture/reference documents updated.

Verification: UI and umbrella builds passed; 82 unit/package tests passed; knowledge map valid; tracked and newly extracted source whitespace checks passed. Chrome suite: 63/64 passed on initial run, including both-theme/full-selective field styling, binding, accessibility and disposal checks. ContextMenu viewport test missed its RAF measurement marker under the concurrent suite and passed in isolation; no ContextMenu implementation change made. Generated full JS/CSS mirrors remain identical to the accepted baseline. No commit or publication performed. Pilot closed; remaining component families and shared CSS ownership are follow-up migrations.

## Layout-family extraction — 2026-10-12

Closed the next family migration: Row, Col, Spacer, Container, Card, Layout, Footer, Toolbar, Grid and GridCol each own a JavaScript file. Responsive setup, model binding, layout dispositions, children/size normalization and Grid child detection now live in shared helper files, preserving the original initialization sequence. The remaining Upload/BoxUpload implementation was isolated in its own JS file and is explicitly marked `js-extracted-css-pending`; its CSS migration remains part of the forms follow-up. Removed the obsolete primitives/layout grouping files from the build.

Extracted 15 additional CSS sections for Spacer, Container, Card, Layout, Footer, Toolbar, Grid and GridCol, including layout breakpoints, Card sections, late light/dark effects and footer/toolbar treatments. Imports remain at the original cascade positions. Row/Col retain their canonical generated responsive utility styles, with intentionally empty component CSS lists. Shared composition selectors remain shared. The registry and packaged-source test now cover layout JS/helpers/CSS; the installed CLI/Vite consumer uses Grid/GridCol/Card/Button to verify automatic selection from the extracted sources.

Verification: concatenated JavaScript source matches the pre-migration source after line-ending normalization. Full generated JavaScript and CSS SHA-256 hashes match the accepted pre-migration build. For all ten layout components individually, minified selective JavaScript, selected CSS and dependency inventories also match their captured pre-migration hashes. UI/umbrella builds, 82 unit/package tests, 18 targeted Chrome layout/responsive/Card/composition tests (zero skipped), knowledge map validation and tracked/new-source whitespace checks passed. Framework/source documentation updated. No commit or publication performed. Layout family closed; display/content and advanced forms remain next.

## All-component extraction complete — 2026-10-13

Completed the remaining display/content, list/banner, advanced form/date/time, navigation, feedback, shell, form/card sections, dialog/tab panel, Table and menu/overlay families. All 66 public UI names are registered against 63 individual implementation files (Button/Btn and Upload/BoxUpload/boxUpload share implementations). Shared component support is in helpers; Notify, Dialog, Loading and Form/useForm services are split into dedicated service files. The original bootstrap/foundation and closing IIFE envelope remain shared. All numbered component-family source groups are removed from buildOrder.

All component stylesheet rules are physically extracted: 198 ordered sections in total: 143 component sections and 55 shared sections. The source ui-components.css is now an import-only cascade entry. Upload CSS migration is complete. Datepicker/Calendar share Date sections, RouteTab includes its own and Tabs sections, card section helpers share Card, and ContextMenu uses Menu styles. Row/Col retain generated responsive utilities; Form has shared/native styling and Loading retains its inline styles. Common/native/effect and multi-component composition rules stay shared. One pre-existing trailing space in Upload padding was removed; CSS declarations, selectors, comments and order remain identical.

The complete registry owns component/alias/service assets, shared CSS, selector ownership and conservative AST-derived helper/dependency inventories. Selective CSS reads ownership from that manifest. Runtime dependency resolution still uses the same AST for CLI and Vite; recorded dependencies are transitive conservative snapshots, refreshed/checked with npm run ui:registry:refresh and ui:registry:check. Valid runtime reference cycles remain supported by visited-set traversal. Source copying and validation share uiSourceFiles, so installed packages contain every registered component/helper/service/CSS source and the CSS entry. The coverage regression checks every public assignment against its registered implementation and rejects orphan source assets; packaging checks all registered files and automatic selection across layout, advanced form, Calendar, TabPanel, feedback and overlays.

Verification: captured pre-migration hashes for every one of the 66 component selections, all four services, and the full runtime. All JavaScript and dependency inventories match. CSS rules/declarations/comments/cascade match for the full build and all 70 selections (the inherited whitespace cleanup is the only textual difference). UI/umbrella/site builds passed; 83 unit/package tests and all 64 Chrome tests passed with zero skipped; source registry, knowledge map and tracked/new-source whitespace checks passed. Updated source, CSS, architecture, reference and maintenance documentation. All-component extraction objective closed. No commit, version change, publication, push or deployment performed.

## Authorized npm preview publication — 2026-10-13

User authorized publication to test the completed split. Prepared `jsswift@2.2.0-split.0` and `@jsswift/ui@2.0.3-split.0` with npm tag `next`; core and knowledge MCP unchanged. Version availability and npm authentication checked. Runtime/umbrella builds, registry/knowledge validation, 83 unit/package tests and tarball dry-run inspection passed. Published the exact packed tarballs: npm accepted both commands; registry processing is pending confirmation. Updated the configured-runtime guide to identify the preview supporting automatic discovery. No stable tag promotion, git commit/push or deployment requested.

## Published umbrella preview verified — 2026-10-13

`jsswift@2.2.0-split.0` is visible and installable from npm. The registry integrity matches the exact reviewed tarball (`sha512-meG0eJLTcTw7OQFrDfLGjduOlAJfJlAKfokn4MI3drh9fT8iBTM4xhzDQF49lIfSPnrXeJ9t7b/5siaPe+JlJQ==`). Registry tags confirm `latest:2.1.1` and `next:2.2.0-split.0`. Installed the published package into a fresh temporary consumer and verified CLI/Vite builds, automatic static discovery, explicit dynamic inclusion, and Button-only exclusion/CSS pruning. Chrome smoke test of that installed runtime passed rendering, styling, rod propagation and clicks; the fixture waits for asynchronous reactive updates before reading values.

npm also accepted `@jsswift/ui@2.0.3-split.0`, but its registry version/tag remains in processing at the last check; latest remains 2.0.2. Do not claim UI registry install verification until it appears. This does not block application testing through the verified umbrella package, which bundles core/UI and the build tooling. No git commit/push or site deployment performed.

## Automatic defaults, Material assets and benchmark improvements — 2026-10-13

User requested automatic component discovery by default, manual selection without redundant auto:false when components/services are specified, clearer Material icon examples and automatic integration of icon assets. Implemented shared CLI/Vite normalization: omitted selection options imply auto:true; either explicit list (including empty lists) disables implicit discovery; explicit auto:true/paths merges inclusions; all:true remains full UI, and explicit all:false/auto:false without lists retains core-only mode. Current CLI/Vite output directories are excluded from source discovery, including custom Vite output directories, to prevent generated code from expanding selection or causing output-triggered restarts.

Material Symbols font-face CSS is now automatically included when Icon is present directly or in the conservative dependency closure, or in a full UI build. Top-level icons:false disables automatic font assets for external-resource-free/SVG-only applications; explicit font extras still apply. The CSS declaration is bundled, while the existing remote Google font is downloaded by the browser on glyph demand. No font binary is embedded or fetched during the build. Added native icon/button examples and offline guidance to AI.md, corrected Icon name documentation, and documented the difference between the published preview and these local default changes.

Completed the verified missing selector ownership entries for TabPanel, EmptyState and Stat. With identical UI CSS input and the benchmark's recorded component/service selection, pruning changes 191576 -> 178366 raw component CSS bytes and gzip 27550 -> 25924 (13210 raw / 1626 gzip bytes saved). This comparison excludes application CSS, base/responsive utilities and automatic font assets; it is not a rerun of generation or a measured token/time improvement. Benchmark files were not modified.

AI.md now instructs routine inspection of components/services/resolved extras rather than printing the long reasons map. Removed redundant route/configuration prose while adding icon/default guidance: 11315 -> 11062 characters versus the published benchmark guide. No token-per-command or generation-performance claim is made. Regenerated Knowledge Map, portable Skill and bundled application docs.

Verification: UI/umbrella/site builds passed; 86 unit/package tests, all 64 Chrome tests (zero skipped), knowledge/MCP tests (4+2), source registry and diff checks passed. The installed-tarball CLI/Vite test now uses implicit discovery and automatic Material assets; targeted tests cover precedence, explicit merge, offline opt-out, explicit extras, custom output exclusion and pruning. Chrome checks font-face registration and computed Material family for a Button icon; external font service availability is not guaranteed by these assertions. After final documentation shortening, all 17 focused configuration/knowledge tests passed. No version change, commit, npm publication, tag change or deployment performed for this task. Objective closed.

## Second test preview published and verified — 2026-10-13

User explicitly requested another test publication. Published the inspected tarballs jsswift@2.2.0-split.1 and @jsswift/ui@2.0.3-split.1 with tag next. Both versions are visible and installable from npm; registry integrity matches the tarballs. Tags verified: jsswift latest=2.1.1, next=2.2.0-split.1; @jsswift/ui latest=2.0.2, next=2.0.3-split.1. Core and MCP versions unchanged.

Includes automatic discovery defaults, manual-list precedence, automatic Material font CSS, offline opt-out, CSS ownership improvements and updated application guidance. Runtime builds, 86 unit/package tests, knowledge/MCP tests (4+2), registry and whitespace checks passed. Existing implementation browser verification remains 64/64; this publication changes versions and release documentation. Initial sandbox test attempts failed on npm cache access, then an empty-cache offline install; rerunning with the existing cache outside sandbox passed.

Installed both published packages into a clean temporary consumer. Main-package CLI and Vite builds passed with implicit discovery, Button/Icon inclusion, Table exclusion, automatic Google font declaration, explicit-list discovery precedence and icons:false omission of remote font CSS. Verification checks declarations rather than external font-server availability. Tarballs and inspection metadata: /tmp/jss-split-preview1-release; consumer verification: /tmp/jss-preview1-consumer-c25a27oh/verification.log. No Git commit/push or website deployment performed.

## Benchmark priorities: dev watcher, validation and CSS — 2026-10-13

Implemented the explicitly requested priorities following the split.1 pilot. Fixed the dev runtime by keeping discovery directory roots in server.watcher rather than addWatchFile load dependencies. Installed-tarball regression reproduced HTTP500 before the correction and passed afterward, including real HTTP runtime/CSS requests and watcher-driven changes/additions/removals. External roots initially empty are covered. The same package regression passed with the benchmark's locked Vite 8.3.3 through JSS_TEST_VITE_PATH.

Added a real Vite/Chrome CRUD regression with native Tab/Shift+Tab/Escape, initial and replacement-trigger focus, four required-control error associations, write failure, corrupt/invalid/unavailable storage and reload persistence. Ten repeated editor openings explicitly dispose eighty temporary rods. These ownership assertions are not a heap-memory audit. Updated the traditional CRUD regression to assert the accessible storage error inside the dialog. Aligned getting-started/CRUD with automatic discovery, made the table region keyboard-focusable and named, retained its white header styling, and verified the inline SVG offline icon example in Chrome.

Extended CSS ownership for Layout, RouteTab, choice controls, check-style controls and Select/Search singularity menus. Unknown/functional selectors remain conservative. Added cssAnalysis to CLI/Vite selective reports with input/output bytes and retained owned/shared-or-unknown/complex/keyframe rule groups; full/core-only reports null. On identical CSS input and the pilot selection: 178366 -> 163458 raw bytes, gzip 25924 -> 23883 (14908 raw / 2041 gzip saved). This is component CSS only, not a new generation or a measured token/time improvement.

Updated the external laboratory's future jsswift-current validator, common inspector and documentation. HTTP/request/console/page exceptions are recorded; loading failure gates downstream checks as blocked. Ancillary failures remain diagnostic rather than failed application modules. Added separate solid-color text contrast measurement with explicit complex-paint/disabled exclusions. Three validator regressions pass, including an HTTP500 with zero pageerror events and end-to-end blocked results. Historical scripts, generated code, run artifacts and generation metrics unchanged.

A temporary unchanged copy of the pilot app with the corrected local plugin passes 19/19 current checks. Desktop/mobile screenshots inspected: no observed layout regression, no page overflow. The limited separate contrast report identifies 9 below-threshold leaf texts from application styling, 46 passing, 10 complex/unmeasured and 1 disabled exclusion; this is not a complete accessibility audit and does not change historical results.

Verification: runtime/umbrella/site builds; 87 unit/package tests; 65 Chrome tests, zero skipped; final offline SVG/CRUD focused regression; knowledge/MCP 4+2; registry and whitespace checks. First browser run exposed stale assertions for the updated CRUD alert and white-header example; corrected example styling and alert selector, then all 65 passed. No version bump, npm publication, Git commit/push or deployment.

## Third test preview published and verified — 2026-10-13

User explicitly authorized another npm test publication. Published the exact inspected tarballs jsswift@2.2.0-split.2 and @jsswift/ui@2.0.3-split.2 with tag next. Direct public registry metadata and installed consumer lockfile integrity match the packed artifacts. Tags: jsswift latest=2.1.1, next=2.2.0-split.2; UI latest=2.0.2, next=2.0.3-split.2. Core and MCP unchanged. Ordinary metadata requests temporarily returned stale responses; an uncached public metadata request confirmed publication, followed by successful normal npm install of both exact versions.

Includes dev directory-watcher correction, expanded CSS ownership and cssAnalysis reports, aligned automatic setup/CRUD docs and offline SVG guidance. Runtime build, 87 unit/package tests, knowledge/MCP 4+2, registry and whitespace checks pass. Implementation Chrome suite previously passed 65/65; release changes versions and documentation only.

Installed both packages from npm into a fresh temporary consumer. CLI and production Vite verify default discovery, manual precedence, automatic icon CSS, offline override and matching CSS analysis. Real installed-package Vite 8.3.3 dev server verifies HTTP runtime/CSS loading and automatic source changes/additions/removals, including external roots initially empty. No HTTP500. Reviewed tarballs: /tmp/jss-split-preview2-release; consumer verification: /tmp/jss-preview2-consumer-ngki_sfx/verification.log. No Git commit/push or website deployment.

## Priorities after split.2: offline SVG, compact reports and traceable validation — 2026-10-13

Implemented all requested priorities from the latest pilot analysis without publishing or modifying historical runs. Added tree-shakable named offline SVG factories at jsswift/icons and @jsswift/ui/icons with declarations: add/edit/search/save/close/check/inventory/grid/empty/euro/chevrons. Factories create fresh decorative native SVG nodes with currentColor, aria-hidden and focusable=false; no runtime catalog, font, sprite or network assets. The package consumer verifies only the imported drawing enters the Vite bundle. Browser tests verify SVG namespace, sizing and distinct nodes. Application string Material icons retain their existing meaning; offline configured applications use icons:false.

Reports now default to compact, retaining selection/assets/sizes/CSS analysis and discovery counts. report:full restores reasons and absolute discovery files/roots. The same formatted report is returned/written; declarations and guides document the shape change. Reformatting the recorded pilot report reduces 8002 -> 1074 bytes, before any new generation. Added contrast-safe secondary text guidance, staged reading guidance and icon discovery keywords to the application docs/map/portable Skill.

CSS pruning now recognizes only mandatory classes outside all selector functions/attributes, preserving alternatives inside :is/:where/:not/:has and escaped selectors conservatively. Tests include mixed alternatives and quoted attribute text. Same CSS input and pilot selection: 163458 -> 134563 raw bytes, gzip 23883 -> 20270; 28895 raw / 3613 gzip saved. Full CSS source unchanged. Both full/selective Chrome surfaces and temporary pilot screenshots inspected without observed layout regressions.

Table's inner overflow region is keyboard-focusable and named; new scrollLabel prop customizes its name. Actual horizontal arrow-key scrolling is verified. Public Table contract updated.

External laboratory tools now record unique selectors, computed foreground/fill, composed background layers, font metrics and exclusion reasons. Separate desktop/mobile/dialog-with-validation reports; modal results exclude underlying content, unsupported complex paint stays unmeasured. Inspector resets the page before initial screenshots and saves DOM markup for locating selectors. Field error checks require four controls and correct field-specific descriptions; new cases cover invalid stored schema, blocked reads and real keyboard scrolling. The unchanged temporary copy of the latest pilot passes 22/22; this is not a new measured generation. Its original app contrast failures remain, and default dialog complex paint is reported unmeasured rather than certified.

Added opt-in --staged-knowledge runner mode: provides AI.md alone in the initial prompt, with a precise separate CRUD read path. Mode and guide hash recorded; initial-knowledge default preserved. This guarantees guide delivery, not later model compliance, and is not directly comparable with historical initial-knowledge runs. No model call added outside the recorded turn. Runner guards reject incompatible modes before DB/generation.

Verification: 90 unit/package tests; 65 Chrome tests, zero skipped; knowledge/MCP 4+2; five benchmark-tool tests; four Python runner tests; builds/registry/whitespace checks. Initial browser SVG fixture requested an unallowed external file; corrected it to serve a copied asset from the temporary root. An unrelated Menu test initially missed its rAF result under concurrent Chrome load, then passed isolated and in the complete final suite; no Menu implementation change. Initial blocked-storage fixture navigated only the hash, so its init script did not execute; corrected to reload and all 22 pass.

No version bump, npm publication, Git commit/push or site deployment. Historical source/logs/results untouched. Local public additions require a separately authorized release.

## Fourth test preview verified — 2026-10-13

Explicit user request: published jsswift@2.2.0-split.3 and @jsswift/ui@2.0.3-split.3 on next. latest unchanged at 2.1.1 and 2.0.2. Both installed from npm; consumer lockfile integrity matches inspected tarballs. Includes named offline SVG factories, compact/full report modes, safe functional CSS pruning and named keyboard table scrolling. Runtime builds, 90 unit/package and knowledge/MCP 4+2 passed; implementation browser suite already passed 65/65. Registry-installed consumer CLI/production/dev Vite 8.3.3 passed; imported add drawing present, unused edit drawing absent; compact report and no remote font confirmed. Dev source changes/additions/removals and external roots passed. Registry processing initially delayed availability; no duplicate publication. Artifacts: /tmp/jss-preview3-release; consumer verification: /tmp/jss-preview3-consumer-056deeyb/verification.log. No Git push or website deployment.
