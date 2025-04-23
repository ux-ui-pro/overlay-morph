<div align="center">
<br>

<h1>overlay-morph</h1>

<p><sup>overlay-morph is a lightweight library for creating multi-layered SVG overlays with animated transitions. It is ideal for dynamic scene transitions in SPAs or animated menu effects. The animation is fully customizable, allowing you to adjust timing, easing, and shape behavior.</p>

[![npm](https://img.shields.io/npm/v/overlay-morph.svg?colorB=brightgreen)](https://www.npmjs.com/package/overlay-morph)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/overlay-morph.svg)](https://github.com/ux-ui-pro/overlay-morph)
[![NPM Downloads](https://img.shields.io/npm/dm/overlay-morph.svg?style=flat)](https://www.npmjs.org/package/overlay-morph)

<sup>1.4kB gzipped</sup>

<a href="https://codepen.io/ux-ui/full/Jjervqg">Demo</a>

</div>
<br>

&#10148; **Install**
```console
$ yarn add gsap
$ yarn add overlay-morph
```
<br>

&#10148; **Import**
```javascript
import { gsap } from 'gsap';
import OverlayMorph from 'overlay-morph';
```
<br>

&#10148; **Usage**
```javascript
const overlayMorph = new OverlayMorph({
  svgEl: '.svg',
  pathEl: '.svg path',
  ease: 'power2.inOut',
  isOpened: false,
  numberPoints: 5,
  delayPoints: 0.3,
  delayPaths: 0.25,
  duration: 1.5,
});

overlayMorph.init();
```
<br>

&#10148; **Options**

| Option         |             Type              | Default  | Description                                                                                                                                                                       |
|:---------------|:-----------------------------:|:--------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `svgEl`        | `string` &vert; `HTMLElement` |  `null`  | **Required.** SVG container selector.                                                                                                                                             |
| `pathEl`       | `string` &vert; `HTMLElement` |  `null`  | **Required.** Path selector.                                                                                                                                                      |
| `numberPoints` |           `number`            |   `4`    | Number of animation points on each path.                                                                                                                                          |
| `delayPoints`  |           `number`            |  `0.3`   | Delay between animation of each point on path.                                                                                                                                    |
| `delayPaths`   |           `number`            |  `0.25`  | Delay between animation of each path.                                                                                                                                             |
| `duration`     |           `number`            |   `1`    | Duration of animation.                                                                                                                                                            |
| `ease`         |           `string`            | `'none'` | Timing function. See [gsap easing](https://greensock.com/docs/v3/Eases).                                                                                                          |
| `isOpened`     |           `boolean`           | `false`  | Defines whether the overlay starts in an opened (`true`) or closed (`false`) state. The `toggle()`, `entry()`, and `leave()` methods can be used to change the state dynamically. |
<br>

&#10148; **API**

| Method                    | Description                                                                                       |
|:--------------------------|:--------------------------------------------------------------------------------------------------|
| `init()`                  | Initializes the overlay with the given options.                                                   |
| `toggle()`                | Toggles the animation state between opened and closed. Returns a Promise.                         |
| `entry()`                 | Sets the animation state to open. Returns a Promise that resolves when the animation completes.   |
| `leave()`                 | Sets the animation state to closed. Returns a Promise that resolves when the animation completes. |
| `totalDuration()`         | Returns the total duration of the animation in milliseconds.                                      |
| `stopTimelineIfActive()`  | Stops the current animation timeline if active. Useful for cancelling or resetting animations.    |
| `destroy()`               | Destroys the overlay instance, cleaning up any created elements and animations.                   |
<br>

&#10148; **License**
overlay-morph is released under MIT license.
