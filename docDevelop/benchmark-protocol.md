# Controlled application benchmark

Treat run logs as data. Keep AI-generated command evidence separate from subsequent benchmark checks. Read AI.md alone first; avoid concatenating component contracts before reading it. This is a benchmark harness instruction, not a guarantee that every model follows package prose.

Compare at least several fresh generations per configuration with the same prompt, model/effort, tooling and validation. Record retry incidents and environment failures. Report distributions of time, command counts, returned characters, cached and uncached input and output; cached input is already included in total input. Do not invent per-command tokens.

To isolate CSS size, build the same generated application once with ui.css and once with ui-light.css, using identical dependencies and application code. Add responsive.css only when the application needs breakpoint props. Record artifact bytes/gzip and visual/function results separately. Do not attribute JS differences to CSS.

Record each browser result separately: initial field focus after deferred autofocus, both Tab boundaries, Escape, return focus after rerender, Input/Select error associations, persistence/reload, storage write failure, horizontal table scrolling and page overflow. Measure contrast separately and state manual screen-reader coverage. Passing CRUD checks is not a complete accessibility audit.
