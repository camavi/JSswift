#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import { selectUI, selectComponentCSS } from './select-ui.mjs';
import { runtimeLayout } from './runtime-layout.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const extras = {
  'material-symbols-outlined': 'fonts-material.css',
  'nunito-font': 'fonts-nunito.css',
  tabler: null,
};

export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Expected a configuration object');
  for (const key of Object.keys(config)) if (!['ui', 'extras'].includes(key)) throw new Error(`Unknown config option: ${key}`);
  const ui = config.ui ?? { all: true };
  if (!ui || typeof ui !== 'object' || Array.isArray(ui)) throw new Error('ui must be an object');
  for (const key of Object.keys(ui)) if (!['all', 'responsive', 'components', 'services'].includes(key)) throw new Error(`Unknown ui option: ${key}`);
  if (ui.all !== undefined && typeof ui.all !== 'boolean') throw new Error('ui.all must be boolean');
  if (ui.responsive !== undefined && typeof ui.responsive !== 'boolean') throw new Error('ui.responsive must be boolean');
  for (const key of ['components', 'services']) {
    if (ui[key] !== undefined && (!Array.isArray(ui[key]) || ui[key].some(name => typeof name !== 'string' || !name))) throw new Error(`ui.${key} must be an array of names`);
  }
  const all = ui.all ?? (ui.components === undefined && ui.services === undefined);
  if (all && (ui.components?.length || ui.services?.length)) throw new Error('Use ui.all: true alone or selective components/services');
  const selected = config.extras ?? [];
  if (!Array.isArray(selected)) throw new Error('extras must be an array');
  for (const name of selected) if (!Object.hasOwn(extras, name)) throw new Error(`Unknown extra: ${name}`);
  return { ui: { all, responsive: ui.responsive ?? true, components: [...new Set(ui.components ?? [])], services: [...new Set(ui.services ?? [])] }, extras: [...new Set(selected)] };
}

export async function buildConfiguredRuntime(config, output, sourceRoot = root) {
  const normalized = validateConfig(config);
  const layout = runtimeLayout(sourceRoot);
  const selective = !normalized.ui.all && (normalized.ui.components.length || normalized.ui.services.length);
  const selection = selective ? await selectUI(sourceRoot, normalized.ui.components, normalized.ui.services) : null;
  // A dedicated empty directory prevents stale opt-in assets and accidental overwrite.
  await fs.mkdir(output, { recursive: true });
  if ((await fs.readdir(output)).length) throw new Error('Output directory must be empty; choose a new application output directory');
  const inputs = [path.relative(sourceRoot, layout.core)];
  if (normalized.ui.all) inputs.push(path.relative(sourceRoot, layout.ui));
  const chunks = await Promise.all(inputs.map(file => fs.readFile(path.join(sourceRoot, file), 'utf8')));
  if (selection) { chunks.push(selection.code); inputs.push(...selection.sources); }
  if (normalized.extras.includes('tabler')) {
    chunks.push('JSswift.config ||= {}; JSswift.config.iconSpriteUrl = new URL("./img/svg/tabler-icons-sprite.svg", import.meta.url).href;');
    await fs.mkdir(path.join(output, 'img/svg'), { recursive: true });
    await fs.copyFile(path.join(layout.assets, 'img/svg/tabler-icons-sprite.svg'), path.join(output, 'img/svg/tabler-icons-sprite.svg'));
  }
  const runtime = await transform(chunks.join('\n'), { minify: true, target: 'es2018', format: 'esm' });
  await fs.writeFile(path.join(output, 'runtime.js'), runtime.code);
  const css = [];
  if (normalized.ui.all) css.push(normalized.ui.responsive ? 'ui.css' : 'ui-light.css');
  else if (selection) css.push('base.css', 'animation.css', 'ui-components.css', normalized.ui.responsive ? 'responsive.css' : 'responsive-base.css');
  else css.push('base.css');
  for (const name of normalized.extras) if (extras[name]) css.push(extras[name]);
  await fs.mkdir(path.join(output, 'css'), { recursive: true });
  let removedSelectors = 0;
  const cssChunks = await Promise.all(css.map(async file => {
    const content = await fs.readFile(path.join(layout.assets, 'css', file), 'utf8');
    if (selection && file === 'ui-components.css') {
      const result = selectComponentCSS(content, selection.components, selection.services);
      removedSelectors = result.removedSelectors;
      return result.css;
    }
    return content;
  }));
  const stylesheet = cssChunks.join('\n');
  await fs.writeFile(path.join(output, 'css/runtime.css'), stylesheet);
  if (normalized.extras.includes('nunito-font')) await fs.cp(path.join(layout.assets, 'fonts'), path.join(output, 'fonts'), { recursive: true });
  const report = { config: normalized, javascript: inputs, css, extras: normalized.extras, selectiveComponents: !!selection, components: selection?.components ?? (normalized.ui.all ? 'all' : []), services: selection?.services ?? (normalized.ui.all ? 'all' : []), reasons: selection?.reasons ?? {}, removedSelectors, runtimeBytes: Buffer.byteLength(runtime.code), cssBytes: Buffer.byteLength(stylesheet) };
  await fs.writeFile(path.join(output, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

// npm binaries are symlinks; compare the real entrypoint rather than .bin path.
const invokedPath = process.argv[1] ? await fs.realpath(process.argv[1]).catch(() => null) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--help' || process.argv[2] === '-h') {
      console.log('Usage: jss-build [config-path] [output-directory]\nDefaults: jss.config.js and dist-runtime (must be empty)');
    } else {
      const configPath = path.resolve(process.argv[2] ?? 'jss.config.js');
      const output = path.resolve(process.argv[3] ?? 'dist-runtime');
      const config = (await import(pathToFileURL(configPath).href)).default;
      const report = await buildConfiguredRuntime(config, output);
      console.log(`Configured runtime: ${output} (${report.runtimeBytes} JS bytes); report: build-report.json`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
