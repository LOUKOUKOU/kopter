export class ScaledValues implements IScaledValues {
    constructor(
        public canvasWidth: number,
        public canvasHeight: number
    ) { }

    public getX(x: number) {
        return (x / 100) * this.canvasWidth
    }

    public getWidth(width: number) {
        return (width / 100) * this.canvasWidth
    }

    public getY(y: number, scaledHeight: number) {
        return (y / 100) * this.canvasHeight - scaledHeight
    }

    public getHeight(height: number) {
        return (height / 100) * this.canvasHeight
    }
}

export interface IScaledValues {
    getX: (arg0: number) => number;
    getWidth: (arg0: number) => number;
    getY: (arg0: number, arg1: number) => number;
    getHeight: (arg0: number) => number;
    canvasWidth: number;
    canvasHeight: number;
}