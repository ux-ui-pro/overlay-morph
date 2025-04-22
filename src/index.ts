import { gsap } from 'gsap';

export interface OverlayMorphOptions {
  svgEl: string;
  pathEl: string;
  numberPoints?: number;
  delayPoints?: number;
  delayPaths?: number;
  duration?: number;
  ease?: string;
  isOpened?: boolean;
}

export default class OverlayMorph {
  static #gsap: typeof gsap = gsap;

  public static registerGSAP(gsapInstance: typeof gsap): void {
    OverlayMorph.#gsap = gsapInstance;
  }

  #gsapInstance: typeof gsap = OverlayMorph.#gsap;
  #svg: SVGElement | null = null;
  #path: SVGPathElement[] = [];
  #pointsDelay: number[] = [];
  #allPoints: number[][] = [];
  #tl?: gsap.core.Timeline;
  #initClass = '';
  #isOpened: boolean;

  readonly #numberPoints: number;
  readonly #delayPoints: number;
  readonly #delayPaths: number;
  readonly #duration: number;
  readonly #ease: string;
  readonly #options: OverlayMorphOptions;

  constructor(options: OverlayMorphOptions) {
    this.#options = options;
    this.#numberPoints = options.numberPoints ?? 4;
    this.#delayPoints = options.delayPoints ?? 0.3;
    this.#delayPaths = options.delayPaths ?? 0.25;
    this.#duration = options.duration ?? 1;
    this.#ease = options.ease ?? 'none';
    this.#isOpened = options.isOpened ?? false;
  }

  public init(): void {
    const { svgEl, pathEl, isOpened = false } = this.#options;

    if (!OverlayMorph.#gsap) {
      OverlayMorph.#gsap = (window as { gsap?: typeof gsap }).gsap!;
    }

    this.#gsapInstance = OverlayMorph.#gsap;
    this.#svg = typeof svgEl === 'string' ? document.querySelector<SVGElement>(svgEl) : svgEl;

    if (this.#svg) {
      this.#path = Array.from(this.#svg.querySelectorAll<SVGPathElement>(pathEl) ?? []);
      this.#initClass = svgEl.replace(/\./g, '') + '--initialize';
      this.#svg.classList.add(this.#initClass);
    }

    this.#pointsDelay = [];
    this.#allPoints = [];

    this.#tl = this.#gsapInstance.timeline({
      onUpdate: this.#render,
      defaults: {
        ease: this.#ease,
        duration: this.#duration,
      },
    });

    if (this.#svg) {
      this.#initializePaths();
      this.#isOpened = isOpened;
      this.#update();
      this.#tl.progress(1);
    }
  }

  #initializePaths(): void {
    this.#allPoints = this.#path.map(() => new Array<number>(this.#numberPoints).fill(100));
  }

  #render = (): void => {
    this.#path.forEach((pathEl, i) => {
      const points = this.#allPoints[i];
      let d = this.#isOpened ? `M 0 0 V ${points[0]} C` : `M 0 ${points[0]} C`;

      for (let j = 0; j < this.#numberPoints - 1; j += 1) {
        const p = ((j + 1) / (this.#numberPoints - 1)) * 100;
        const cp = p - ((1 / (this.#numberPoints - 1)) * 100) / 2;
        d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
      }

      d += this.#isOpened ? ' V 100 H 0' : ' V 0 H 0';
      pathEl.setAttribute('d', d);
    });
  };

  #update(): void {
    if (!this.#tl) return;

    this.#tl.progress(0).clear();

    this.#pointsDelay = Array.from(
      { length: this.#numberPoints },
      () => Math.random() * this.#delayPoints,
    );

    this.#allPoints.forEach((points, i) => {
      const pathDelay = this.#delayPaths * (this.#isOpened ? i : this.#path.length - i - 1);

      this.#pointsDelay.forEach((delay, j) => {
        this.#tl?.to(points, { [j]: 0 }, delay + pathDelay);
      });
    });
  }

  #playWithPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.#tl?.eventCallback('onComplete', () => resolve());
      this.#tl?.play(0);
    });
  }

  public entry(): Promise<void> {
    if (!this.#tl || this.#tl.isActive()) return Promise.resolve();

    this.#isOpened = true;
    this.#update();
    return this.#playWithPromise();
  }

  public leave(): Promise<void> {
    if (!this.#tl || this.#tl.isActive()) return Promise.resolve();

    this.#isOpened = false;
    this.#update();
    return this.#playWithPromise();
  }

  public toggle(): Promise<void> {
    if (!this.#tl || this.#tl.isActive()) return Promise.resolve();

    this.#isOpened = !this.#isOpened;
    this.#update();
    return this.#playWithPromise();
  }

  public totalDuration(): number {
    return this.#tl ? Math.round(this.#tl.totalDuration() * 1000) : 0;
  }

  public destroy(): void {
    if (this.#tl) {
      this.#gsapInstance.killTweensOf([this.#tl]);
      this.#tl.kill();
    }

    if (this.#svg && this.#initClass) {
      this.#svg.classList.remove(this.#initClass);
    }

    this.#svg = null;
    this.#path = [];
    this.#pointsDelay = [];
    this.#allPoints = [];
  }
}
