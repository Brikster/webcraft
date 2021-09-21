import {DIRECTION, MULTIPLY, NORMALS, ROTATE, TX_CNT} from '../helpers.js';
import { default as push_plane_style } from './plane.js';

const push_plane = push_plane_style.getRegInfo().func;

// Треугольники
export default class style {

    static getRegInfo() {
        return {
            styles: ['triangle'],
            func: this.func
        };
    }

    static func(block, vertices, chunk, lightmap, x, y, z, neighbours) {

        const half          = 0.5 / TX_CNT;
        let poses           = [];
        let texture         = BLOCK.fromId(block.id).texture;
        let lm              = MULTIPLY.COLOR.WHITE;
        let ao              = [0, 0, 0, 0];

        block.transparent   = true;

        // полная текстура
        let c = BLOCK.calcTexture(texture, DIRECTION.UP);

        // нижняя половина текстуры
        let c_half_bottom = [
            c[0],
            c[1],// + half/2,
            c[2],
            c[3],// - half,
        ];

        const cardinal_direction = BLOCK.getCardinalDirection(block.rotate).z;
        let on_ceil = block.extra_data && block.extra_data.point.y >= .5; // на верхней части блока (перевернутая ступенька)

        let yt = y + 1;
        let yb = y;
        if(on_ceil) {
            //yt -= .5;
            //yb += .5;
        }

        let n = 0;

        // Нижний слэб

        // South - стенка 1
        push_plane(vertices, x, yb, z - 0.5, c_half_bottom, lm, ao, true, false, null, .5, null);

        // North - стенка 2
        push_plane(vertices, x, yb, z + 0.5, c_half_bottom, lm, ao, true, false, null, .5, null);

        // East - стенка 3
        push_plane(vertices, x + 0.5, yb, z, c_half_bottom, lm, ao, false, false, null, 1, null);

        // West - стенка 4
        vertices.push(x + 1/2, y + 1/2, z + 1/2,
            1, 1, 0,
            0, 0, -1,
            ...c,
            lm.r, lm.g, lm.b,
            ...ao, null);

        c = BLOCK.calcTexture(texture, DIRECTION.DOWN);

        // дно
        n = NORMALS.DOWN;
        vertices.push(x + .5, z + .5, yb,
            1, 0, 0,
            0, -1, 0,
            c[0], c[1], c[2], -c[3],
            lm.r, lm.g, lm.b,
            ...ao, 0);

        // поверхность нижней ступени
        const bH = 1;

        //
        let checkIfSame = (b) => {
            return b && b.tags && b.tags.indexOf('triangle') >= 0;
        };
        //
        let compareCD = (b) => {
            return checkIfSame(b) && BLOCK.getCardinalDirection(b.rotate).z == cardinal_direction;
        };

        // F R B L
        switch(cardinal_direction) {
            case ROTATE.S: {
                poses = [
                    new Vector(0, yt, .5),
                    new Vector(-.5, yt, .5),
                ];
                // удаление лишних
                if(!(checkIfSame(neighbours.WEST) && checkIfSame(neighbours.EAST)) && checkIfSame(neighbours.NORTH)) {
                    if(compareCD(neighbours.WEST)) {
                        poses.shift();
                    } else if(compareCD(neighbours.EAST)) {
                        poses.pop();
                    }
                }
                // добавление недостающих
                if(checkIfSame(neighbours.SOUTH)) {
                    let cd = BLOCK.getCardinalDirection(neighbours.SOUTH.rotate).z;
                    if(cd == ROTATE.W) {
                        poses.push(new Vector(0, yt, 0));
                    } else if(cd == ROTATE.E) {
                        poses.push(new Vector(-.5, yt, 0));
                    }
                }
                break;
            }
            case ROTATE.W: {
                poses = [
                    new Vector(0, yt, 0),
                    new Vector(0, yt, .5),
                ];
                // удаление лишних
                if(!(checkIfSame(neighbours.NORTH) && checkIfSame(neighbours.SOUTH)) && checkIfSame(neighbours.EAST)) {
                    if(compareCD(neighbours.NORTH)) {
                        poses.shift();
                    } else if(compareCD(neighbours.SOUTH)) {
                        poses.pop();
                    }
                }
                // добавление недостающих
                if(checkIfSame(neighbours.WEST)) {
                    let cd = BLOCK.getCardinalDirection(neighbours.WEST.rotate).z;
                    if(cd == ROTATE.S) {
                        poses.push(new Vector(-.5, yt, .5));
                    } else if(cd == ROTATE.N) {
                        poses.push(new Vector(-.5, yt, 0));
                    }
                }
                break;
            }
            case ROTATE.N: {
                poses = [
                    new Vector(0, yt, 0),
                    new Vector(-.5, yt, 0),
                ];
                // удаление лишних
                if(!(checkIfSame(neighbours.WEST) && checkIfSame(neighbours.EAST)) && checkIfSame(neighbours.SOUTH)) {
                    if(compareCD(neighbours.WEST)) {
                        poses.shift();
                    } else if(compareCD(neighbours.EAST)) {
                        poses.pop();
                    }
                }
                // добавление недостающих
                if(checkIfSame(neighbours.NORTH)) {
                    let cd = BLOCK.getCardinalDirection(neighbours.NORTH.rotate).z;
                    if(cd == ROTATE.E) {
                        poses.push(new Vector(-.5, yt, .5));
                    } else if(cd == ROTATE.W || cd == ROTATE.N) {
                        poses.push(new Vector(0, yt, .5));
                    }
                }
                break;
            }
            case ROTATE.E: {
                poses = [
                    new Vector(-.5, yt, 0),
                    new Vector(-.5, yt, .5),
                ];
                // удаление лишних
                if(!(checkIfSame(neighbours.NORTH) && checkIfSame(neighbours.SOUTH)) && checkIfSame(neighbours.WEST)) {
                    if(compareCD(neighbours.NORTH)) {
                        poses.shift();
                    } else if(compareCD(neighbours.SOUTH)) {
                        poses.pop();
                    }
                }
                // добавление недостающих
                if(checkIfSame(neighbours.EAST)) {
                    let cd = BLOCK.getCardinalDirection(neighbours.EAST.rotate).z;
                    if(cd == ROTATE.S) {
                        poses.push(new Vector(0, yt, .5));
                    } else if(cd == ROTATE.N) {
                        poses.push(new Vector(0, yt, 0));
                    }
                }
                break;
            }
        }

    }

}