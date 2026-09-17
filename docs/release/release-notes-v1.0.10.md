# JSswift v1.0.10 Release Notes

Status:

- patch release prepared to fix the responsive Grid cascade regression from
  `v1.0.9`

## Summary

`v1.0.10` fixes a responsive CSS cascade bug where `.cms-rsp` could apply
properties backed by undefined custom properties. In browser computed styles,
that could reset component defaults such as `display: grid` and `gap`, causing
`UI.Grid` to keep the correct `grid-template-columns` value while still laying
out children as non-grid content.

## Fixed

- responsive custom-property rules are now activated per property and breakpoint
  through classes such as `cms-rsp-gap`, `cms-rsp-tablet-gap`, and
  `cms-rsp-pc-grid-template-columns`
- undefined responsive variables no longer override base component CSS from
  `ui-components.css`
- `UI.Grid` keeps a safe `display: grid` or `display: inline-grid` base when
  responsive props are present and no responsive `display` override is provided
- desktop `Grid({ cols: 1, tablet: { cols: 2 }, pc: { cols: 4 } })` now renders
  four real grid tracks at `>=1024px`

## Tests

- added a browser regression test for responsive Grid columns at a 1440px
  viewport
- verified computed `display`, `gap`, desktop track count, and child placement

## Compatibility

- existing responsive prop names and generated variables remain unchanged
- consumers do not need to update component usage
- packages that copied generated CSS should refresh from the `v1.0.10` package
  CSS outputs
