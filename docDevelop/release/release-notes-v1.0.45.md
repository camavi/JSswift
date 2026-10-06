# JSswift 1.0.45 and knowledge MCP 0.1.1

Default UI CSS uses system fonts. Nunito and Material Symbols now require explicit optional imports. Existing applications using these fonts must add the corresponding CSS import after ui.css. Tabler has a separate optional module that configures the bundled sprite. Assets remain shipped in npm packages.

```js
import 'jsswift';
import 'jsswift/css/ui.css';
// Optional:
import 'jsswift/css/fonts-nunito.css';
import 'jsswift/css/fonts-material.css';
import 'jsswift/tabler';
```

The same optional entries are available under @jsswift/ui. Seven component contracts are more compact without losing metadata. Focused examples clarify value callbacks, Table render/format argument order, and Dialog lifecycle. Application guidance prioritizes built-in component CSS and focused contract reads. MCP 0.1.1 points agents to these guides and continues reading documentation from the installed framework version.
