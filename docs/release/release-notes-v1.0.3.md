# JSswift v1.0.3 Release Notes

Status:

- patch release prepared to remove an obsolete CSS artifact from all runtime outputs

## Summary

`v1.0.3` removes the obsolete generated icon sprite CSS artifact from JSswift UI and umbrella package outputs.

## Removed

- the generated UI package CSS artifact
- the generated umbrella package CSS artifact
- the local mirror CSS artifact, when present
- package exports for the removed CSS artifact
- README references to the removed CSS artifact

The generated bundled CSS files no longer include the Tabler sprite CSS block:

- `ui.css`
- `min-ui.css`
- `ui.min.css`

## Build

The CSS build now copies only the active CSS files and removes stale CSS outputs from the generated directories.

## Compatibility

The removed CSS file should not be used as a public import path. Consumers should use:

- `@jsswift/ui/css/ui.css`
- `@jsswift/ui/css/ui.min.css`
- `jsswift/css/ui.css`
- `jsswift/css/ui.min.css`
