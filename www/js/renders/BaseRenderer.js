import {Vector} from '../helpers.js';
import glMatrix from "../../vendors/gl-matrix-3.3.min.js";

const {mat4} = glMatrix;

export class BaseRenderTarget {
    constructor (context, options = {width: 1, height: 1, depth: true}) {
        this.context = context;
        this.options = options;
        /**
         * @type {BaseTexture}
         */
        this.texture = null;
        this.valid = false;        
        this.init();
    }

    get width() {
        return this.options.width;
    }

    get height() {
        return this.options.height;
    }

    resize(w, h) {
        this.destroy();
        this.options.width = w;
        this.options.height = h;

        this.init();
    }

    init() {
        this.texture = context.createTexture(options);
        this.valid = true;
    }

    flush() {

    }

    destroy() {
        this.valid = false;
        if (this.texture) {
            this.texture.destroy();
        }

        this.texture = null;
    }
}

export class BaseBuffer {
    constructor(context, options = {}) {
        this.context = context;
        this.options = options;
        this._data = options.data;
        this.index = options.index;

        this.dirty = true;
    }

    /**
     *
     * @param {Float32Array | Uint16Array} v
     */
    set data(v) {
        this.dirty = true;
        this._data = v;
    }

    get data() {
        return this._data;
    }

    update() {
        this.dirty = false;
    }

    bind() {

    }

    destroy() {

    }
}

export class BaseTexture {
    /**
     *
     * @param {BaseRenderer} context
     * @param {number} width
     * @param {number} height
     * @param {'linear' | 'nearest'} magFilter
     * @param {'linear' | 'nearest'} minFilter
     * @param {TerrainTextureUniforms} style
     * @param { HTMLCanvasElement | HTMLImageElement | ImageBitmap | Array<HTMLCanvasElement | HTMLImageElement | ImageBitmap> } source
     */
    constructor(context, {
        width = 1,
        height = 1,
        magFilter = 'linear',
        minFilter = 'linear',
        style = null,
        source = null,
    } = {}) {
        this.width = width;
        this.height = height;
        this.magFilter = magFilter;
        this.minFilter = minFilter;
        this.source = source;
        this.style = style;
        this.context = context;

        this.id = BaseRenderer.ID++;
        this.usage = 0;

        if (source) {
            this.width = Array.isArray(source) ? source[0].width : source.width;
            this.height = Array.isArray(source) ? source[0].height : source.height;
        }

        this.dirty = true;

        context._textures.push(this);
    }

    get isUsed() {
        return this.usage > 1;
    }

    upload() {
        this.context._activeTextures[this.id] = this;
        this.dirty = false;
    }

    destroy() {
        this.usage --;

        if (this.usage > 0) {
            return;
        }

        delete this.context._activeTextures[this.id];
        this.context._textures = this.context._textures.filter((e) => e !== this);
    }

    bind() {

    }

    isSimilar({
        magFilter = 'linear',
        minFilter = 'linear',
        style = null,
        source = null,
    }) {
        return magFilter === this.magFilter && this.minFilter === minFilter && this.source === source;
    }
}

export class BaseTexture3D {
    constructor(context, {
        width = 1,
        height = 1,
        depth = 1,
        type = 'u8',
        filter = 'nearest',
        data = null
    } = {}) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.minFilter = filter;
        this.magFilter = filter;
        this.type = type;
        this.data = data;

        this.context = context;
        this.id = BaseRenderer.ID++;
        this.dirty = true;
        this.prevLength = 0;
    }

    upload() {
        this.context._textures[this.id] = this;
        this.dirty = false;
    }

    destroy() {
        delete this.context._textures[this.id];
    }

    update(data) {
        this.dirty = true;
        if (data) {
            this.data = data;
        }
    }

    bind() {
    }

    isSimilar() {
        return false;
    }
}

export const BLEND_MODES = {
    NORMAL: 0,
    ADD: 1,
    MULTIPLY: 2,
    SCREEN: 3
}

export class BaseMaterial {
    constructor(context, options) {
        this.context = context;
        this.options = options;
        this.shader = options.shader;
        this.texture = options.texture || null;
        this.lightTex = options.lightTex || null;
        this.cullFace = options.cullFace || false;
        this.opaque = options.opaque || false;
        this.ignoreDepth = options.ignoreDepth || false;
        this.mipmap = options.mipmap || false;
        this.blendMode = options.blendMode || BLEND_MODES.NORMAL;
    }

    getSubMat() {
        return null;
    }

    destroy() {
        this.shader = null;
        this.context = null;
        this.texture = null;
        this.options = null;
    }
}

export class BaseShader {
    constructor(context, options) {
        this.context = context;
        this.options = options;
        /**
         * @type {{vertex: string, fragment: string}}
         */
        this.code = options.code;
        this.bindings = [];
    }

    bind() {
    }

    update() {
    }

}

export class GlobalUniformGroup {
    constructor(options) {
        this.projMatrix         = mat4.create();
        this.viewMatrix         = mat4.create();

        this.chunkBlockDist = 1;
        this.brightness = 1;
        this.resolution = [1, 1];
        this.fogAddColor = [0,0,0,0];
        this.fogColor = [1,1,1,1];
        this.time = performance.now();

        this.testLightOn = 0;
        this.sunDir = [0, 0, 0];

        this.updateID = 0;
        this.camPos = new Vector();
    }

