import {Color, Vector, DIRECTION_BIT} from '../../helpers.js';
import {MineGenerator} from './mine_generator.js';
import { Default_Terrain_Generator } from '../default.js';
import {BLOCK} from '../../blocks.js';

export default class MineGenerator2 extends Default_Terrain_Generator {

    constructor(seed, world_id, options) {
        super(seed, world_id, options);
        this.setSeed(0);
        this.mine = new MineGenerator(this, new Vector(22, 0, 22), {chance_hal: 0.2});
    }

    async init() {}
    
    generate(chunk) {
        if(chunk.addr.y == 0) {
            for(let x = 0; x < chunk.size.x; x++) {
                for(let z = 0; z < chunk.size.z; z++) {
                    for(let y = 0; y <= 6; y++) {
                        this.setBlock(chunk, x, y, z, BLOCK.GRASS_BLOCK);
                    }
                }
            }
        }
        
        this.mine.fillBlocks(chunk);

        const cell = {dirt_color: new Color(850 / 1024, 930 / 1024, 0, 0), biome: {
            code: 'Flat'
        }};

        let addr = chunk.addr;
        let size = chunk.size;

        return {
            id:     [addr.x, addr.y, addr.z, size.x, size.y, size.z].join('_'),
            blocks: {},
            seed:   chunk.seed,
            addr:   addr,
            size:   size,
            coord:  addr.mul(size),
            cells:  Array(chunk.size.x * chunk.size.z).fill(cell),
            options: {
                WATER_LINE: 63, // Ватер-линия
            }
        };

    }
}