// We give entities a value out of 100. 100 being full screen width/height.
export const level1Config = {
    platforms: [
        {
            name: 'skyscraper',
            x: 50,
            y: 100,
            width: 10,
            height: 20,
            color: 'red',
            isPlatform: true,
            texture: 'texture_building'
        },
        {
            name: 'skyscraper2',
            x: 10,
            y: 50,
            width: 10,
            height: 20,
            color: 'blue',
            isPlatform: false,
            texture: 'texture_building'
        }
    ],
    turrets: [
        {
            name: 'bullet',
            x: 12,
            y: 30,
            width: 3,
            height: 6,
            color: 'grey',
            isPlatform: true,
            rateOfFire: 100,
            burst: false
        }
    ],
    kopter: {

    }
}