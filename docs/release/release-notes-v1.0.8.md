# JSswift v1.0.8 Release Notes

Status:

- patch release shipped to add keyboard shortcode support to the UI package and
  align all three published package versions

## Summary

`v1.0.8` adds a shared UI shortcode system for keyboard shortcuts and visible
shortcut badges. Components that represent actions or focusable controls can now
register shortcuts through props such as `shortcode`, `shortcut`, `hotkey`, or
`keys`, and can optionally render the configured shortcut with `showShortcode`.

## Added

- shared shortcode parser and registry in the UI foundation
- support for aliases such as `mod`, `cmd`, `ctrl`, `option`, `esc`, `return`,
  arrow keys, and platform-aware `Mod`
- visible shortcut badge helper for components that opt in with
  `showShortcode`
- shortcut cleanup through the existing component cleanup registry
- shortcut metadata for AI/developer tooling

## Changed

- `Btn` can trigger its click action through a registered shortcode
- `FormField`, `InputRaw`, `Input`, and `Select` can expose shortcut badges and
  focus/open controls through shortcode bindings
- `Checkbox`, `Radio`, and `Toggle` can show shortcut badges and toggle through
  shortcode bindings
- package versions bumped to `1.0.8` across:
  - `@jsswift/core`
  - `@jsswift/ui`
  - `jsswift`

## Compatibility

- existing component props remain backward-compatible
- shortcode props are optional and ignored when absent
- shortcuts avoid editable fields by default unless a binding explicitly allows
  editable targets
