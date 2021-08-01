function PickAt(render, gl) {
    this.render = render;
    this.gl = gl;
    this.callbacks = [];
}

PickAt.prototype.get = function(callback) {
    this.callbacks.push(callback);
}

PickAt.prototype.draw = function() {
    const render = this.render;
    const gl = this.gl;
    // To enable better, but slow debugging:
    // if (this.callbacks.length  === 0) {
    //     this.callbacks.push(()=>{});
    // }

    if(this.callbacks.length > 0) {

        const player = Game.world.localPlayer;

        /*
        const render = this.render;
        const world = render.world;
        const bPos = new Vector(Math.floor(player.pos.x), Math.floor(player.pos.y), Math.floor(player.pos.z));
        const min = new Vector(bPos.x - PICKAT_DIST, bPos.y - PICKAT_DIST, bPos.z - PICKAT_DIST);
        const max = new Vector(bPos.x + PICKAT_DIST, bPos.y + PICKAT_DIST, bPos.z + PICKAT_DIST);

        var playerPos = new Vector(
            parseInt(player.pos.x) - PICKAT_DIST,
            parseInt(player.pos.y) - PICKAT_DIST,
            parseInt(player.pos.z) - PICKAT_DIST
        );

        var block = false;

        for(var x = min.x; x <= max.x; x++) {
            for(var y = min.y; y <= max.y; y++) {
                for(var z = min.z; z <= max.z; z++) {
                    var b = world.chunkManager.getBlock(x, y, z);
                    if (b.id != BLOCK.AIR.id && b.id != BLOCK.DUMMY.id) {
                        var resp = Helpers.IntersectRayBrick(
                            {
                                start: [playerPos.x, playerPos.y, playerPos.z + 1.7],
                                // direction: player.angles,
                                direction: [
                                    player.angles[0] / Math.PI,
                                    player.angles[1] / Math.PI,
                                    player.angles[2] / Math.PI
                                ]
                            },
                            {
                                min_point: [x, y, z],
                                max_point: [x + 1, y + 1, z + 1]
                            }
                        );
                        if(resp) {
                            block = {x: x, y: y, z: z, n: 1};
                            console.log(block);
                        }
                    }
                }
            }
        }

        while(this.callbacks.length > 0) {
            var callback = this.callbacks.pop();
            callback(block);
        }
        */

        const x = gl.canvas.width * 0.5 / window.devicePixelRatio;
        const y = gl.canvas.height * 0.5 / window.devicePixelRatio;
        var bPos = new Vector(Math.floor(player.pos.x), Math.floor(player.pos.y), Math.floor(player.pos.z));
        var block = this.pickAt(
            new Vector(bPos.x - PICKAT_DIST, bPos.y - PICKAT_DIST, bPos.z - PICKAT_DIST),
            new Vector(bPos.x + PICKAT_DIST, bPos.y + PICKAT_DIST, bPos.z + PICKAT_DIST),
            x,
            y
        );
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        while(this.callbacks.length > 0) {
            var callback = this.callbacks.pop();
            callback(block);
        }

    }
}

/**
* Returns the block at mouse position mx and my.
* The blocks that can be reached lie between min and max.
*
* Each side is rendered with the X, Y and Z position of the
* block in the RGB color values and the normal of the side is
* stored in the color alpha value. In that way, all information
* can be retrieved by simply reading the pixel the mouse is over.
**/
PickAt.prototype.pickAt = function(min, max, mx, my) {

    var render = this.render;
    var world = render.world;

    // Build buffer with block pick candidates
    var vertices = [];
    var playerPos = new Vector(
        parseInt(Game.world.localPlayer.pos.x) - PICKAT_DIST,
        parseInt(Game.world.localPlayer.pos.y) - PICKAT_DIST,
        parseInt(Game.world.localPlayer.pos.z) - PICKAT_DIST
    );
    for(var x = min.x; x <= max.x; x++) {
        for(var y = min.y; y <= max.y; y++) {
            for(var z = min.z; z <= max.z; z++) {
                var b = world.chunkManager.getBlock(x, y, z);
                if (b.id != BLOCK.AIR.id && b.id != BLOCK.DUMMY.id) {
                    var pos = new Vector(
                        x - playerPos.x,
                        y - playerPos.y,
                        z - playerPos.z
                    );
                    BLOCK.pushPickingVertices(vertices, x, y, z, pos);
                }
            }
        }
    }
    // !!!
    for(var i = 0; i < vertices.length; i += 12) {
        vertices[i + 0] -= (Game.shift.x);
        vertices[i + 1] -= (Game.shift.z);
    }

    var gl = render.gl;

    // // Create framebuffer for picking render
    gl.activeTexture(gl.TEXTURE0);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    var bt = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bt, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    if (!this.buffer) {
        this.buffer = createPixiBuffer(vertices);
    } else {
        this.buffer.updateInternal(new Float32Array(vertices));
    }

    render.terrainShader.uniforms.u_fogOn = false;
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, render.texWhite);
    gl.viewport(0, 0, 512, 512);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    render.drawBuffer(this.buffer, new Vector(0, 0, 0));
    gl.enable(gl.BLEND);

    // Read pixel
    var pixel = new Uint8Array(4);
    gl.readPixels(mx / gl.viewportWidth * 512, (1 - my / gl.viewportHeight) * 512, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    // Reset states
    gl.bindTexture(gl.TEXTURE_2D, render.texTerrain);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteRenderbuffer(renderbuffer);
    gl.deleteTexture(bt);
    gl.deleteFramebuffer(fbo);

    // Build result
    if(pixel[0] == 255 || pixel[0] === 0) {
        return false;
    }
    var normal;
    if(pixel[3] == 1) normal = new Vector(0, 1, 0); // top
    else if(pixel[3] == 2) normal = new Vector(0, -1, 0); // bottom
    else if(pixel[3] == 3) normal = new Vector(0, 0, -1); // left
    else if(pixel[3] == 4) normal = new Vector(0, 0, 1); // right
    else if(pixel[3] == 5) normal = new Vector(-1, 0, 0); // back
    else if(pixel[3] == 6) normal = new Vector(1, 0, 0); // front
    if(!normal) {
        return false;
    }
    return {
        x: pixel[0] + playerPos.x,
        y: pixel[1] + playerPos.y,
        z: pixel[2] + playerPos.z,
        n: normal
    };
};
