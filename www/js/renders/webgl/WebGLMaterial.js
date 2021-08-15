import {BaseMaterial} from "../BaseRenderer.js";

export class WebGLMaterial extends BaseMaterial {
    constructor(context, options) {
        super(context, options);
    }

    bind() {
        const { gl } = this.context;
        if (!this.cullFace) {
            gl.disable(gl.CULL_FACE);
        }
        if (this.opaque) {
            gl.uniform1f(this.shader.u_opaqueThreshold, 0.5);
        }
    }

    unbind() {
        const { gl } = this.context;
        if (!this.cullFace) {
            gl.enable(gl.CULL_FACE);
        }
        if (this.opaque) {
            gl.uniform1f(this.shader.u_opaqueThreshold, 0.0);
        }
    }

    getSubMat() {
        // nothing
        return this;
    }

    updatePos(addPos, modelMatrix = null) {
        const { gl } = this.context;
        const { camPos } = this.shader;

        if (addPos) {
            gl.uniform3f(this.u_add_pos, pos.x - camPos.x, pos.y - camPos.y, pos.z - camPos.z);
        } else {
            gl.uniform3f(this.u_add_pos, -camPos.x,  -camPos.y, -camPos.z);
        }

        if (modelMatrix) {
            gl.uniformMatrix4fv(this.uModelMatrix, false, modelMatrix);
        }
    }
}
