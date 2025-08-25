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
}

type EaseFn = (t: number) => number;

export type AttrSetter = (v: { d: string }) => void;

const DEFAULTS = {
  delayPoints: 0.3,
  delayPaths: 0.25,
  duration: 1,
  ease: 'none',
} as const;

const INIT_CLASS_SUFFIX = '--initialize';

const linearEase: EaseFn = (t: number): number => t;

function safeParseEase(g: typeof gsap, ease: string): EaseFn {
  type GsapWithParse = typeof gsap & { parseEase?: (e: string) => EaseFn };

  const parse = (g as GsapWithParse).parseEase;

  if (typeof parse === 'function') {
    try {
      const fn = parse(ease);
      if (typeof fn === 'function') return fn;
    } catch {}
  }

  return linearEase;
}

export function applyPlatformPerfTweaks(g: typeof gsap = gsap): void {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;

  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in window);

  if (isIOS) g.ticker.lagSmoothing(0);
  else g.ticker.lagSmoothing(500, 33);

  g.ticker.fps(30);
}

export default class OverlayMorph {
  private static gsapNS: typeof gsap = gsap;

  public static registerGSAP(gsapInstance: typeof gsap): void {
    OverlayMorph.gsapNS = gsapInstance;
  }

  private gsapInstance: typeof gsap = OverlayMorph.gsapNS;

  private svg: SVGElement | null = null;
  private paths: SVGPathElement[] = [];
  private attrSetters: AttrSetter[] = [];
  private initClass = '';

  private isOpened: boolean;
  private allPoints: number[][] = [];
  private pointsDelay: number[] = [];
  private p: number[] = [];
  private cp: number[] = [];
  private tl?: gsap.core.Timeline;

  private readonly numberPoints: number;
  private readonly delayPoints: number;
  private readonly delayPaths: number;
  private readonly duration: number;
  private readonly ease: string;
  private readonly options: OverlayMorphOptions;

  private progress = 0;
  private total = 0;
  private easeFn: EaseFn = linearEase;

  constructor(options: OverlayMorphOptions) {
    this.options = options;

    const isSmallScreen =
      typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;
    const mobileCap = options.mobilePointsCap ?? 4;
    const requested = options.numberPoints ?? (isSmallScreen ? 3 : 4);
    const clamped = Math.max(2, requested);

    this.numberPoints = isSmallScreen ? Math.min(clamped, mobileCap) : clamped;

    this.delayPoints = options.delayPoints ?? DEFAULTS.delayPoints;
    this.delayPaths = options.delayPaths ?? DEFAULTS.delayPaths;
    this.duration = options.duration ?? DEFAULTS.duration;
    this.ease = options.ease ?? DEFAULTS.ease;
    this.isOpened = options.isOpened ?? false;
  }

  public init(): void {
    const { svgEl, pathEl, isOpened = false } = this.options;

    if (!OverlayMorph.gsapNS && typeof window !== 'undefined') {
      OverlayMorph.gsapNS = (window as Window & { gsap?: typeof gsap }).gsap!;
    }

    this.gsapInstance = OverlayMorph.gsapNS;

    applyPlatformPerfTweaks(this.gsapInstance);

    this.svg = typeof svgEl === 'string' ? document.querySelector<SVGElement>(svgEl) : svgEl;

    if (this.svg) {
      this.paths = Array.from(this.svg.querySelectorAll<SVGPathElement>(pathEl) ?? []);

      const baseClass =
        typeof svgEl === 'string'
          ? svgEl.replace(/\./g, '')
          : (this.svg.classList[0] ?? 'overlay-svg');

      this.initClass = `${baseClass}${INIT_CLASS_SUFFIX}`;
      this.svg.classList.add(this.initClass);
    }

    this.pointsDelay = [];
    this.allPoints = [];

    this.tl = this.gsapInstance.timeline({ onUpdate: this.render, defaults: { ease: 'none' } });

    if (this.svg && this.paths.length > 0) {
      this.initializePaths();
      this.isOpened = isOpened;
      this.updateTimeline();
      this.tl.progress(1);
    }
  }

  public async entry(): Promise<void> {
    if (!this.tl || this.tl.isActive()) return;

    this.isOpened = true;
    this.resetAllPointsTo(100);
    this.updateTimeline();

    await this.playTimeline();
  }

