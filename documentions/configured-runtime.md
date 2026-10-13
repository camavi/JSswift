# Configured application runtime (experimental)

`jss.config.js` selects UI components, services and optional assets at build time. The complete runtime remains compatible with existing imports and script bundles. The package build includes the tooling under jsswift/vite and jsswift/build, plus the jss-build command. These additions are included starting with jsswift 2.1.0; older installed releases do not expose them. Build tooling requires Node.js 20.19.x or >=22.12.0.

## Configuration

```js
export default {
  ui: { responsive: true },
};
```

For a selective application:

```js
export default {
  ui: {
    components: ['Button', 'Input', 'Table'],
    services: ['Dialog', 'Notify'],
    responsive: false,
  },
  extras: ['material-symbols-outlined'],
};
```

`ui.auto` defaults to true when no `all`, `components` or `services` option is supplied. An explicit components/services list, including an empty list, switches discovery off unless `auto:true` or source paths is also specified. `all:true` selects the full UI and cannot combine with enabled auto or nonempty selection lists. Explicit `all:false` without lists retains the core-only mode; `auto:false` also selects core only. Unknown names/options fail the build. These defaults are available from 2.2.0-split.1; the earlier 2.2.0-split.0 preview requires opt-in discovery.

Component names match the public API, including Button/Btn and cardHeader/cardBody/cardFooter. Supported services are Dialog (component plus alert/confirm/prompt shortcuts), Notify (component plus toast service), Loading (loading overlay), and Form (useForm). Dependencies are resolved from source statements; Button includes Icon, Tooltip and Spinner, while Table also includes Card. Referenced optional branches are included conservatively. Applications using dynamic component lookup must explicitly request every possible component.

`ui.responsive` defaults to true. False retains base layout utilities and component mobile CSS, but excludes breakpoint utilities. In selective mode, component-owned CSS selectors are pruned; shared tokens, native rules, utilities, animations, unknown selectors and complex functional selectors are retained conservatively. The core is always included completely.

Supported extras are `material-symbols-outlined`, `nunito-font`, and `tabler`; the default is an empty array. Material Symbols uses a remote Google font. Nunito font files and the Tabler sprite are local assets. With top-level `icons:true` (the default), Material font CSS is automatically added when Icon is selected directly or as a dependency, or for a full UI build. The browser downloads the font only when its glyphs are used. `icons:false` disables automatic inclusion for SVG-only/offline apps; explicit extras are still honored. Other extra assets are included only when configured; separate application CSS/imports can still load additional assets independently.

## Automatic component discovery

```js
export default {
  ui: { responsive: false },
  extras: [],
};
```

The builder finds static references such as `_.Button(...)`, `_['Input'](...)`, and `_.Button.something` in JavaScript, JSX, TypeScript, TSX and inline HTML scripts. It includes their JavaScript, CSS and dependencies. Comments and string examples do not select components. Services `_.dialog`, `_.notify`, `_.loading` and `_.useForm` are detected too. The report records scanned files and discovered components/services.

`auto:true` is implicit; `auto:['src','index.html']` narrows scanning. The CLI output directory and Vite build output directory are excluded from scanning even when customized.

Paths are relative to the config directory for the CLI, to the Vite project root for the plugin, and to the fourth `projectRoot` argument (default current directory) for programmatic builds. Paths may be files or directories; all supported source files within them are scanned, including files not imported by the entrypoint. Prefer narrow application paths. `auto:true` scans the project root, excluding hidden directories, node_modules, dist, dist-runtime and coverage; use explicit paths if your generated output has another name. Symlinks are skipped. Missing paths and invalid source syntax fail the build.

Combine `auto` with `components`/`services` for dynamic names such as `_[name]`, destructured components, or aliases of `_`. These usages cannot be inferred automatically. `all:true` and enabled `auto` cannot be combined. Existing explicit configurations keep their behavior. Vite restarts on source changes, additions and removals so both JavaScript and CSS selections update. Discovery is available opt-in in the published `2.2.0-split.0` preview; default discovery and automatic font inclusion are available from 2.2.0-split.1. Stable 2.1.1 does not support discovery.

## Vite

Install jsswift and Vite in your application, then register the plugin:

```js
import { defineConfig } from 'vite';
import { jssRuntime } from 'jsswift/vite';

export default defineConfig({ plugins: [jssRuntime()] });
```

Import the configured runtime from your application module:

```js
import 'jss:runtime';
_.mount('#app', _.Button({ label: 'Save' }));
```

The plugin includes JavaScript, CSS and extras together, emits jss-build-report.json in production, and restarts the development server when configuration changes. An alternative config path can be passed as `jssRuntime({config:'./other.config.js'})`. The repository ui.html demo now uses this integration; it requires Vite rather than opening the source HTML directly as a local file. The demo calls many components, so retain all:true unless its example code is reduced to the selected components.

## Standalone output

With jsswift installed, run the packaged CLI from your project:

```sh
npx jss-build jss.config.js dist-runtime
```

You can also put `"build:runtime": "jss-build"` in your application package.json scripts. `jss-build --help` prints the arguments. For programmatic builds, import buildConfiguredRuntime or validateConfig from `jsswift/build`. The plugin and CLI use the package's own runtime, CSS, source modules and assets; no framework checkout is needed. Vite is an optional peer dependency and is not required for standalone builds.

In the framework checkout, first run `npm run build:runtime`, then:


```sh
npm run build:configured -- jss.config.js dist-runtime
```

This generates runtime.js, css/runtime.css, selected extra assets and build-report.json. The report lists selected components/services, resolved extras, dependency reasons, inputs, removed CSS selectors and JavaScript/CSS byte counts. For routine verification print only components, services and extras; inspect reasons only for unexpected dependencies. The output directory must be empty to avoid stale optional assets; use a fresh destination for subsequent standalone builds. Vite builds manage their own output normally.

```html
<link rel="stylesheet" href="./dist-runtime/css/runtime.css">
<script type="module">
  import './dist-runtime/runtime.js';
  _.mount('#app', _.Button({label:'Save'}));
</script>
```

Continue using the single public `_` application namespace.


From 2.2.0-split.2, development discovery watches directories through Vite's filesystem watcher, separately from virtual-module dependencies. It updates selection on source changes, additions and removals, including configured external roots. Check a real dev-page load as well as a production build; a listening server or an empty `pageerror` list does not establish successful module loading.

Selective reports include `cssAnalysis`: input/output component-CSS bytes, removed selectors, retained rule counts and serialized rule bytes grouped as `owned`, `sharedOrUnknown`, `complex` and `keyframes`. These groups describe the pruning algorithm, not browser coverage or unused CSS. Rule bytes exclude at-rule wrappers/comments and do not sum to the complete stylesheet size. Full/core-only builds report null. Unknown and functional selectors remain conservative. Inspect this field only when investigating CSS weight.

From 2.2.0-split.3: `report:'compact'` is the default; `report:'full'` restores dependency reasons and absolute discovery files/roots. Compact discovery contains components/services and file/root counts; CLI relative JavaScript inputs and size/CSS analysis remain. The return value matches the written report. No absolute scan paths or internal reason map are emitted by default. This changes report shape; consumers needing those fields must opt in.

CSS pruning now removes functional selectors only when an unconditional class outside all function/attribute arguments belongs to an omitted component. Alternatives inside :is/:where/:not/:has remain conservative. This never uses quoted attribute text as ownership.
