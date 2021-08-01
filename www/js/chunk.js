// Creates a new chunk
function Chunk(chunkManager, pos, modify_list) {

    // info
    this.key = chunkManager.getPosChunkKey(pos);
    this.modify_list = modify_list;

    // размеры чанка
    this.size = new Vector(
        CHUNK_SIZE_X,
        CHUNK_SIZE_Y,
        CHUNK_SIZE_Z
    );

    // относительные координаты чанка
    this.addr = new Vector(
        pos.x,
        pos.y,
        pos.z
    );
    this.coord = new Vector(
        this.addr.x * CHUNK_SIZE_X,
        this.addr.y * CHUNK_SIZE_Y,
        this.addr.z * CHUNK_SIZE_Z
    );

    this.seed = chunkManager.world.seed;

    this.id = [
        // chunkManager.world.seed,
        this.addr.x,
        this.addr.y,
        this.addr.z,
        this.size.x,
        this.size.y,
        this.size.z
    ].join('_');

    // Run webworker method
    chunkManager.postWorkerMessage(['createChunk', Object.assign(this, {shift: Object.assign({}, Game.shift)})]);

    // this.worker_pn_generate = performance.now();

    // Objects
    this.chunkManager               = chunkManager;
    this.world                      = this.chunkManager.world;

    // Variables
    this.inited                     = false;
    this.dirty                      = true;
    this.buildVerticesInProgress    = false;
    this.vertices_length            = 0;
    this.vertices                   = {};
    this.vertices_transparent       = [];
    this.fluid_blocks               = [];
    this.gravity_blocks             = [];

}

// onBlocksGenerated ... Webworker callback method
Chunk.prototype.onBlocksGenerated = function(args) {
    this.blocks = args.blocks;
    this.inited = true;
}

// doShift
Chunk.prototype.doShift = function(shift) {
    if(this.dirty) {
        return 0;
    }
    if((shift.x - this.shift.x == 0) && (shift.z - this.shift.z == 0)) {
        return 0;
    }
    const x = shift.x - this.shift_orig.x;
    const z = shift.z - this.shift_orig.z;
    this.shift_orig = Object.assign({}, shift);
    const gl = this.world.renderer.gl;
    var points = 0;
    for(const [key, v] of Object.entries(this.vertices)) {
        var list = v.list;
        for(var i = 0; i < list.length; i += 12) {
            list[i + 0] -= x;
            list[i + 1] -= z;
            points += 2;
        }
        v.buffer.updateInternal();
    }
    return points;
}

// onVerticesGenerated ... Webworker callback method
Chunk.prototype.onVerticesGenerated = function(args) {
    this.vertices_args = args;
    this.map = args.map;
}

//
Chunk.prototype.applyVertices = function() {
    const args = this.vertices_args;
    delete(this['vertices_args']);
    // var tm = performance.now();
    this.buildVerticesInProgress    = false;
    this.vertices_length            = 0;
    this.gravity_blocks             = args.gravity_blocks;
    this.fluid_blocks               = args.fluid_blocks;
    var gl = this.world.renderer.gl;
    // gl.useProgram(this.world.renderer.program);
    // Delete old WebGL buffers
    for(const [key, v] of Object.entries(this.vertices)) {
        v.buffer.destroy();
        delete(this.vertices[key]);
    }
    // Добавление чанка в отрисовщик
    for(const [key, v] of Object.entries(args.vertices)) {
        this.vertices_length  += v.list.length / 12;
        v.buffer              = createPixiBuffer(v.list);
        this.vertices[key]    = v;
        // debugger;
    }
    this.shift_orig            = args.shift;
    this.dirty                 = false;
    this.timers                = args.timers;
    this.lightmap              = args.lightmap;
    this.doShift(Game.shift);
    /*
    tm = performance.now() - tm;
    console.log(
        args.timers.build_vertices +
        ' (terrain: ' + args.timers.generate_terrain + ') ' +
        tm + ' ms ' +
        JSON.stringify(args).length + ' bytes'
    );
    */
}

// getChunkModifiers
Chunk.prototype.getChunkModifiers = function() {
    return this.modify_list;
}

// destruct chunk
Chunk.prototype.destruct = function() {
    if(Object.entries(this.modify_list).length > 0) {
        this.chunkManager.saveChunkModifiers(this.addr, this.modify_list);
    }
    var gl = this.world.renderer.gl;
    if(this.buffer) {
        this.buffer.destroy();
    }
    // Run webworker method
    this.chunkManager.postWorkerMessage(['destructChunk', {key: this.key}]);
}

// buildVertices
Chunk.prototype.buildVertices = function() {
    if(this.buildVerticesInProgress) {
        return;
    }
    this.buildVerticesInProgress = true;
    this.worker_vertices_generate = performance.now();
    // Run webworker method
    this.chunkManager.postWorkerMessage(['buildVertices', {key: this.key, shift: Game.shift}]);
    return true;
}

// Get the type of the block at the specified position.
// Mostly for neatness, since accessing the array
// directly is easier and faster.
Chunk.prototype.getBlock = function(ox, oy, oz) {
    if(!this.inited) {
        return BLOCK.DUMMY;
    }
    x = ox - this.coord.x;
    y = oy - this.coord.y;
    z = oz - this.coord.z;
    if(x < 0 || y < 0 || x > this.size.x - 1 || y > this.size.y - 1 || z > this.size.z - 1) {
        // console.error(new Vector(x, y, z), new Vector(ox, oy, oz), this.coord);
        return BLOCK.DUMMY;
    };
    if(z < 0 || z >= this.size.z) {
        return BLOCK.DUMMY;
    }
    var block = this.blocks[x][z][y];
    if(!block) {
        block = BLOCK.AIR;
    }
    return block;
}

