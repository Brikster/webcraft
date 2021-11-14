/**
 * light worker sends messages periodically, separating light waves
 */

/**
 * settings
 */
/**
 * max time spent in light loop
 */
let globalStepMs = 1000.0 / 120.0;

/**
 * inited or not
 * @type {boolean}
 */
let modulesReady = false;
let VectorCollector = null;
let Vector = null;
const world = {
    chunkManager: null,
    queue: null
}

const maxLight = 15;
const BLOCK = 255;
const dx = [1, -1, 0, 0, 0, 0];
const dy = [0, 0, 1, -1, 0, 0];
const dz = [0, 0, 0, 0, 1, -1];

const edge = [
    [1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0],
    [1, 1, -1, -1, 0, 0, 0, 0, 1, 1, 1, -1],
    [0, 0, 0, 0, 1, 1, -1, -1, 1, -1, 1, -1],
]

class LightQueue {
    constructor() {
        this.wavesChunk = [];
        for (let i = 0; i <= maxLight; i++) {
            this.wavesChunk.push([]);
        }
        this.wavesCoord = [];
        for (let i = 0; i <= maxLight; i++) {
            this.wavesCoord.push([]);
        }
    }

    doWaves(msLimit) {
        msLimit = msLimit || globalStepMs;
        const startTime = performance.now();
        let endTime = performance.now();
        const {wavesChunk, wavesCoord} = this;
        let wn = maxLight;
        let chunkAddr = new Vector();
        do {
            for (let tries = 0; tries < 1000; tries++) {
                while (wn >= 0 && wavesChunk[wn].length === 0) {
                    wn--;
                }
                if (wn < 0) {
                    break;
                }
                let chunk = wavesChunk[wn].pop();
                const coord = wavesCoord[wn].pop();
                chunk.waveCounter--;
                if (chunk.removed) {
                    continue;
                }

                const {outerSize, size} = chunk;
                const sy = outerSize.x * outerSize.z, sx = 1, sz = outerSize.x;
                const iy = size.x * size.z, ix = 1, iz = size.x;

                let tmp = coord;
                const x = tmp % outerSize.x;
                tmp -= x;
                tmp /= outerSize.x;
                const z = tmp % outerSize.z;
                tmp -= z;
                tmp /= outerSize.z;
                const y = tmp;

                let val = chunk.lightSource[ix * (x - 1) + iy * (y - 1) + iz * (z - 1)];
                if (val === BLOCK) {
                    val = 0;
                } else {
                    for (let d = 0; d < 6; d++) {
                        let x2 = x + dx[d], y2 = y + dy[d], z2 = z + dz[d];
                        let coord2 = sx * x2 + sy * y2 + sz * z2;
                        val = Math.max(val, chunk.lightMap[coord2] - 1);
                    }
                }
                const old = chunk.lightMap[coord];
                const prev = chunk.lightPrev[coord];
                if (old === val && prev === val) {
                    continue;
                }
                chunk.lightMap[coord] = val;
                chunk.lightPrev[coord] = val;
                chunk.lastID++;

                //TODO: copy to neib chunks

                const waveNum = Math.max(Math.max(old, val) - 1, 0);
                for (let d = 0; d < 6; d++) {
                    let x2 = x + dx[d], y2 = y + dy[d], z2 = z + dz[d];
                    let coord2 = coord + dx[d] * sx + dy[d] * sy + dz[d] * sz;
                    if (x2 === 0 || x2 === size.x + 1
                        || y2 === 0 || y2 === size.y + 1
                        || z2 === 0 || z2 === size.z + 1) {
                        // different chunk!
                        chunkAddr.copyFrom(chunk.addr);
                        chunkAddr.x += dx[d];
                        chunkAddr.y += dy[d];
                        chunkAddr.z += dz[d];
                        let chunk2 = world.chunkManager.getChunk(chunkAddr);
                        if (chunk2 !== null) {
                            const shift = dx[d] * sx * size.x
                                + dy[d] * sy * size.y
                                + dz[d] * sz * size.z;

                            coord2 = coord2 - shift;
                            wavesChunk[waveNum].push(chunk2);
                            wavesCoord[waveNum].push(coord2);
                            chunk2.waveCounter++;

                            chunk2.lightMap[coord - shift] = val;
                            chunk2.lastID++;
                        } else {
                            chunk.lightMap[coord2] = Math.max(val - 1, 0);
                            wavesChunk[waveNum].push(chunk);
                            wavesCoord[waveNum].push(coord);
                            chunk.waveCounter++;
                        }
                    } else {
                        wavesChunk[waveNum].push(chunk);
                        wavesCoord[waveNum].push(coord2);
                        chunk.waveCounter++;
                    }
                }
            }
            endTime = performance.now();
        } while (endTime < startTime + msLimit);
    }

