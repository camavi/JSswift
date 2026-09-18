# JSswift v1.0.4 Release Notes

Status:

- patch release prepared to ship the first complete runtime theme helper set

## Summary

`v1.0.4` adds a complete lightweight theme API to the JSswift core and aligns the demo theme toggle with that runtime behavior.

## Added

- `JSswift.setTheme(theme)`
- `JSswift.getTheme()`
- `JSswift.toggleTheme(themes)`
- automatic saved-theme restore from `localStorage`
- multi-theme toggle support that works with any ordered list of theme names

## Changed

- `setTheme()` now persists the selected theme automatically
- the public README and core reference now document the theme helper contract
- the local demo theme switcher was aligned with the new core helper behavior

## UI

- small UI CSS polish was included so the theme toggle stays visually coherent in dark theme usage

## Compatibility

- existing CSS rules based on `:root[data-theme="..."]` keep working unchanged
- consumers can keep calling `JSswift.setTheme("dark")` as before
- projects that need more than two themes can now pass an explicit ordered list to `JSswift.toggleTheme([...])`
