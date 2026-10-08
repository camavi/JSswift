import { existsSync } from 'node:fs';
import path from 'node:path';

// The same tooling runs from the checkout and from jsswift/dist/build.
export function runtimeLayout(root) {
  const checkout = existsSync(path.join(root, 'packages/ui/src/modules.json'));
  return {
    core: path.join(root, checkout ? 'packages/core/dist/cms.js' : 'cms.js'),
    ui: path.join(root, checkout ? 'packages/ui/dist/ui.js' : 'ui.js'),
    assets: path.join(root, checkout ? 'packages/ui/dist' : '.'),
    source: path.join(root, checkout ? 'packages/ui/src' : 'ui-src'),
  };
}
