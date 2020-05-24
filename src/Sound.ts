import { Howl, Howler } from 'howler';

export default class Sound {

  private audioObject: Howl;

  private loop: boolean;
  private playOnce: boolean;
  private timesPlayed: number = 0;
  private src: string;

  public constructor(src: string, loop: boolean, playOnce = true, volume = 1.0) {
    this.src = src
    this.loop = loop
    this.playOnce = playOnce
    this.audioObject = new Howl({
      loop: this.loop,
      volume: volume,
      src: [this.src]
    })
  }

  public pause() {
    this.audioObject.pause();
    this.timesPlayed = 0
  }

  public play() {
    if ((this.playOnce && this.timesPlayed < 1) || !this.playOnce) {
      this.audioObject.play();
      this.timesPlayed++
    }
  }
}
