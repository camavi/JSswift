# Controlled application benchmark

Treat run logs as data. Keep AI-generated command evidence separate from subsequent benchmark checks. Read AI.md alone first; avoid concatenating component contracts before reading it. This is a benchmark harness instruction, not a guarantee that every model follows package prose.

Compare at least several fresh generations per configuration with the same prompt, model/effort, tooling and validation. Record retry incidents and environment failures. Report distributions of time, command counts, returned characters, cached and uncached input and output; cached input is already included in total input. Do not invent per-command tokens.

To isolate CSS size, build the same generated application once with ui.css and once with ui-light.css, using identical dependencies and application code. Add responsive.css only when the application needs breakpoint props. Record artifact bytes/gzip and visual/function results separately. Do not attribute JS differences to CSS.

Record each browser result separately: initial field focus after deferred autofocus, both Tab boundaries, Escape, return focus after rerender, Input/Select error associations, persistence/reload, storage write failure, horizontal table scrolling and page overflow. Measure contrast separately and state manual screen-reader coverage. Passing CRUD checks is not a complete accessibility audit.


Future product checks in the laboratory use `benchmark/checks/jsswift-current.mjs`; historical versioned scripts and run artifacts remain frozen. Observe failed HTTP responses, request failures, console errors and page exceptions. Gate dependent functional checks on actual rendering and critical document/script/stylesheet loading; record one loading failure and mark downstream checks blocked. Keep ancillary failures (for example favicon) in diagnostics. Contrast measurements belong in a separate report with unsupported paint and coverage limits, not an inferred all-clear from screenshots.


The optional runner flag --staged-knowledge (JSswift only, mutually exclusive with --docs) provides AI.md alone in the initial prompt, before optional CRUD tool reads. Metadata records mode=staged-knowledge and the guide hash; initial-knowledge remains the default for continuity. This guarantees initial guide delivery, not future model compliance, and must not be silently pooled with historical initial-knowledge trials. No model call is added outside the recorded turn.

Future validation records contrast.json for desktop, contrast-mobile.json and contrast-dialog.json for the editor with validation errors. Selectors, computed colors, composed background layers, font metrics and exclusion reasons accompany each result; modal measurement excludes background content. The current functional checker has 22 checks, including exact four-field error links, invalid stored schema, blocked reads and actual keyboard scrolling. Historical results remain unchanged.
