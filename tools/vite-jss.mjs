import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateConfig, extras } from './build-configured-runtime.mjs';
import { selectUI, selectComponentCSS } from './select-ui.mjs';
import { runtimeLayout } from './runtime-layout.mjs';

const frameworkRoot = fileURLToPath(new URL('../', import.meta.url));
const runtimeId = '\0jss:runtime';
const cssId = '\0jss:selected.css';

export function jssRuntime(options = {}) {
  const configPath = path.resolve(options.config ?? 'jss.config.js');
  const sourceRoot = options.sourceRoot ?? frameworkRoot;
  const layout = runtimeLayout(sourceRoot);
  let cached;
  let used = false;
  const prepare = () => cached ??= (async () => {
    const config = validateConfig((await import(pathToFileURL(configPath).href + `?mtime=${(await fs.stat(configPath)).mtimeMs}`)).default);
    const selective = !config.ui.all && (config.ui.components.length || config.ui.services.length);
    const selection = selective ? await selectUI(sourceRoot, config.ui.components, config.ui.services) : null;
    return { config, selection };
  })();
  return {
    name: 'jss-configured-runtime',
    resolveId(id) {
      if (id === 'jss:runtime') return runtimeId;
      if (id === 'jss:selected.css') return cssId;
    },
    async load(id) {
      if (![runtimeId, cssId].includes(id)) return;
      this.addWatchFile(configPath);
      const { config, selection } = await prepare();
      const asset = file => path.join(layout.assets, file);
      if (id === cssId) {
        const filename = asset('css/ui-components.css');
        this.addWatchFile(filename);
        return selectComponentCSS(await fs.readFile(filename, 'utf8'), selection.components, selection.services).css;
      }
      used = true;
      const imports = [`import ${JSON.stringify(layout.core)};`];
      const css = config.ui.all ? [config.ui.responsive ? 'ui.css' : 'ui-light.css'] : selection ? ['base.css', 'animation.css'] : ['base.css'];
      for (const file of css) imports.push(`import ${JSON.stringify(asset('css/' + file))};`);
      if (selection) {
        imports.push('import "jss:selected.css";');
        imports.push(`import ${JSON.stringify(asset('css/' + (config.ui.responsive ? 'responsive.css' : 'responsive-base.css')))};`);
        for (const file of selection.sources) this.addWatchFile(path.join(sourceRoot, file));
      } else if (config.ui.all) imports.push(`import ${JSON.stringify(asset('ui.js'))};`);
      for (const extra of config.extras) {
        if (extras[extra]) imports.push(`import ${JSON.stringify(asset('css/' + extras[extra]))};`);
        else if (extra === 'tabler') imports.push(`import spriteUrl from ${JSON.stringify(asset('img/svg/tabler-icons-sprite.svg') + '?url')};`);
      }
      return imports.join('\n') + '\n' + (selection?.code ?? '') + (config.extras.includes('tabler') ? '\nJSswift.config ||= {}; JSswift.config.iconSpriteUrl = spriteUrl;' : '');
    },
    configureServer(server) {
      server.watcher.add(configPath);
      const onChange = file => {
        if (file === configPath || file.startsWith(layout.source + path.sep)) {
          cached = undefined;
          void server.restart();
        }
      };
      server.watcher.on('change', onChange);
      server.httpServer?.once('close', () => server.watcher.off('change', onChange));
    },
    watchChange() { cached = undefined; },
    async generateBundle() {
      if (!used) return;
      const { config, selection } = await prepare();
      this.emitFile({ type: 'asset', fileName: 'jss-build-report.json', source: JSON.stringify({ config, components: selection?.components ?? (config.ui.all ? 'all' : []), services: selection?.services ?? (config.ui.all ? 'all' : []), reasons: selection?.reasons ?? {} }, null, 2) });
    },
  };
}
