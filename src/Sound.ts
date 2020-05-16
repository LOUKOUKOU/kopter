export default class Sound {

  private audioObject: HTMLAudioElement;

  private loop: boolean;
  private playOnce: boolean;
  private timesPlayed: number = 0;
  private src: string;
  private playPromise?: Promise<void>;

  public constructor(src: string, loop: boolean, playOnce = true) {
    this.src = src
    this.loop = loop
    this.playOnce = playOnce
    this.audioObject = new Audio(this.src);
    this.audioObject.loop = this.loop
  }

  public pause() {
    this.audioObject.pause();
    this.timesPlayed = 0
  }

  public play() {
    if ((this.playOnce && this.timesPlayed < 1) || !this.playOnce) {
      this.playPromise = this.audioObject.play();
      if (this.playPromise !== undefined) {
        this.playPromise.catch((error) => {
          console.log(`playSound error: ${error}`);
        });
      }
      this.timesPlayed++
    }
  }
}
