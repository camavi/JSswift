# JSswift v1.0.18 Release Notes

Status:

- patch release prepared to harden mobile fullscreen `Dialog` sizing after the
  incomplete `v1.0.17` attempt

## Summary

`v1.0.18` closes the remaining fullscreen `Dialog` mobile overscan case. The
first fix in `v1.0.17` moved fullscreen layout to viewport-bound CSS, but the
real demo path could still render the panel as a flex-centered box with a final
height of `viewport + 2px`, producing `top: -1` and `bottom: viewport + 1`.
Fullscreen dialogs now sync directly to `window.visualViewport` and drop the
fullscreen frame border so the final panel rect stays inside the visible mobile
viewport after layout and animation.

## Fixed

- fullscreen `Dialog` now writes `top`, `left`, `width`, and `height` from
  `window.visualViewport` when available
- fullscreen `Dialog` refreshes those values on:
  - `window.resize`
  - `visualViewport.resize`
  - `visualViewport.scroll`
- fullscreen `Dialog` clears the viewport tracking listeners on close
- fullscreen dialog frame now removes the border in fullscreen mode to avoid
  `+2px` overscan from content-box fallback paths
- fullscreen dialog keeps `position: fixed`, viewport-bound sizing, and disabled
  enter/leave transform behavior

## Tests

- browser regression for fullscreen `Dialog` now waits for the settled layout
  and asserts:
  - `position === "fixed"`
  - `box-sizing === "border-box"`
  - `borderTopWidth === "0px"`
  - `borderBottomWidth === "0px"`
  - panel rect remains fully inside the mobile viewport
- existing browser regressions for Grid, GridCol, Toolbar, Card, Menu,
  ContextMenu, and Avatar remain green

## Compatibility

- `UI.Dialog` public API is unchanged
- the change affects only fullscreen dialog placement and sizing behavior
- standard dialogs and non-fullscreen overlays are unchanged
