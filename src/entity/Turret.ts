import Entity, { type IEntity } from './Entity'

export default class Turret extends Entity {
  public rateOfFire: number // how many bullets per minute
  public burst: boolean

  public constructor(data: ITurret) {
    const { rateOfFire, burst, ...entity } = data
    super(entity)
    this.rateOfFire = data.rateOfFire
    this.burst = data.burst
  }
}

export interface ITurret extends IEntity {
  rateOfFire: number
  burst: boolean
}