    update() {
        this.updateID++;
    }
}

export class BaseTerrainShader extends BaseShader {
    constructor(context, options) {
        super(context, options);

        this.globalUniforms = context.globalUniforms;
        this.modelMatrix        = mat4.create();

        this.blockSize = 1;
        this.pixelSize = 1;
        this.mipmap = 0;
        this.addPos = [0,0,0];
        this.texture = null;
    }

    bind() {
    }

    update() {
    }

    updatePos(pos, modelMatrix) {
    }

}

export class CubeMesh {

    constructor(shader, geom) {
        this.shader = shader;
        this.geom = geom;
    }

    get lookAt() {
        return this.shader.lookAt;
    }

    get proj() {
        return this.shader.proj;
    }

    draw (lookAtMatrix, projMatrix, width, height) {
        const {
            lookAt, proj
        } = this;

        proj.set(projMatrix);
        lookAt.set(lookAtMatrix);
        mat4.rotate(lookAt, lookAt, Math.PI / 2, [1, 0, 0]);

        lookAt[12] = 0;
        lookAt[13] = 0;
        lookAt[14] = 0;

        this.shader.resolution = [width, height];

        this.shader.context.drawCube(this);
    }
}

export class BaseCubeGeometry {

    constructor(context, options) {
        this.context = context;
        this.options = options;

        this.index = context.createBuffer({
            data: new Uint16Array([
                0, 1, 2, 2, 3, 0, 4, 5, 6, 6, 7, 4,
                1, 5, 6, 6, 2, 1, 0, 4, 7, 7, 3, 0,
                3, 2, 6, 6, 7, 3, 0, 1, 5, 5, 4, 0
            ]),
            index: true
        });

        this.vertex = context.createBuffer({
            data: new Float32Array([
                -1, -1, 1,
                1, -1, 1,
                1, 1, 1,
                -1, 1, 1,
                -1, -1, -1,
                1, -1, -1,
                1, 1, -1,
                -1, 1, -1
            ])
        });

        this.buffers = [
            this.vertex, this.index
        ];
    }

}

export class BaseCubeShader extends BaseShader {

    /**
     *
     * @param {BaseRenderer} context
     * @param {{code, sides: *[]}} options
     */
    constructor(context, options) {
        super(context, options);

        /**
         *
         * @type {BaseTexture}
         */
        this.texture = context.createTexture({
            source: options.sides
        });
        this.texture.bind();

        // Default values
        this.resolution_value   = [1, 1];
        this.testLightOn_value  = false;

        this.mergedBuffer = new Float32Array(16 * 2 + 1);

        this.lookAt = new Float32Array(this.mergedBuffer.buffer,0, 16);
        this.proj = new Float32Array(this.mergedBuffer.buffer, 16 * 4, 16 );

        this.mergedBuffer[32] = 1;

        this.cull = false;
        this.depth = false;
    }

    set brightness (v) {
        this.mergedBuffer[16 * 2] = v;
    }

    get brightness () {
        return this.mergedBuffer[16 * 2];
    }

    set resolution(v) {
        this.resolution_value = v;
    }

    get resolution() {
        return this.resolution_value;
    }

    set testLightOn(v) {
        this.testLightOn_value = v;
    }

    get testLightOn() {
        return this.testLightOn_value;
    }

    bind() {
    }

    update() {
    }

}

export default class BaseRenderer {
    /**
     *
     * @param {HTMLCanvasElement} view
     * @param {*} options
     */
    constructor(view, options) {
        this.view = view;
        this.options = options;
        this.size = {
            width: 0,
            height: 0
        };
        this.stat = {
            drawcalls: 0,
            drawquads: 0
        };
        this._activeTextures = {};

        /**
         * @type {BaseTexture[]}
         */
        this._textures = [];

        this._buffers = {};
        this._emptyTex3D = this.createTexture3D({
            data: new Uint8Array(255)
        })

        /**
         * @type {BaseRenderTarget}
         */
        this._target = null;

        this.globalUniforms = new GlobalUniformGroup();
    }

    get kind() {
        return this.constructor.kind;
    }

    async init() {

    }

    /**
     * 
     * @param {BaseRenderTarget} target 
     */
    setTarget(target) {
        if (target && !target.valid) {
            throw 'Try bound invalid RenderTarget';
        }

        this._target = target;
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.size = {
            width, height
        }

        this._configure();
    }

    _configure() {

    }

    beginFrame(fogColor) {

    }

    endFrame() {

    }

    /**
     * Create render target
     * @param options
     * @return {BaseRenderTarget}
     */
    createRenderTarget(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass'); 
    }

    /**
     * Create texture unit
     * @param options
     * @return {BaseTexture}
     */
    createTexture(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    createTexture3D(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    createMaterial(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    drawMesh(geom, material) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    createShader(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    /**
     * 
     * @param {*} options 
     * @returns {Promise<any>}
     */
    async createResourcePackShader(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    createBuffer(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    createCubeMap(options) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }

    /**
     *
     * @param {CubeMesh} cube
     */
    drawCube(cube) {
        throw new TypeError('Illegal invocation, must be overridden by subclass');
    }
}

BaseRenderer.ID = 0;
