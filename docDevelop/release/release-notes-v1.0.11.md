# JSswift v1.0.11 Release Notes

Status:

- patch release prepared to complete the responsive Grid/GridCol fix and remove
  the remaining generic responsive conflict for GridCol spans

## Summary

`v1.0.11` keeps the `v1.0.10` `.cms-rsp` cascade fix and closes the remaining
GridCol edge case. `UI.GridCol` now treats root `col` as a real alias of
`span`, while its column placement stays on the dedicated `--cms-grid-col-*`
path instead of also entering the generic `.cms-rsp` `grid-column` path.

## Fixed

- `GridCol({ col })` now works as the base alias of `GridCol({ span })`
- `GridCol({ span, tablet: { col }, pc: { col } })` no longer emits generic
  `--cms-rsp-grid-column` or `--cms-rsp-pc-grid-column` variables
- GridCol column placement now avoids conflicts between:
  - dedicated `--cms-grid-col-*` variables
  - generic responsive `--cms-rsp-grid-column` variables
- Toolbar content inside a responsive GridCol keeps its expected flex layout

## Tests

- expanded the browser regression suite for:
  - responsive Grid display and desktop tracks
  - GridCol `col` alias
  - absence of generic GridCol `grid-column` responsive variables
  - Toolbar layout inside GridCol

## Compatibility

- existing `span` usage remains supported
- existing `tablet: { col }` and `pc: { col }` usage remains supported
- consumers using `col` in public examples no longer need workarounds
