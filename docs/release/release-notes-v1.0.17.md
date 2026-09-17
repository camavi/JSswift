# JSswift v1.0.17 Release Notes

Status:

- patch release prepared to fix fullscreen `Dialog` viewport overscan on mobile

## Summary

`v1.0.17` fixes the remaining mobile fullscreen `Dialog` sizing edge case found
after `v1.0.16`. On narrow mobile viewports, the fullscreen panel could render
with a `DOMRect` extending by 1px outside the visible viewport because the
fullscreen variant still inherited standard dialog sizing and panel enter
transform behavior. The fullscreen dialog now uses explicit viewport-bound
positioning and sizing so the final panel stays inside the viewport after
layout.

## Fixed

- fullscreen `Dialog` now uses `position: fixed` with `inset: 0`
- fullscreen `Dialog` now uses viewport-bound width and height values:
  `100vw`, `100vh`, and `100dvh`
- fullscreen `Dialog` uses `box-sizing: border-box` and drops the standard
  rounded dialog frame sizing assumptions in fullscreen mode
- fullscreen dialog shell and body now stretch correctly within the fixed panel
- fullscreen dialog enter/leave transform is disabled so the panel rect does
  not drift outside the viewport during mobile open/settle

## Tests

- browser regression added for fullscreen `Dialog` on `390x844`
- the regression verifies:
  - `left >= 0`
  - `top >= 0`
  - `right <= viewport width`
  - `bottom <= viewport height`
  - fullscreen panel width matches the viewport width
- existing browser regressions for Grid, GridCol, Toolbar, Card, Menu,
  ContextMenu, and Avatar remain green

## Compatibility

- `UI.Dialog` public API is unchanged
- the change only affects fullscreen dialog layout behavior
- standard dialogs and overlay APIs keep the same behavior
