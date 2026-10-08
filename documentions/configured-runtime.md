# Configured application runtime (experimental)

`jss.config.js` selects UI components, services and optional assets at build time. The complete runtime remains compatible with existing imports and script bundles. The package build includes the tooling under jsswift/vite and jsswift/build, plus the jss-build command. These additions are included starting with jsswift 2.1.0; older installed releases do not expose them. Build tooling requires Node.js 20.19.x or >=22.12.0.

## Configuration

```js
export default {
  ui: { all: true, responsive: true },
  extras: ['material-symbols-outlined'],
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

`ui.all` defaults to true when neither components nor services is specified. Providing either list enables selective mode unless all is explicitly true. Use all:true alone; combining it with nonempty selection lists is rejected. `ui: {all:false}` without lists builds core-only JavaScript and base CSS. Unknown component, service, extra and configuration names fail the build.

Component names match the public API, including Button/Btn and cardHeader/cardBody/cardFooter. Supported services are Dialog (component plus alert/confirm/prompt shortcuts), Notify (component plus toast service), Loading (loading overlay), and Form (useForm). Dependencies are resolved from source statements; Button includes Icon, Tooltip and Spinner, while Table also includes Card. Referenced optional branches are included conservatively. Applications using dynamic component lookup must explicitly request every possible component.

`ui.responsive` defaults to true. False retains base layout utilities and component mobile CSS, but excludes breakpoint utilities. In selective mode, component-owned CSS selectors are pruned; shared tokens, native rules, utilities, animations, unknown selectors and complex functional selectors are retained conservatively. The core is always included completely.

Supported extras are `material-symbols-outlined`, `nunito-font`, and `tabler`; the default is an empty array. Material Symbols uses a remote Google font. Nunito font files and the Tabler sprite are local assets. Extra assets are included only when configured; separate application CSS/imports can still load additional assets independently.

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

This generates runtime.js, css/runtime.css, selected extra assets and build-report.json. The report lists selected components/services, dependency reasons, inputs, removed CSS selectors and JavaScript/CSS byte counts. The output directory must be empty to avoid stale optional assets; use a fresh destination for subsequent standalone builds. Vite builds manage their own output normally.

```html
<link rel="stylesheet" href="./dist-runtime/css/runtime.css">
<script type="module">
  import './dist-runtime/runtime.js';
  _.mount('#app', _.Button({label:'Save'}));
</script>
```

Continue using the single public `_` application namespace.
