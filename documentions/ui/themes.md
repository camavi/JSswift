# Base CSS, themes and component props

Both ui.css and ui-light.css include base.css. Do not import base.css again. It supplies shared color scales, semantic theme variables, typography and component tokens. Light CSS omits breakpoint utilities, not the default theme or color/dense/outline props.

## Shared theme

```js
_.setTheme('light', {persist:false});
_.setTheme('dark');
_.toggleTheme(['light', 'dark']);
const current = _.getTheme();
```

setTheme writes data-theme on the document root and persists by default under jsswift:theme. Use persist:false for an ephemeral preview. Apply the restored value at startup with `_.setTheme(_.getTheme())`; theme helpers do not synthesize a palette for arbitrary theme names. base.css defines light and dark rules; custom themes need matching CSS.

For a brand color, override the existing scale after importing JSswift CSS:

```css
:root {
  --jss-primary-600: #2563eb;
  --jss-primary-700: #1d4ed8;
}
```

Semantic variables such as --jss-primary, --jss-primary-hover, --jss-bg and --jss-text connect the palette to components. Dark/brand selectors may override them; check computed values in each desired theme. Scope custom colors to an application container when they should not affect the whole page. Do not rename internal selectors to build a theme.

## Individual components

```js
_.Button({color:'primary', outline:true, dense:true}, 'Modifica');
_.Input({label:'Nome', radius:8});
_.Kpi({title:'Disponibili', value:9, note:'Con scorte', radius:12, shadow:'none'});
```

Use documented component props before custom CSS. dense is component-specific: do not assume every component supports it. A page background belongs to an application container; preserve the transparent native Input background and its surrounding control border. Props affect the component, whereas theme variables can affect every descendant.

## Verification

Check light/dark computed colors, border/focus/error states, and mobile dimensions. Measure contrast for text/background pairs, including disabled states where appropriate. A screenshot or a valid color token alone does not establish accessibility compliance.
