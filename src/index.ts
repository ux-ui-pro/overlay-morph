import { gsap } from 'gsap';

export interface OverlayMorphOptions {
  svgEl: string | SVGElement;
  pathEl: string;
  numberPoints?: number;
  delayPoints?: number;
  delayPaths?: number;
  duration?: number;
  ease?: string;
  isOpened?: boolean;
  mobilePointsCap?: number;
  precision?: number;
  lutSamples?: number;
  useLUT?: boolean;
  renderStride?: number;
}

type EaseFn = (t: number) => number;

const MOBILE_MEDIA = '(max-width: 991px)';

const DEFAULTS = {
  delayPoints: 0.3,
  delayPaths: 0.25,
  duration: 1,
  ease: 'none',
} satisfies Required<Pick<OverlayMorphOptions, 'delayPoints' | 'delayPaths' | 'duration' | 'ease'>>;

const PCT_MAX = 100;
const PCT10_MAX = 1000;

const isIOSPlatform = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const ua = navigator.userAgent;

  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in window);
};

const y10ToStr = (v10: number): string =>
  v10 % 10 === 0 ? String(v10 / 10) : (v10 / 10).toFixed(1);

export default class OverlayMorph {
  private gsap = gsap;

  private svg: SVGElement | null = null;
  private paths: SVGPathElement[] = [];
  private setters: Array<((v: { d: string }) => void) | null> = [];
  private prevD: string[] = [];

  private tl?: gsap.core.Timeline;

  private isOpened: boolean;
  private readonly pointsCount: number;
  private readonly delayPoints: number;
  private readonly delayPaths: number;
  private readonly duration: number;

  private readonly easeFn: EaseFn;

  private progress = 0;
  private pointsDelay: number[] = [];

  private readonly precision: number;
  private readonly snapStep10: number;
  private readonly renderStride: number;
  private frameCounter = 0;

  private readonly useLUT: boolean;
  private readonly lutSamples: number;
  private easeLUT: Float32Array = new Float32Array(0);

  constructor(private readonly options: OverlayMorphOptions) {
    const isSmall = typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_MEDIA).matches;

    const requested = options.numberPoints ?? (isSmall ? 3 : 4);
    const mobileCap = Math.max(2, (options.mobilePointsCap ?? 3) | 0);
    const clamped = Math.max(2, requested | 0);

    this.pointsCount = isSmall ? Math.min(clamped, mobileCap) : clamped;

    this.delayPoints = options.delayPoints ?? DEFAULTS.delayPoints;
    this.delayPaths = options.delayPaths ?? DEFAULTS.delayPaths;
    this.duration = options.duration ?? DEFAULTS.duration;
    this.isOpened = options.isOpened ?? false;

    const onIOS = isIOSPlatform();

    this.precision = options.precision ?? (onIOS ? 0.2 : 0.1);
    this.snapStep10 = Math.max(1, Math.round(this.precision * 10));
    this.renderStride = Math.max(1, Math.round(options.renderStride ?? 1));
    this.useLUT = options.useLUT ?? onIOS;
    this.lutSamples = Math.max(8, (options.lutSamples ?? 64) | 0);

    const easeName = options.ease ?? DEFAULTS.ease;

