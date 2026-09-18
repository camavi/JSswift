# JSswift v1.0.19 Release Notes

Status:

- patch release prepared to finalize the real fullscreen `Dialog` mobile fix

## Summary

`v1.0.19` closes the remaining fullscreen `Dialog` mobile overscan bug after the
incomplete `v1.0.18` release. The previous fix still depended too much on CSS
fullscreen rules and could miss the real demo path where the panel ended up
with a final rect of `top: -1` and `bottom: viewport + 1`. Fullscreen dialog
layout is now enforced directly on the panel through viewport-synced inline
styles, so the final `DOMRect` stays inside the visible mobile viewport.

## Fixed

- fullscreen `Dialog` now applies the fullscreen frame directly on the panel via
  inline style:
  - `position: fixed`
  - `top` / `left`
  - `width` / `height`
  - `max-width` / `max-height`
  - `border-width: 0`
  - `border-radius: 0`
  - `box-sizing: border-box`
  - `transform: none`
- fullscreen `Dialog` still syncs against `window.visualViewport` when
  available, with fallback to `window.innerWidth` / `window.innerHeight`
- fullscreen viewport sync continues to refresh on resize and viewport scroll
  and is cleaned up on close

## Tests

- browser regression for fullscreen `Dialog` on `390x844` remains green
- the regression validates the final settled `getBoundingClientRect()` after
  render/animation
- existing responsive browser regressions for Grid, GridCol, Toolbar, Card,
  Menu, ContextMenu, and Avatar remain green

## Compatibility

- `UI.Dialog` public API is unchanged
- the change affects only fullscreen dialog sizing and placement
- standard dialogs remain unchanged
