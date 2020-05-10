import Entity, { IEntity } from './Entity';

export default class Bullet extends Entity {

    public ySpeed: number
    public xSpeed: number
    public constructor(data: IBullet) {
        const { ySpeed, xSpeed, ...entity } = data;
        super(entity)
        this.ySpeed = data.ySpeed
        this.xSpeed = data.xSpeed
    }
}

export interface IBullet extends IEntity {
    xSpeed: number;
    ySpeed: number;
}
