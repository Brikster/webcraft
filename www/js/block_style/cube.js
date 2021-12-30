"use strict";

import {DIRECTION, MULTIPLY, QUAD_FLAGS, ROTATE} from '../helpers.js';
import {impl as alea} from "../../vendors/alea.js";
import {BLOCK, NEIGHB_BY_SYM} from "../blocks.js";
import {CubeSym} from "../core/CubeSym.js";
import glMatrix from "../../vendors/gl-matrix-3.3.min.js"

const {mat3} = glMatrix;

const defaultPivot = [0.5, 0.5, 0.5];
const defaultMatrix = mat3.create();

export function pushTransformed(
    vertices, mat, pivot,
    cx, cz, cy,
    x0, z0, y0,
    ux, uz, uy,
    vx, vz, vy,
    c0, c1, c2, c3,
    r, g, b,
    flags
) {
    pivot = pivot || defaultPivot; 
    cx += pivot[0];
    cy += pivot[1];
    cz += pivot[2];
    x0 -= pivot[0];
    y0 -= pivot[1];
    z0 -= pivot[2];

    mat = mat || defaultMatrix,
    vertices.push(
        cx + x0 * mat[0] + y0 * mat[1] + z0 * mat[2],
        cz + x0 * mat[6] + y0 * mat[7] + z0 * mat[8],
        cy + x0 * mat[3] + y0 * mat[4] + z0 * mat[5],

        ux * mat[0] + uy * mat[1] + uz * mat[2],
        ux * mat[6] + uy * mat[7] + uz * mat[8],
        ux * mat[3] + uy * mat[4] + uz * mat[5],

        vx * mat[0] + vy * mat[1] + vz * mat[2],
        vx * mat[6] + vy * mat[7] + vz * mat[8],
        vx * mat[3] + vy * mat[4] + vz * mat[5],

        c0, c1, c2, c3, r, g, b, flags
    );
}

export default class style {

    static getRegInfo() {
        return {
            styles: ['cube', 'default'],
            func: this.func
        };
    }

