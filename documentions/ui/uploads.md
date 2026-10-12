# Upload and BoxUpload

`_.Upload(props)` returns a file selection/upload root. `_.BoxUpload(props)` uses the same API with a framed drop zone. Both use Card surfaces and support common color, size, spacing, shape and responsive props, plus dense, flat, border, shadow, lightShadow, glow, glossy, glass, gradient, textGradient and outline. Semantic precedence is state, status, then color; these can be reactive getters. Text Gradient applies to the title; supporting text, file details and buttons stay readable. Buttons own their palette, and internal boundaries follow the container foreground. Light Glass/Outline/Text Gradient follow Card neutral rules.

```js
_.BoxUpload({
  color: "primary", glass: true, title: "Attachments",
  submitMode: "form", accept: "image/*", multiple: true,
  onChange: files => console.log(files)
});
```

`submitMode: "form"` enables local selection without the built-in Upload action. Use `multiple:false` or `single:true` for one file. `accept`/`acceptedFiles` filters accepted types; `maxFiles`, `maxFileSize`, `minFileSize` and `maxTotalSize` are optional caller-configured limits. `disabled`/`readonly` prevent browsing, drops and file actions. `compact` reduces composition independently of Dense.

The returned root exposes `_upload`: `addFiles(files)`, `browse()`, `upload()`, `remove(itemOrId)`, `clear()`, `abort(itemOrId)`, `abortAll()`, `retry(itemOrId)`, `retryAll()`, `files()` and `state()`. File entries include name, size, file, status, progress and error. File selection remains local until an upload handler or transport is configured and invoked. Existing transport configuration and callbacks are unchanged by surface styling.

Slots include icon, title, subtitle, header, default, actions, browse, upload, clear, empty, file, fileName, fileMeta and fileActions. The default slot receives `{ api, dropzone }`; file slots receive item/file/index and file actions. Override slots with accessible controls as needed.

Owned render/state effects stop during JSswift lifecycle cleanup; active requests are aborted. Use JSswift mount/overlay lifecycle cleanup when discarding the component.
