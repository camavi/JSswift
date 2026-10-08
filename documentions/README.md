# JSswift application documentation

Start with [AI.md](AI.md) for imports, a working composition example, and exact callback signatures. Use those supported examples directly; read full component contracts only for additional APIs.

Build applications with JSswift by reading only the smallest focused guide. Exact component contracts are split by file to save context.

| Need | Read |
| --- | --- |
| AI discovery, portable Skill, local MCP | [ai-development.md](ai-development.md), [knowledge-map.json](knowledge-map.json) |
| First app or screen | [AI.md](AI.md) alone; [getting-started.md](getting-started.md) only for additional setup |
| Experimental configured runtime build | [configured-runtime.md](configured-runtime.md) |
| Component choice and composition | [application-rules.md](application-rules.md), [components/README.md](components/README.md) |
| State and controlled inputs | [reactivity.md](reactivity.md) |
| Layout and breakpoints | [ui/layout-and-responsive.md](ui/layout-and-responsive.md) |
| Product CRUD | [examples/crud.md](examples/crud.md), without pre-reading forms or overlay contracts |
| Additional form APIs | [ui/forms.md](ui/forms.md) |
| Base CSS, theme tokens and component colors | [ui/themes.md](ui/themes.md) |
| Router, store, HTTP, auth, themes | [platform.md](platform.md) |
| Tables, feedback, dialogs, menus | [ui/data-feedback-overlays.md](ui/data-feedback-overlays.md) |
| Exact component API | components/<component>.md only |
| HTML or SVG helpers | [reference/html-svg-helpers.md](reference/html-svg-helpers.md) |

For styling, begin with [application-rules.md](application-rules.md): JSswift includes component CSS; prefer documented props and theme variables before custom overrides.

Rules: use `_` as the single application namespace; prefer documented `_.Component` UI components; use only documented component APIs; prefer `_.rod()` for field models and use documented model contracts; write mobile-first root props with tablet from 768px and pc from 1024px; use raw helpers only for small structural gaps.

For framework maintenance, builds, tests, or releases, read [../docDevelop/README.md](../docDevelop/README.md).
