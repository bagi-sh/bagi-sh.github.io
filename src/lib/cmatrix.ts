export interface MatrixOptions {
  fontSize?: number;
  speed?: number;
  density?: number;
  color?: string;
  characters?: string;
}

export class CMatrixBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  private fontSize: number;
  private speed: number;
  private density: number;
  private color: string;
  private characters: string;

  private columns: number = 0;
  private drops: number[] = [];
  private frameCounter: number = 0;

  constructor(canvas: HTMLCanvasElement, options: MatrixOptions = {}) {
    this.canvas = canvas;
    const context = this.canvas.getContext("2d");

    if (!context) {
      throw new Error("Erro ao obter contexto 2D");
    }
    this.ctx = context;

    this.fontSize = options.fontSize ?? 12;
    this.speed = options.speed ?? 3;
    this.density = options.density ?? 0.5;
    this.color = options.color ?? "#00ff66";
    this.characters =
      options.characters ??
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}[]<>/*=+:;";

    this.init();
    window.addEventListener("resize", this.handleResize);
  }

  private init = (): void => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.columns = Math.floor(
      (this.canvas.width / this.fontSize) * this.density,
    );
    this.drops = new Array(this.columns);
    for (let i = 0; i < this.columns; i++) {
      this.drops[i] = Math.floor(Math.random() * -100);
    }
  };

  private handleResize = (): void => {
    this.init();
  };

  private draw = (): void => {
    this.frameCounter++;
    if (this.frameCounter % this.speed !== 0) {
      this.animationFrameId = requestAnimationFrame(this.draw);
      return;
    }

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = this.color;
    this.ctx.font = `${this.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const charIndex = Math.floor(Math.random() * this.characters.length);
      const text = this.characters.charAt(charIndex);

      const x = (i * this.fontSize) / this.density;
      const y = this.drops[i] * this.fontSize;

      this.ctx.fillText(text, x, y);

      if (y > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }

      this.drops[i]++;
    }

    this.animationFrameId = requestAnimationFrame(this.draw);
  };

  public start(): void {
    if (!this.animationFrameId) {
      this.draw();
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
  }
}
