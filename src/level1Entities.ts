import { IEntity } from './entity/Entity'

// We give entities a value out of 100. 100 being full screen width/height.
export const entities: IEntity[] = [
  {
    name: 'skyscraper',
    x: 50,
    y: 100,
    width: 10,
    height: 20,
    color: 'red',
    isPlatform: true,
    texture: 'texture_building',
  },
  {
    name: 'skyscraper2',
    x: 10,
    y: 50,
    width: 10,
    height: 20,
    color: 'blue',
    isPlatform: false,
    texture: 'texture_building',
  },
]
