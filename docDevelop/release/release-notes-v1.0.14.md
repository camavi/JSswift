# JSswift v1.0.14 Release Notes

Status:

- patch release prepared to fix responsive `Avatar` props and nested `GridCol`
  span inheritance

## Summary

`v1.0.14` closes two remaining responsive edge cases in JSswift UI. `UI.Avatar`
now participates in the shared common responsive prop engine, and nested
`GridCol` children no longer inherit grid span custom properties from a parent
`GridCol`.

## Fixed

- `UI.Avatar({ width, tablet: { width } })` now receives the same
  `cms-rsp-*` classes and custom properties used by Badge, Chip, and other
  common components
- `UI.Avatar` metadata now documents `mobile`, `tablet`, and `pc` responsive
  prop support for shared sizing and spacing props
- `GridCol` roots initialize local `--cms-grid-col-base`,
  `--cms-grid-col-tablet`, and `--cms-grid-col-pc` variables so nested grid
  items do not read span values from parent columns
- nested `Grid` layouts inside a spanning `GridCol` can use plain child
  `GridCol` items without forcing `col: 1` at every breakpoint

## Tests

- added browser regression coverage for:
  - responsive `Avatar` width on mobile and tablet
  - nested `GridCol` children inside a parent `GridCol({ pc: { col: 7 } })`
  - real two-column desktop layout for the nested grid children

## Compatibility

- existing explicit `span`, `col`, `tablet.col`, and `pc.col` usage is
  preserved
- manually supplied `--cms-grid-col-*` style custom properties are still
  respected
