Docs: `/docs/runtime/image`

```ts
await Bun.file("photo.jpg").image().resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).write("thumb.webp");
// fit: "fill" (default, stretch to exact size) or "inside" (keep aspect ratio, fit within the box) — the full set.
// Bun.Image has no crop/cover step: for a square thumbnail use resize(200, 200) (stretch) or { fit: "inside" } (letterbox-free, may be smaller on one side).
img.resize(800); // width only, keeps aspect ratio
img.rotate(90).flip(); // also .flop(), .modulate({ brightness })
const { width, height, format } = await new Bun.Image("photo.jpg").metadata();
const png = await new Bun.Image(bytes, { maxPixels: 4096 * 4096 }).png().bytes(); // untrusted input: pass bytes, cap pixels
```
