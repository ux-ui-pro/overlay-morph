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
```javascript
import { gsap } from 'gsap';
import OverlayMorph, { applyPlatformPerfTweaks } from 'overlay-morph';
```
<br>

➠ **Usage**
```javascript
// Optional: register a custom GSAP instance (e.g., when using GSAP from a different bundle)
OverlayMorph.registerGSAP(gsap);

// Optional: apply platform performance tweaks globally (init() applies tweaks automatically as well)
applyPlatformPerfTweaks(gsap);

const overlayMorph = new OverlayMorph({
  svgEl: '.svg',
  pathEl: '.svg path',
  ease: 'power2.inOut',
  isOpened: false,
  numberPoints: 5,
  delayPoints: 0.3,
  delayPaths: 0.25,
  duration: 1.5,
  mobilePointsCap: 4,
});

overlayMorph.init();
```
<br>

➠ **Options**

| Option             |              Type               | Default                         | Description                                                                                                                                                                                                 |
|:-------------------|:-------------------------------:|:-------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `svgEl`            |  `string` &#124; `SVGElement`   |            **required**         | **Required.** SVG container selector or element node.                                                                                                                                                        |
| `pathEl`           |            `string`             |            **required**         | **Required.** Selector for the `<path>` elements inside the SVG container.                                                                                                                                  |
| `numberPoints`     |            `number`             | Desktop: `4`, Mobile: `3`       | Number of animation points on each path. Minimum is `2`. On small screens (`max-width: 767px`) the requested value is clamped by `mobilePointsCap`.                                                         |
| `delayPoints`      |            `number`             |              `0.3`              | Delay between animation of each point on a path.                                                                                                                                                            |
| `delayPaths`       |            `number`             |              `0.25`             | Delay between animation of each path.                                                                                                                                                                       |
| `duration`         |            `number`             |               `1`               | Duration of the animation.                                                                                                                                                                                  |
| `ease`             |            `string`             |             `'none'`            | Timing function. See [GSAP easing](https://greensock.com/docs/v3/Eases).                                                                                                                                    |
| `isOpened`         |           `boolean`             |              `false`            | Whether the overlay starts in an opened (`true`) or closed (`false`) state. The `toggle()`, `entry()`, and `leave()` methods can be used to change the state dynamically.                                   |
| `mobilePointsCap`  |            `number`             |               `4`               | Maximum allowed value for `numberPoints` on small screens. Has no effect on larger screens.                                                                                                                 |
<br>

➠ **API**

| Method                     | Description                                                                                       |
|:---------------------------|:--------------------------------------------------------------------------------------------------|
| `init()`                   | Initializes the overlay with the given options.                                                   |
| `toggle()`                 | Toggles the animation state between opened and closed. Returns a `Promise<void>`.                 |
| `entry()`                  | Sets the animation state to open. Returns a `Promise<void>` that resolves when the animation completes. |
| `leave()`                  | Sets the animation state to closed. Returns a `Promise<void>` that resolves when the animation completes. |
| `totalDuration()`          | Returns the total duration of the animation in milliseconds.                                      |
| `stopTimelineIfActive()`   | Stops the current animation timeline if active. Useful for cancelling or resetting animations.    |
| `destroy()`                | Destroys the overlay instance, cleaning up any created elements, setters, and animations.          |
| `registerGSAP(gsap)`      | *(static)* Registers a GSAP instance to be used internally.                                       |
<br>

➠ **Performance**

- `applyPlatformPerfTweaks()` adjusts GSAP's ticker lag smoothing to improve frame pacing on iOS devices and other platforms.
- You can call it manually with a GSAP instance, but `init()` already applies these tweaks internally.

<br>

➠ **License**

overlay-morph is released under MIT license.
