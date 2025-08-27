<div align="center">
<br>

<h1>overlay-morph</h1>

<p><sup>overlay-morph is a lightweight library for creating multi-layered SVG overlays with animated transitions. It is ideal for dynamic scene transitions in SPAs or animated menu effects. The animation is fully customizable, allowing you to adjust timing, easing, and shape behavior.</p>

[![npm](https://img.shields.io/npm/v/overlay-morph.svg?colorB=brightgreen)](https://www.npmjs.com/package/overlay-morph)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/overlay-morph.svg)](https://github.com/ux-ui-pro/overlay-morph)
[![NPM Downloads](https://img.shields.io/npm/dm/overlay-morph.svg?style=flat)](https://www.npmjs.org/package/overlay-morph)

<sup>2kB gzipped</sup>

<a href="https://codepen.io/ux-ui/full/Jjervqg">Demo</a>

</div>
<br>

➠ **Install**
```console
yarn add gsap
yarn add overlay-morph
```
<br>

➠ **Import**
```ts
import { gsap } from 'gsap';
import OverlayMorph from 'overlay-morph';
```
<br>

➠ **Usage**
```ts
const overlayMorph = new OverlayMorph({
  svgEl: '.svg',
  pathEl: '.svg path',
  ease: 'power1.inOut',
  isOpened: false,
  numberPoints: 6,
  delayPoints: 0.3,
  delayPaths: 0.25,
  duration: 1.5,
  mobilePointsCap: 3,

  // Performance/quality tuning (optional)
  precision: 0.1,
  lutSamples: 64,
  useLUT: true,
  renderStride: 1,
});

overlayMorph.init();

// later
await overlayMorph.entry();
await overlayMorph.leave();
await overlayMorph.toggle();
```
<br>

➠ **Options**

| Option             |              Type               | Default                                | Description                                                                                                                                                                                                 |
|:-------------------|:-------------------------------:|:--------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `svgEl`            |  `string` &#124; `SVGElement`   |            **required**                | **Required.** SVG container selector or element node.                                                                                                                                                        |
| `pathEl`           |            `string`             |            **required**                | **Required.** Selector for the `<path>` elements inside the SVG container.                                                                                                                                  |
| `numberPoints`     |            `number`             | Desktop: `4`, Mobile: `3`              | Number of animation points on each path (min `2`). On small screens (`max-width: 991px`) the requested value is clamped by `mobilePointsCap`.                                                               |
| `delayPoints`      |            `number`             |                 `0.3`                  | Max random delay per point (quantized to frame).                                                                                                                                                             |
| `delayPaths`       |            `number`             |                 `0.25`                 | Delay between animation of each path.                                                                                                                                                                       |
| `duration`         |            `number`             |                  `1`                   | Duration of point animation segment.                                                                                                                                                                        |
| `ease`             |            `string`             |               `'none'`                 | Timing function. See [GSAP easing](https://greensock.com/docs/v3/Eases).                                                                                                                                    |
| `isOpened`         |           `boolean`             |                 `false`                | Initial state. Use `toggle()`, `entry()`, `leave()` to change it at runtime.                                                                                                                                |
| `mobilePointsCap`  |            `number`             |                  `3`                   | Maximum allowed value for `numberPoints` on small screens.                                                                                                                                                  |
| `precision`        |            `number`             | iOS: `0.2`, others: `0.1`              | Y rounding step in percent; internally snapped to **tenths of percent** (0.1%). Values below `0.1` behave like `0.1`.                                                                                      |
| `lutSamples`       |            `number`             |                  `64`                  | Samples for the ease LUT, when `useLUT` is enabled.                                                                                                                                                         |
| `useLUT`           |           `boolean`             | iOS: `true`, others: `false`           | Enables LUT-based easing evaluation (reduces per-frame cost on mobile Safari).                                                                                                                              |
| `renderStride`     |            `number`             |                  `1`                   | Render every Nth update (integer ≥ `1`). Use `2` to halve update frequency (approx. 30fps).                                                                                                                |
<br>

➠ **API**

| Method                   | Description                                                                                             |
|:-------------------------|:--------------------------------------------------------------------------------------------------------|
| `init()`                 | Initializes the overlay with the given options. Idempotent.                                             |
| `toggle()`               | Toggles between opened/closed. Returns a `Promise<void>` resolved on animation complete.                |
| `entry()`                | Opens the overlay. Returns a `Promise<void>` resolved on animation complete.                            |
| `leave()`                | Closes the overlay. Returns a `Promise<void>` resolved on animation complete.                           |
| `totalDuration()`        | Returns the total duration of the current timeline in **milliseconds**.                                 |
| `stopTimelineIfActive()` | Stops the current animation timeline if active. Useful for cancelling or resetting animations.          |
| `destroy()`              | Cleans up all setters, callbacks, and the timeline.                                                     |
<br>

➠ **License**

overlay-morph is released under MIT license.
