# JSswift application documentation

Build applications with JSswift by reading only the smallest focused guide. Exact component contracts are split by file to save context.

| Need | Read |
| --- | --- |
| First app or screen | [getting-started.md](getting-started.md) |
| Component choice and composition | [application-rules.md](application-rules.md), [components/README.md](components/README.md) |
| State and controlled inputs | [reactivity.md](reactivity.md) |
| Layout and breakpoints | [ui/layout-and-responsive.md](ui/layout-and-responsive.md) |
| Forms | [ui/forms.md](ui/forms.md) |
| Router, store, HTTP, auth, themes | [platform.md](platform.md) |
| Tables, feedback, dialogs, menus | [ui/data-feedback-overlays.md](ui/data-feedback-overlays.md) |
| Exact component API | components/<component>.md only |
| HTML or SVG helpers | [reference/html-svg-helpers.md](reference/html-svg-helpers.md) |

Rules: prefer JSswift.ui.*; use only documented component APIs; use JSswift.reactive.signal and documented model contracts; write mobile-first root props with tablet from 768px and pc from 1024px; use raw helpers only for small structural gaps.

For framework maintenance, builds, tests, or releases, read [../docDevelop/README.md](../docDevelop/README.md).
