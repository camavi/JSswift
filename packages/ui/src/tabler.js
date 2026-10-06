// Optional Tabler sprite: import after the JSswift runtime.
const runtime = globalThis.JSswift;
if (!runtime) throw new Error("Load JSswift before importing the optional Tabler sprite");
const spriteUrl = new URL('./img/svg/tabler-icons-sprite.svg', import.meta.url).href;
runtime.config ||= {};
runtime.config.iconSpriteUrl = spriteUrl;
export default spriteUrl;
