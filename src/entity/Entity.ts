export interface IEntity {
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  isPlatform: boolean
  texture?: string
}

export default class Entity implements IEntity {
  public name: string
  public x: number
  public y: number
  public width: number
  public height: number
  public color: string
  public isPlatform: boolean
  public texture?: string

  public constructor(data: IEntity) {
    this.name = data.name
    this.x = data.x
    this.y = data.y
    this.width = data.width
    this.height = data.height
    this.color = data.color
    this.isPlatform = data.isPlatform
    this.texture = data.texture
  }
}
