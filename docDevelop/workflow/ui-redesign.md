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