    /**
     * @param chunk
     * @param ind
     * @param coord
     */
    add(chunk, coord, waveNum) {
        const {wavesChunk, wavesCoord} = this;
        if (waveNum > maxLight) {
            waveNum = maxLight;
        }
        wavesChunk[waveNum].push(chunk);
        wavesCoord[waveNum].push(coord);
        chunk.waveCounter++;
    }

    fixEdge(chunk) {
        const { size, outerSize } = chunk;
        const dest = chunk.lightMap;

        const chunkAddr = new Vector();

        const sy = outerSize.x * outerSize.z, sx = 1, sz = outerSize.x;

        for (let i = 0; i < 12; i++)
        {
            chunkAddr.copyFrom(chunk.addr);
            const dx = edge[0][i], dy = edge[1][i], dz = edge[2][i];
            const tx = 1 - Math.abs(dx), ty = 1 - Math.abs(dy), tz = 1 - Math.abs(dz);
            const len = size.x * tx + size.y * ty + size.z * tz + 2;
            const x1 = dx > 0 ? size.x + 1 : 0;
            const y1 = dy > 0 ? size.y + 1 : 0;
            const z1 = dz > 0 ? size.z + 1 : 0;


            chunkAddr.x += dx;
            chunkAddr.y += dy;
            chunkAddr.z += dz;

            const chunk2 = world.chunkManager.getChunk(chunkAddr);
            if (chunk2)
            {
                const src = chunk2.lightMap;
                const shift = dx * size.x * sx + dy * size.y * sy + dz * size.z * sz;
                for (let t = 0; t < len; t++) {
                    const coord = (x1 + t * tx) * sx + (y1 + t * ty) * sy + (z1 + t * tz) * sz;
                    dest[coord] = src[coord - shift];
                }
            } else
            {
                const shift = dx * sx + dy * sy + dz * sz;
                for (let t = 0; t < len; t++) {
                    const coord = (x1 + t * tx) * sx + (y1 + t * ty) * sy + (z1 + t * tz) * sz;
                    dest[coord] = Math.max(dest[coord - shift] - 1, 0);
                }
            }
        }
    }
}

class ChunkManager {
    constructor() {
        this.chunks = new VectorCollector();
        this.list = [];
    }

    // Get
    getChunk(addr) {
        return this.chunks.get(addr);
    }

    add(chunk) {
        this.list.push(chunk);
        this.chunks.add(chunk.addr, chunk);
    }

    delete(chunk) {
        if (this.chunks.delete(chunk.addr)) {
            this.list.splice(this.list.indexOf(chunk), 1);
        }
    }
}

class Chunk {
    constructor(args) {
        this.addr = new Vector(args.addr.x, args.addr.y, args.addr.z);
        this.size = new Vector(args.size.x, args.size.y, args.size.z);
        this.outerSize = new Vector(args.size.x + 4, args.size.y + 4, args.size.z + 4);
        this.lightSource = args.light_buffer ? new Uint8Array(args.light_buffer) : null;

        this.lastID = 0;
        this.sentID = 0;
        this.removed = false;
        this.waveCounter = 0;
    }

    get chunkManager() {
        return world.chunkManager;
    }

    init() {
        this.len = this.size.x * this.size.y * this.size.z;
        this.outerLen = (this.size.x + 4) * (this.size.y + 4) * (this.size.z + 4);
        if (!this.lightSource) {
            this.lightSource = new Uint8Array(this.len);
        }
        this.lightMap = new Uint8Array(this.outerLen);
        this.lightPrev = new Uint8Array(this.outerLen);
    }

