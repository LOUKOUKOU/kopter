export default class Animator {

  private frameWidth: number;
  private frameHeight: number;
  private CurrentFrame: number = 0;
  private frameDirection: number = 1;
  private totalFrames: number;
  private image: HTMLImageElement;
  private context: CanvasRenderingContext2D;

  public constructor(
    frameWidth: number,
    frameHeight: number,
    frames: number,
    image: HTMLImageElement,
    context: CanvasRenderingContext2D) {

    this.totalFrames = frames
    this.image = image
    this.context = context
    this.frameWidth = frameWidth
    this.frameHeight = frameHeight
  }

  public nextFrame(entity: any, level: number) {
    this.context.drawImage(
      this.image,
      this.frameWidth * this.CurrentFrame,
      level * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      entity.x,
      entity.y,
      entity.width,
      entity.height
    )
    this.itterate()
  }

  private itterate() {
    if (
      this.CurrentFrame + this.frameDirection === this.totalFrames ||
      this.CurrentFrame + this.frameDirection === 0) {
      this.frameDirection *= -1;
    }

    this.CurrentFrame += this.frameDirection
  }
}
