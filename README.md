# Walnut / Petrol Bedroom - Blender + Three.js viewer (source)

A runnable copy of the interactive modern-bedroom showcase: a Blender-authored scene rendered
with Three.js 0.180 (WebGL 2) with baked ambient lightmaps, shadowed sun, interactive curtains,
a draggable throw and a palette of finishes.

## Run

Requirements: Node.js 18+ (20+ recommended) and Python 3.8+.

```sh
npm ci
npm run dev        # fetches + verifies the runtime assets (assets.lock.json), then serves
npm run build      # production build (also regenerates .release/modern-bedroom-source.zip)
npm run preview
```

Deploy under a sub-path with `npm run build -- --base=/your-path/`.

## Assets

The runtime set (meshopt + KTX2 GLB, KTX2 lightmaps, `lightmap-samples.bin/.json`, Radiance
probes, manifests) is not stored in the archive. `assets.lock.json` pins its release bundle by
SHA-256; `scripts/fetch_assets.py` downloads and verifies it into `public/` (`--bundle FILE` installs a
local copy). The same lock lists the portable GLB and the packed Blender master that the page offers
as downloads (`python3 scripts/fetch_assets.py --check-downloads` verifies them).
The Basis/KTX2 transcoder is copied from `three` at build time to `vendor/basis/`.

## What is included

- `index.html`, `src/` - viewer, curtain and bed-cloth interaction, navigation, palette, loader.
- `scripts/` - fetch/lock/package tooling and `optimize_runtime_assets.mjs`, the offline optimizer
  (masters -> runtime set; needs the Blender exports and `basisu`).
- `authoring/` - the Blender/Python build sources (`build_scene.py`, materials, fabric and atlas
  preparation), `scene-spec.json`, `material-policy.json`, resource selection and provenance.
- `authoring/resources/` - the CC0 source maps with their `source.json` / `LICENSE` provenance.

## Limits

- Dimensions, camera and hidden surfaces are estimates from a single synthetic image.
- Sunlight and shadows are dynamic; indirect light and reflections stay baked. This is not full
  dynamic global illumination.
- The portable GLB and Blender file are exports of the authored state; they contain no live cloth
  state of the viewer.

## Credits

Textures come from [Poly Haven](https://polyhaven.com/) and [ambientCG](https://ambientcg.com/)
(CC0 1.0). The design reference image is synthetic (Customuse / Nano Banana 2) and not covered by
that CC0 statement. Details: `THIRD_PARTY_NOTICES.txt`.