    // Pushes the vertices necessary for rendering a specific block into the array.
    static func(block, vertices, chunk, x, y, z, neighbours, biome, _unknown, matrix = null, pivot = null, force_tex) {

        if(!block || typeof block == 'undefined' || block.id == BLOCK.AIR.id) {
            return;
        }

        const cardinal_direction    = block.getCardinalDirection();
        let flags                   = 0;
        let sideFlags               = 0;
        let upFlags                 = 0;

        // Texture color multiplier
        let lm = MULTIPLY.COLOR.WHITE;
        if(block.hasTag('mask_biome')) {
            lm = biome.dirt_color; // MULTIPLY.COLOR.GRASS;
            sideFlags = QUAD_FLAGS.MASK_BIOME;
            upFlags = QUAD_FLAGS.MASK_BIOME;
        }

        let DIRECTION_UP        = DIRECTION.UP;
        let DIRECTION_DOWN      = DIRECTION.DOWN;
        let DIRECTION_BACK      = CubeSym.dirAdd(CubeSym.inv(cardinal_direction), DIRECTION.BACK);
        let DIRECTION_RIGHT     = CubeSym.dirAdd(CubeSym.inv(cardinal_direction), DIRECTION.RIGHT);
        let DIRECTION_FORWARD   = CubeSym.dirAdd(CubeSym.inv(cardinal_direction), DIRECTION.FORWARD);
        let DIRECTION_LEFT      = CubeSym.dirAdd(CubeSym.inv(cardinal_direction), DIRECTION.LEFT);

        if(!block.material) {
            console.error('block', JSON.stringify(block), block.id);
            debugger;
        }

        let c;
        let width                   = block.material.width ? block.material.width : 1;
        let height                  = block.material.height ? block.material.height : 1;
        let drawAllSides            = width != 1 || height != 1;

        if(block.material.style == 'ladder') {
            width = 1;
            height = 1;
        }

        if(block.material.tags.indexOf('layering') >= 0) {
            if(block.extra_data) {
                height = block.extra_data?.height || height;
            }
        }

        // Can change height
        let bH = 1.0;
        if(block.material.fluid || [BLOCK.STILL_LAVA.id, BLOCK.STILL_WATER.id].indexOf(block.id) >= 0) {
            bH = Math.min(block.power, .9)
            let blockOver = neighbours.UP;
            if(blockOver) {
                let blockOverIsFluid = (blockOver.material.fluid || [BLOCK.STILL_LAVA.id, BLOCK.STILL_WATER.id].indexOf(blockOver.id) >= 0);
                if(blockOverIsFluid) {
                    bH = 1.0;
                }
            }
            block.bH = bH;
        }

        // Убираем шапку травы с дерна, если над ним есть непрозрачный блок
        if([BLOCK.DIRT.id, BLOCK.DIRT_PATH.id, BLOCK.SNOW_DIRT.id].indexOf(block.id) >= 0) {
            if(neighbours.UP && (!neighbours.UP.material.transparent || neighbours.UP.material.is_fluid || [BLOCK.DIRT_PATH.id].indexOf(neighbours.UP.id) >= 0)) {
                DIRECTION_UP        = DIRECTION.DOWN;
                DIRECTION_BACK      = DIRECTION.DOWN;
                DIRECTION_RIGHT     = DIRECTION.DOWN;
                DIRECTION_FORWARD   = DIRECTION.DOWN;
                DIRECTION_LEFT      = DIRECTION.DOWN;
                sideFlags = 0;
                height = 1;
                upFlags = 0;
            }
        }

        let canDrawFace = (neighbourBlock) => {
            let resp = drawAllSides || !neighbourBlock || neighbourBlock.material.transparent;
            if(resp && neighbourBlock) {
                if(block.id == neighbourBlock.id && block.material.selflit) {
                    resp = false;
                }
            }
            return resp;
        };

        // getAnimations...
        let getAnimations = (side) => {
            if(!block.material.texture_animations) {
                return 1;
            }
            if(side in block.material.texture_animations) {
                return block.material.texture_animations[side];
            } else if('side' in block.material.texture_animations) {
                return block.material.texture_animations['side'];
            }
            return 1;
        };

        // Top
        if(canDrawFace(neighbours.UP) || bH < 1) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_UP);
            let top_vectors = [1, 0, 0, 0, 1, 0];
            // Поворот текстуры травы в случайном направлении (для избегания эффекта мозаичности поверхности)
            if(block.id == BLOCK.DIRT.id) {
                let a = new alea([x, y, z].join('x'));
                a = a.int32();
                if(a < 0) a = -a;
                let rv = a % 4;
                switch(rv) {
                    case 0: {
                        top_vectors = [0, -1, 0, 1, 0, 0];
                        break;
                    }
                    case 1: {
                        top_vectors = [-1, 0, 0, 0, -1, 0];
                        break;
                    }
                    case 2: {
                        top_vectors = [0, 1, 0, -1, 0, 0];
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }

            let animations_up = getAnimations('up');

            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                .5, 0.5, bH - 1 + height,
                ...top_vectors,
                c[0], c[1], -c[2], c[3],
                lm.r, lm.g, animations_up, flags | upFlags
            );

            if(block.material.is_fluid && block.material.transparent) {
                top_vectors = [
                    1, 0, 0,
                    0, -1, 0
                ];
                pushTransformed(
                    vertices, matrix, pivot,
                    x, z, y,
                    .5, 0.5, bH - 1 + height,
                    ...top_vectors,
                        c[0], c[1], -c[2], c[3],
                    lm.r, lm.g, animations_up, flags | upFlags);
            }
        }

        // Bottom
        if(canDrawFace(neighbours.DOWN)) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_DOWN);
            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                0.5, 0.5, 0,
                1, 0, 0,
                0, -1, 0,
                c[0], c[1], -c[2], c[3],
                lm.r, lm.g, lm.b, flags);
        }

        const H = (bH - 1 + height);

        // South | Front/Forward
        if(canDrawFace(neighbours.SOUTH)) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_BACK, null, H);
            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                .5, .5 - width / 2, H / 2,
                1, 0, 0,
                0, 0, H,
                c[0], c[1], c[2], -c[3],
                lm.r, lm.g, lm.b, flags | sideFlags);
        }

        // North
        if(canDrawFace(neighbours.NORTH)) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_FORWARD, null, H);
            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                .5, .5 + width / 2, H / 2,
                1, 0, 0,
                0, 0, -H,
                c[0], c[1], -c[2], c[3],
                lm.r, lm.g, lm.b, flags | sideFlags);
        }

        // West
        if(canDrawFace(neighbours.WEST)) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_LEFT, null, H);
            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                .5 - width / 2, .5, H / 2,
                0, 1, 0,
                0, 0, -H,
                c[0], c[1], -c[2], c[3],
                lm.r, lm.g, lm.b, flags | sideFlags);
        }

        // East
        if(canDrawFace(neighbours.EAST)) {
            c = force_tex || BLOCK.calcMaterialTexture(block.material, DIRECTION_RIGHT, null, H);
            pushTransformed(
                vertices, matrix, pivot,
                x, z, y,
                .5 + width / 2, .5, H / 2,
                0, 1, 0,
                0, 0, H,
                c[0], c[1], c[2], -c[3],
                lm.r, lm.g, lm.b, flags | sideFlags);
        }

    }

}