    this.easeFn = (this.gsap.parseEase?.(easeName) as EaseFn) ?? ((t: number): number => t);
  }

  public init(): void {
    if (this.tl) this.destroy();

    const { svgEl, pathEl } = this.options;

    const doc: Document | null = typeof document !== 'undefined' ? document : null;

    this.svg =
      typeof svgEl === 'string' ? (doc ? doc.querySelector<SVGElement>(svgEl) : null) : svgEl;

    if (!this.svg) return;

    this.paths = Array.from(this.svg.querySelectorAll<SVGPathElement>(pathEl) ?? []);

    if (!this.paths.length) return;

    this.setters = this.paths.map((el) => {
      const setter = this.gsap.quickSetter(el, 'attr') as (vars: { d: string }) => void;

      return typeof setter === 'function' ? setter : null;
    });

    this.prevD = new Array<string>(this.paths.length).fill('');
    this.tl = this.gsap.timeline({ defaults: { ease: 'none' }, onUpdate: this.render });

    this.randomizePointDelays();

    if (this.useLUT) this.buildEaseLUT();

    this.updateTimeline();
    this.tl.progress(1);
  }

  public entry(): Promise<void> {
    return this.transitionTo(true);
  }

  public leave(): Promise<void> {
    return this.transitionTo(false);
  }

  public toggle(): Promise<void> {
    return this.transitionTo(!this.isOpened);
  }

  public totalDuration(): number {
    return this.tl ? Math.round(this.tl.duration() * 1000) : 0;
  }

  public stopTimelineIfActive(): void {
    if (this.tl?.isActive()) this.tl.kill();
  }

  public destroy(): void {
    if (this.tl) this.tl.eventCallback('onComplete', null);

    this.tl?.kill();
    this.tl = undefined;
    this.paths = [];
    this.setters = [];
    this.prevD = [];
    this.svg = null;
  }

  private transitionTo(opened: boolean): Promise<void> {
    if (!this.tl || this.tl.isActive()) return Promise.resolve();

    this.isOpened = opened;
    this.randomizePointDelays();

    if (this.useLUT) this.buildEaseLUT();

    this.updateTimeline();

    return new Promise<void>((resolve): void => {
      const tl = this.tl!;

      const done = (): void => {
        tl.eventCallback('onComplete', null);

        resolve();
      };

      tl.eventCallback('onComplete', done);
      tl.play(0);
    });
  }

  private randomizePointDelays(): void {
    const frame = 1 / 60;
    const quant = (v: number): number => Math.round(v / frame) * frame;

    const n = this.pointsCount;
    const arr = new Array<number>(n);

    for (let i = 0; i < n; i += 1) {
      arr[i] = quant(Math.random() * this.delayPoints);
    }

    this.pointsDelay = arr;
  }

  private updateTimeline(): void {
    if (!this.tl) return;

    const maxPointDelay = this.pointsDelay.length ? Math.max(...this.pointsDelay) : 0;
    const maxPathDelay = this.delayPaths * Math.max(this.paths.length - 1, 0);
    const total = this.duration + maxPointDelay + maxPathDelay;

    this.progress = 0;
    this.frameCounter = 0;
    this.tl.progress(0).clear();
    this.tl.to(this, { progress: 1, duration: total, ease: 'none' });
  }

  private buildEaseLUT(): void {
    const S = this.lutSamples;

    if (!this.easeFn || S < 8) {
      this.easeLUT = new Float32Array(0);

      return;
    }

    const lut = new Float32Array(S + 1);

    for (let i = 0; i <= S; i += 1) {
      const k = i / S;

      lut[i] = 1 - this.easeFn(k);
    }

    this.easeLUT = lut;
  }

  private easeLUTSample(k: number): number {
    const lut = this.easeLUT;
    const len = lut.length;

    if (len === 0) return 1 - this.easeFn(k);
    if (k <= 0) return lut[0];
    if (k >= 1) return lut[len - 1];

    const f = k * (len - 1);
    const i = f | 0;
    const t = f - i;

    const a = lut[i];
    const b = lut[i + 1 < len ? i + 1 : i];

    return a + (b - a) * t;
  }

  private buildPathFromY10(ys10: number[], opened: boolean): string {
    const step = PCT_MAX / (this.pointsCount - 1);

    let d = opened ? `M 0 0 V ${y10ToStr(ys10[0])} C` : `M 0 ${y10ToStr(ys10[0])} C`;

    for (let j = 0; j < this.pointsCount - 1; j++) {
      const end = (j + 1) * step;
      const ctrl = end - step / 2;

      d +=
        ` ${ctrl} ${y10ToStr(ys10[j])}` +
        ` ${ctrl} ${y10ToStr(ys10[j + 1])}` +
        ` ${end} ${y10ToStr(ys10[j + 1])}`;
    }

    d += opened ? ' V 100 H 0' : ' V 0 H 0';

    return d;
  }

  private render = (): void => {
    if (!this.svg || !this.paths.length || !this.tl) return;

    if (this.renderStride > 1) {
      this.frameCounter++;

      if (this.frameCounter % this.renderStride !== 0) return;
    }

    const totalDur = this.tl.duration();
    const p = this.progress;
    const pathsCount = this.paths.length;
    const snap10 = this.snapStep10;

    for (let i = 0; i < pathsCount; i++) {
      const orderIndex = this.isOpened ? i : pathsCount - 1 - i;
      const pathDelay = this.delayPaths * orderIndex;

      const ys10 = new Array<number>(this.pointsCount);

      for (let j = 0; j < this.pointsCount; j++) {
        const tAbs = p * totalDur - (this.pointsDelay[j] + pathDelay);

        if (tAbs <= 0) {
          ys10[j] = PCT10_MAX;

          continue;
        }

        if (tAbs >= this.duration) {
          ys10[j] = 0;

          continue;
        }

        const k = tAbs / this.duration;
        const easedInv = this.useLUT ? this.easeLUTSample(k) : 1 - this.easeFn(k);

        const raw10 = Math.round(PCT10_MAX * easedInv);

        ys10[j] = Math.round(raw10 / snap10) * snap10;
      }

      const d = this.buildPathFromY10(ys10, this.isOpened);

      if (d !== this.prevD[i]) {
        this.prevD[i] = d;

        const setter = this.setters[i];

        if (setter) setter({ d });
        else this.paths[i].setAttribute('d', d);
      }
    }
  };
}