// setBlock
Chunk.prototype.setBlock = function(x, y, z, type, is_modify, power, rotate, entity_id) {
    // fix rotate
    if(rotate && typeof rotate === 'object') {
        rotate = new Vector(
            Math.round(rotate.x * 10) / 10,
            Math.round(rotate.y * 10) / 10,
            Math.round(rotate.z * 10) / 10
        );
    } else {
        rotate = null;
    }
    // fix power
    if(typeof power === 'undefined' || power === null) {
        power = 1.0;
    }
    power = Math.round(power * 10000) / 10000;
    if(power <= 0) {
        return;
    }
    if(is_modify) {
        var modify_item = {
            id: type.id,
            power: power,
            rotate: rotate
        };
        this.modify_list[[x, y, z]] = modify_item;
        /*
        // @server
        this.world.server.Send({
            name: ServerClient.EVENT_BLOCK_SET,
            data: {
                pos: new Vector(x, y, z),
                item: modify_item
            }
        });
        */
    }
    x -= this.coord.x;
    y -= this.coord.y;
    z -= this.coord.z;
    if(x < 0 || y < 0 || z < 0 || x > this.size.x - 1 || y > this.size.y - 1 || z > this.size.z - 1) {
        return;
    };

    if(!is_modify) {
        var type                        = Object.assign({}, BLOCK[type.name]);
        this.blocks[x][z][y]            = type;
        this.blocks[x][z][y].power      = power;
        this.blocks[x][z][y].rotate     = rotate;
        this.blocks[x][z][y].entity_id  = entity_id;
        this.blocks[x][z][y].texture    = null;
    }

    // Run webworker method
    this.chunkManager.postWorkerMessage(['setBlock', {
        key:        this.key,
        x:          x + this.coord.x,
        y:          y + this.coord.y,
        z:          z + this.coord.z,
        type:       type,
        is_modify:  is_modify,
        power:      power,
        rotate:     rotate
    }]);

    if(x == 0) {
        // left
        // console.log('left');
        var key = this.chunkManager.getPosChunkKey(new Vector(this.addr.x - 1, this.addr.y, this.addr.z));
        this.chunkManager.postWorkerMessage(['setBlock', {
            key:        key,
            x:          x + this.coord.x - 1,
            y:          y + this.coord.y,
            z:          z + this.coord.z,
            type:       null,
            is_modify:  is_modify,
            power:      power,
            rotate:     rotate
        }]);
    }
    if(z == 0) {
        // top
        // console.log('top');
        // this.chunkManager.setDirtySimple(new Vector(this.addr.x, this.addr.y - 1, this.addr.z));
        var key = this.chunkManager.getPosChunkKey(new Vector(this.addr.x, this.addr.y, this.addr.z - 1));
        this.chunkManager.postWorkerMessage(['setBlock', {
            key:        key,
            x:          x + this.coord.x,
            y:          y + this.coord.y,
            z:          z + this.coord.z - 1,
            type:       null,
            is_modify:  is_modify,
            power:      power,
            rotate:     rotate
        }]);
    }
    if(x == this.size.x - 1) {
        // right
        // console.log('right');
        // this.chunkManager.setDirtySimple(new Vector(this.addr.x + 1, this.addr.y, this.addr.z));
        var key = this.chunkManager.getPosChunkKey(new Vector(this.addr.x + 1, this.addr.y, this.addr.z));
        this.chunkManager.postWorkerMessage(['setBlock', {
            key:        key,
            x:          x + this.coord.x + 1,
            y:          y + this.coord.y,
            z:          z + this.coord.z,
            type:       null,
            is_modify:  is_modify,
            power:      power,
            rotate:     rotate
        }]);
    }
    if(z == this.size.z - 1) {
        // bottom
        // console.log('bottom');
        // this.chunkManager.setDirtySimple(new Vector(this.addr.x, this.addr.y + 1, this.addr.z));
        var key = this.chunkManager.getPosChunkKey(new Vector(this.addr.x, this.addr.y, this.addr.z + 1));
        this.chunkManager.postWorkerMessage(['setBlock', {
            key:        key,
            x:          x + this.coord.x,
            y:          y + this.coord.y,
            z:          z + this.coord.z + 1,
            type:       null,
            is_modify:  is_modify,
            power:      power,
            rotate:     rotate
        }]);
    }

    /*
    this.dirty = true;

    if(x == 0) {
        // left
        // console.log('left');
        this.chunkManager.setDirtySimple(new Vector(this.addr.x - 1, this.addr.y, this.addr.z));
    }
    if(y == 0) {
        // top
        // console.log('top');
        this.chunkManager.setDirtySimple(new Vector(this.addr.x, this.addr.y - 1, this.addr.z));
    }
    if(x == this.size.x - 1) {
        // right
        // console.log('right');
        this.chunkManager.setDirtySimple(new Vector(this.addr.x + 1, this.addr.y, this.addr.z));
    }
    if(y == this.size.y - 1) {
        // bottom
        // console.log('bottom');
        this.chunkManager.setDirtySimple(new Vector(this.addr.x, this.addr.y + 1, this.addr.z));
    }
    */

}