  public async leave(): Promise<void> {
    if (!this.tl || this.tl.isActive()) return;

    this.isOpened = false;
    this.resetAllPointsTo(100);
    this.updateTimeline();

    await this.playTimeline();
  }

  public async toggle(): Promise<void> {
    if (!this.tl || this.tl.isActive()) return;

    this.isOpened = !this.isOpened;
    this.resetAllPointsTo(100);
    this.updateTimeline();

    await this.playTimeline();
  }

  public totalDuration(): number {
    return this.tl ? Math.round(this.total * 1000) : 0;
  }

  public stopTimelineIfActive(): void {
    if (this.tl?.isActive()) this.tl.kill();
  }

  public destroy(): void {
    if (this.tl) {
      this.gsapInstance.killTweensOf([this.tl]);
      this.tl.kill();
    }

    if (this.svg && this.initClass) this.svg.classList.remove(this.initClass);

    this.svg = null;
    this.paths = [];
    this.pointsDelay = [];
    this.allPoints = [];
    this.attrSetters = [];
    this.tl = undefined;
  }

  private initializePaths(): void {
    this.allPoints = this.paths.map(() => new Array<number>(this.numberPoints).fill(100));

    this.computeSegments();

    this.attrSetters = this.paths.map((el) => {
      return this.gsapInstance.quickSetter(el, 'attr') as unknown as AttrSetter;
    });
  }

  private computeSegments(): void {
    this.p = [];
    this.cp = [];

    const step = 100 / (this.numberPoints - 1);

    for (let j = 0; j < this.numberPoints - 1; j += 1) {
      const end = (j + 1) * step;
      const ctrl = end - step / 2;

      this.p.push(end);
      this.cp.push(ctrl);
    }
  }

  private round1(n: number): number {
    return Math.round(n * 10) / 10;
  }

  private buildPath(points: number[], opened: boolean): string {
    const parts: string[] = [];
    const p0 = this.round1(points[0]);

    parts.push(opened ? `M 0 0 V ${p0} C` : `M 0 ${p0} C`);

    for (let j = 0; j < this.numberPoints - 1; j += 1) {
      const y1 = this.round1(points[j]);
      const y2 = this.round1(points[j + 1]);

      parts.push(` ${this.cp[j]} ${y1} ${this.cp[j]} ${y2} ${this.p[j]} ${y2}`);
    }

    parts.push(opened ? ' V 100 H 0' : ' V 0 H 0');

    return parts.join('');
  }

  private render = (): void => {
    if (!this.svg || !this.paths.length) return;

    const pathsCount = this.paths.length;

    for (let i = 0; i < pathsCount; i += 1) {
      const orderIndex = this.isOpened ? i : pathsCount - i - 1;
      const pathDelay = this.delayPaths * orderIndex;

      const points = this.allPoints[i];

      for (let j = 0; j < this.numberPoints; j += 1) {
        const start = this.pointsDelay[j] + pathDelay;
        const tAbs = this.progress * this.total - start;

        let y = 100;

        if (tAbs >= 0) {
          if (tAbs >= this.duration) y = 0;
          else {
            const k = tAbs / this.duration;
            y = 100 * (1 - this.easeFn(k));
          }
        }

        points[j] = y;
      }

      const d = this.buildPath(points, this.isOpened);

      this.attrSetters[i]?.({ d });
    }
  };

  private updateTimeline(): void {
    if (!this.tl) return;

    this.progress = 0;
    this.tl.progress(0).clear();

    this.pointsDelay = Array.from(
      { length: this.numberPoints },
      () => Math.random() * this.delayPoints,
    );

    const pathsCount = this.paths.length;
    const maxPathDelay = this.delayPaths * (pathsCount - 1);
    const maxPointDelay = this.pointsDelay.length ? Math.max(...this.pointsDelay) : 0;

    this.total = this.duration + maxPathDelay + maxPointDelay;

    this.easeFn = safeParseEase(this.gsapInstance, this.ease);

    this.tl.to(this, { progress: 1, duration: this.total, ease: 'none' });
  }

  private async playTimeline(): Promise<void> {
    if (!this.tl) return;

    await new Promise<void>((resolve): void => {
      this.tl!.eventCallback('onComplete', () => resolve());
      this.tl!.play(0);
    });
  }

  private resetAllPointsTo(value: number): void {
    for (let i = 0; i < this.allPoints.length; i += 1) {
      const arr = this.allPoints[i];

      for (let j = 0; j < arr.length; j += 1) arr[j] = value;
    }
  }
}