    fillOuter() {
        //checks neighbour chunks
        const {size, outerSize, lightSource} = this;
        const sy = outerSize.x * outerSize.z, sx = 1, sz = outerSize.x;
        const iy = size.x * size.z, ix = 1, iz = size.x;
        let neibAddr = new Vector();
        let dest = this.lightMap;
        let neib;
        neibAddr.copyFrom(this.addr).x--;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sx * size.x, shift2 = sx;
            for (let i = 0; i < outerSize.y; i++)
                for (let j = 0; j < outerSize.z; j++) {
                    let ind = sy * i + sz * j;
                    dest[ind] = src[ind + shift];
                    dest[ind + shift2] = src[ind + shift + shift2];
                }
        }
        neibAddr.copyFrom(this.addr).x++;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sx * size.x, shift2 = sx;
            for (let i = 0; i < outerSize.y; i++)
                for (let j = 0; j < outerSize.z; j++) {
                    let ind = sy * i + sz * j;
                    dest[ind + shift] = src[ind];
                    dest[ind + shift + shift2] = src[ind + shift2];
                }
        }
        neibAddr.copyFrom(this.addr).y--;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sy * size.y, shift2 = sy;
            for (let i = 0; i < outerSize.x; i++)
                for (let j = 0; j < outerSize.z; j++) {
                    let ind = sx * i + sz * j;
                    dest[ind] = src[ind + shift];
                    dest[ind + shift2] = src[ind + shift + shift2];
                }
        }
        neibAddr.copyFrom(this.addr).y++;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sy * size.y, shift2 = sy;
            for (let i = 0; i < outerSize.x; i++)
                for (let j = 0; j < outerSize.z; j++) {
                    let ind = sx * i + sz * j;
                    dest[ind + shift] = src[ind];
                    dest[ind + shift + shift2] = src[ind + shift2];
                }
        }
        neibAddr.copyFrom(this.addr).z--;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sz * size.z, shift2 = sz;
            for (let i = 0; i < outerSize.x; i++)
                for (let j = 0; j < outerSize.y; j++) {
                    let ind = sx * i + sy * j;
                    dest[ind] = src[ind + shift];
                    dest[ind + shift2] = src[ind + shift + shift2];
                }
        }
        neibAddr.copyFrom(this.addr).z++;
        neib = this.chunkManager.getChunk(neibAddr);
        if (neib) {
            let src = neib.lightMap;
            let shift = sz * size.z, shift2 = sz;
            for (let i = 0; i < outerSize.x; i++)
                for (let j = 0; j < outerSize.y; j++) {
                    let ind = sx * i + sy * j;
                    dest[ind + shift] = src[ind];
                    dest[ind + shift + shift2] = src[ind + shift2];
                }
        }

        for (let y = 0; y < size.y; y++)
            for (let z = 0; z < size.z; z++)
                for (let x=0; x < size.x; x++) {
                    const inner = x * ix + y * iy + z * iz;
                    const outer = (x + 1) * sx + (y + 1) * sy + (z + 1) * sz;
                    const m = Math.max(lightSource[inner], dest[outer]);
                    if (m > 0) {
                        world.light.add(this, outer, m);
                    }
                }
    }
}

function run() {
    world.light.doWaves(16);

    world.chunkManager.list.forEach((chunk) => {
        if (chunk.waveCounter !== 0)
            return;
        if (chunk.sentID === chunk.lastID)
            return;
        chunk.sentID = chunk.lastID;

        world.light.fixEdge(chunk);

        postMessage(['light_generated', {
            addr: chunk.addr,
            lightmap_buffer: chunk.lightMap.buffer,
            lightID: chunk.lastID
        }]);
    })
}

const msgQueue = [];

async function importModules() {
    await import("./helpers.js").then(module => {
        Vector = module.Vector;
        VectorCollector = module.VectorCollector;
    });
    modulesReady = true;
    //for now , its nothing
    world.chunkManager = new ChunkManager();
    world.light = new LightQueue();
    for (let item of msgQueue) {
        await onmessage(item);
    }
    msgQueue.length = 0;
    postMessage(['worker_inited', null]);

    setInterval(run, 20);
}

onmessage = async function (e) {
    const cmd = e.data[0];
    const args = e.data[1];
    if (cmd == 'init') {
        // Init modules
        importModules();
        return;
    }
    if (!modulesReady) {
        return msgQueue.push(e);
    }
    //do stuff

    switch (cmd) {
        case 'createChunk': {
            if (!world.chunkManager.getChunk(args.addr)) {
                let chunk = new Chunk(args);
                chunk.init();
                chunk.fillOuter();
                world.chunkManager.add(chunk);
            }
            break;
        }
        case 'destructChunk': {
            let chunk = world.chunkManager.getChunk(args.addr);
            if (chunk) {
                chunk.removed = true;
                world.chunkManager.delete(chunk);
            }
            break;
        }
        case 'setBlock': {
            let chunk = world.chunkManager.getChunk(args.addr);
            if (chunk) {
                const { innerCoord, outerCoord, light_source } = args;
                chunk.lightSource[innerCoord] = light_source;
                world.light.add(chunk, outerCoord, Math.max(chunk.lightMap[outerCoord], light_source));
            }
        }
    }
}