"use strict";

function PlayerModel(props) {

    this.texPlayer                  = null;
    this.texPlayer2                 = null;
    this.moving_timeout             = null;
    this.texture                    = null;
    this.nametag                    = null;
    this.moving                     = false;
    this.aniframe                   = 0;
    this.height                     = 1.7;

    Object.assign(this, props);

    // Create canvas used to draw name tags
    this.textCanvas                 = document.createElement('canvas');
    this.textCanvas.width           = 256;
    this.textCanvas.height          = 64;
    this.textCanvas.style.display   = 'none';

    // Create context used to draw name tags
    this.textContext                = this.textCanvas.getContext('2d');
    this.textContext.textAlign      = 'left';
    this.textContext.textBaseline   = 'top';
    this.textContext.font           = '24px Minecraftia';

}

// draw
PlayerModel.prototype.draw = function(render, uModelMat, camPos, delta) {
    this.drawLayer(render, uModelMat, camPos, delta, {
        scale:          1.0,
        texture:        this.texPlayer,
        draw_nametag:   false
    });

    const gl = this.gl;
    gl.disable(gl.CULL_FACE);

    this.drawLayer(render, uModelMat, camPos, delta, {
        scale:          1.05,
        texture:        this.texPlayer2,
        draw_nametag:   true
    });

    gl.enable(gl.CULL_FACE);

}

// loadMesh...
PlayerModel.prototype.loadMesh = function() {
    this.loadPlayerHeadModel();
    this.loadPlayerBodyModel();
    this.loadTextures();
}

// loadTextures...
PlayerModel.prototype.loadTextures = function() {
    var that = this;
    var gl = this.gl;
    // Load player texture
    var image = new Image();
    image.onload = function() {
        Helpers.createSkinLayer2(null, image, function(file) {
            var image2 = new Image();
            image2.onload = function(e) {
                gl.activeTexture(gl.TEXTURE0);
                // Layer1
                var texture = gl.createTexture();
                texture.image = image;
                that.texPlayer = texture;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                // Layer2
                var texture2 = gl.createTexture();
                texture2.image = image2;
                that.texPlayer2 = texture2;
                gl.bindTexture(gl.TEXTURE_2D, texture2);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture2.image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                document.getElementsByTagName('body')[0].append(image2);
            };
            image2.src = URL.createObjectURL(file);
        });
    };
    image.src = this.skin.file;
}

// Loads the player head model into a vertex buffer for rendering.
PlayerModel.prototype.loadPlayerHeadModel = function() {

    var gl = this.gl;

    // [x, y, z, tX, tY, lm.r, lm.g, lm.b, lm.a, n.x, n.y, n.z],

    // Player head
    var vertices = [
        // Top
        -0.25, -0.25, 0.25, 8/64, 0, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.25, -0.25, 0.25, 16/64, 0, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.25, 0.25, 0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.25, 0.25, 0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.25, 0.25, 0.25, 8/64, 8/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.25, -0.25, 0.25, 8/64, 0, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        -0.25, -0.25, -0.25, 16/64, 0, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.25, 0.25, -0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.25, 0.25, -0.25, 24/64, 8/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.25, 0.25, -0.25, 24/64, 8/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.25, -0.25, -0.25, 24/64, 0, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.25, -0.25, -0.25, 16/64, 0, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        -0.25, -0.25, 0.25, 8/64, 8/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.25, -0.25, -0.25, 8/64, 16/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.25, -0.25, -0.25, 16/64, 16/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.25, -0.25, -0.25, 16/64, 16/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.25, -0.25, 0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.25, -0.25, 0.25, 8/64, 8/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        -0.25, 0.25, 0.25, 24/64, 8/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.25, 0.25, 0.25, 32/64, 8/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.25, 0.25, -0.25, 32/64, 16/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.25, 0.25, -0.25, 32/64, 16/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.25, 0.25, -0.25, 24/64, 16/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.25, 0.25, 0.25, 24/64, 8/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        -0.25, -0.25, 0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.25, 0.25, 0.25, 24/64, 8/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.25, 0.25, -0.25, 24/64, 16/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.25, 0.25, -0.25, 24/64, 16/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.25, -0.25, -0.25, 16/64, 16/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.25, -0.25, 0.25, 16/64, 8/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        0.25, -0.25, 0.25, 8/64, 8/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.25, -0.25, -0.25, 8/64, 16/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.25, 0.25, -0.25, 0/64, 16/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.25, 0.25, -0.25, 0/64, 16/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.25, 0.25, 0.25, 0/64, 8/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.25, -0.25, 0.25, 8/64, 8/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,

    ];

    var buffer = createPixiBuffer(vertices);

    return this.playerHead = buffer;

}

// Loads the player body model into a vertex buffer for rendering.
PlayerModel.prototype.loadPlayerBodyModel = function(gl) {

    var gl = this.gl;

    var vertices = [
        // Player torso

        // Top
        -0.30, -0.125, 1.45, 20/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.30, -0.125, 1.45, 28/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.30, 0.125, 1.45, 28/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.30, 0.125, 1.45, 28/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.30, 0.125, 1.45, 20/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.30, -0.125, 1.45, 20/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        -0.30, -0.125, 0.73, 28/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.30, 0.125, 0.73, 28/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.30, 0.125, 0.73, 36/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.30, 0.125, 0.73, 36/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.30, -0.125, 0.73, 36/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.30, -0.125, 0.73, 28/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        -0.30, -0.125, 1.45, 20/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.30, -0.125, 0.73, 20/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.30, -0.125, 0.73, 28/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.30, -0.125, 0.73, 28/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.30, -0.125, 1.45, 28/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.30, -0.125, 1.45, 20/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        -0.30, 0.125, 1.45, 40/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.30, 0.125, 1.45, 32/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.30, 0.125, 0.73, 32/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.30, 0.125, 0.73, 32/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.30, 0.125, 0.73, 40/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.30, 0.125, 1.45, 40/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        -0.30, -0.125, 1.45, 16/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.30, 0.125, 1.45, 20/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.30, 0.125, 0.73, 20/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.30, 0.125, 0.73, 20/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.30, -0.125, 0.73, 16/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.30, -0.125, 1.45, 16/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        0.30, -0.125, 1.45, 28/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.30, -0.125, 0.73, 28/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.30, 0.125, 0.73, 32/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.30, 0.125, 0.73, 32/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.30, 0.125, 1.45, 32/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.30, -0.125, 1.45, 28/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,

    ];

    var buffer = this.playerBody = createPixiBuffer(vertices);

    var vertices = [
        // Left arm

        // Top
        0.30, -0.125, 0.05, 44/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.55, -0.125, 0.05, 48/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.55,  0.125, 0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.55,  0.125, 0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.30,  0.125, 0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.30, -0.125, 0.05, 44/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        0.30, -0.125, -0.67, 48/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.30,  0.125, -0.67, 48/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.55,  0.125, -0.67, 52/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.55,  0.125, -0.67, 52/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.55, -0.125, -0.67, 52/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.30, -0.125, -0.67, 48/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.30, -0.125, -0.67, 48/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.55, -0.125, -0.67, 44/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.55, -0.125, -0.67, 44/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        0.30, 0.125,  0.05, 52/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.55, 0.125,  0.05, 56/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.55, 0.125, -0.67, 56/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.55, 0.125, -0.67, 56/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.30, 0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.30, 0.125,  0.05, 52/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.30,  0.125,  0.05, 52/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.30,  0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.30,  0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.30, -0.125, -0.67, 48/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.55, -0.125, -0.67, 44/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.55,  0.125, -0.67, 40/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.55,  0.125, -0.67, 40/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.55,  0.125,  0.05, 40/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,

    ];

    var buffer = this.playerLeftArm = createPixiBuffer(vertices);

    var vertices = [
        // Right arm

        // Top
        -0.55, -0.125, 0.05, 44/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.30, -0.125, 0.05, 48/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.30,  0.125, 0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.30,  0.125, 0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.55,  0.125, 0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.55, -0.125, 0.05, 44/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        -0.55, -0.125, -0.67, 52/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.55,  0.125, -0.67, 52/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.30,  0.125, -0.67, 48/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.30,  0.125, -0.67, 48/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.30, -0.125, -0.67, 48/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.55, -0.125, -0.67, 52/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        -0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.55, -0.125, -0.67, 44/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.30, -0.125, -0.67, 48/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.30, -0.125, -0.67, 48/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        -0.55, 0.125,  0.05, 56/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.30, 0.125,  0.05, 52/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.30, 0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.30, 0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.55, 0.125, -0.67, 56/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.55, 0.125,  0.05, 56/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        -0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.55,  0.125,  0.05, 40/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.55,  0.125, -0.67, 40/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.55,  0.125, -0.67, 40/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.55, -0.125, -0.67, 44/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.55, -0.125,  0.05, 44/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        -0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.30, -0.125, -0.67, 48/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.30,  0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.30,  0.125, -0.67, 52/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.30,  0.125,  0.05, 52/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.30, -0.125,  0.05, 48/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,

    ];

    var buffer = this.playerRightArm = createPixiBuffer(vertices);

    var vertices = [
        // Left leg

        // Top
        0.01, -0.125, 0, 4/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.3,  -0.125, 0, 8/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.3,   0.125, 0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.3,   0.125, 0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.01,  0.125, 0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        0.01, -0.125, 0, 4/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        0.01, -0.125, -0.73,  8/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.01,  0.125, -0.73,  8/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.3,   0.125, -0.73, 12/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.3,   0.125, -0.73, 12/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.3,  -0.125, -0.73, 12/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        0.01, -0.125, -0.73,  8/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        0.01, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.01, -0.125, -0.73, 4/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.3,  -0.125, -0.73, 8/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.3,  -0.125, -0.73, 8/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.3,  -0.125,     0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        0.01, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        0.01, 0.125,     0, 12/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.3,  0.125,     0, 16/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.3,  0.125, -0.73, 16/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.3,  0.125, -0.73, 16/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.01, 0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        0.01, 0.125,     0, 12/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        0.01, -0.125,     0,  8/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.01,  0.125,     0, 12/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.01,  0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.01,  0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.01, -0.125, -0.73,  8/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        0.01, -0.125,     0,  8/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        0.3, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.3, -0.125, -0.73, 4/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.3,  0.125, -0.73, 0/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.3,  0.125, -0.73, 0/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.3,  0.125,     0, 0/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        0.3, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
    ];

    var buffer = this.playerLeftLeg = createPixiBuffer(vertices);

    var vertices = [
        // Right leg

        // Top
        -0.3,  -0.125, 0, 4/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.01, -0.125, 0, 8/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.01,  0.125, 0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.01,  0.125, 0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.3,   0.125, 0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -0.3,  -0.125, 0, 4/64, 16/64, 1, 1, 1, 1, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,

        // Bottom
        -0.3,  -0.125, -0.73,  8/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.3,   0.125, -0.73,  8/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.01,  0.125, -0.73, 12/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.01,  0.125, -0.73, 12/64, 20/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.01, -0.125, -0.73, 12/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,
        -0.3,  -0.125, -0.73,  8/64, 16/64, 1, 1, 1, 1, NORMALS.DOWN.x, NORMALS.DOWN.y, NORMALS.DOWN.z,

        // Front
        -0.3,  -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.3,  -0.125, -0.73, 4/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.01, -0.125, -0.73, 8/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.01, -0.125, -0.73, 8/64, 32/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.01, -0.125,     0, 8/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,
        -0.3,  -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.FORWARD.x, NORMALS.FORWARD.y, NORMALS.FORWARD.z,

        // Rear
        -0.3,  0.125,     0, 16/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.01, 0.125,     0, 12/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.01, 0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.01, 0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.3,  0.125, -0.73, 16/64, 32/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,
        -0.3,  0.125,     0, 16/64, 20/64, 1, 1, 1, 1, NORMALS.BACK.x, NORMALS.BACK.y, NORMALS.BACK.z,

        // Right
        -0.3, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.3,  0.125,     0, 0/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.3,  0.125, -0.73, 0/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.3,  0.125, -0.73, 0/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.3, -0.125, -0.73, 4/64, 32/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,
        -0.3, -0.125,     0, 4/64, 20/64, 1, 1, 1, 1, NORMALS.RIGHT.x, NORMALS.RIGHT.y, NORMALS.RIGHT.z,

        // Left
        -0.01, -0.125,    0,   8/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.01, -0.125, -0.73,  8/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.01,  0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.01,  0.125, -0.73, 12/64, 32/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.01,  0.125,     0, 12/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
        -0.01, -0.125,     0,  8/64, 20/64, 1, 1, 1, 1, NORMALS.LEFT.x, NORMALS.LEFT.y, NORMALS.LEFT.z,
    ];

    var buffer = this.playerRightLeg = createPixiBuffer(vertices);

}

// drawLayer
PlayerModel.prototype.drawLayer = function(render, uModelMat, camPos, delta, options) {

    const shader = render.terrainShader;
    const pixiRender = render.pixiRender;
    const modelMatrix = uModelMat.uniforms.uModelMatrix;

    const gl        = this.gl;
    const scale     = options.scale;
    const z_minus   = (this.height * options.scale - this.height);

    var aniangle = 0;
    if(this.moving || Math.abs(this.aniframe) > 0.1) {
        this.aniframe += (0.1 / 1000 * delta);
        if(this.aniframe > Math.PI) {
            this.aniframe  = -Math.PI;
        }
        aniangle = Math.PI / 2 * Math.sin(this.aniframe);
        if(!this.moving && Math.abs(aniangle) < 0.1) {
            this.aniframe = 0;
        }
    }

    // Draw head
    var pitch = this.pitch;
    if(pitch < -0.5) {
        pitch = -0.5;
    }
    if(pitch > 0.5) {
        pitch = 0.5;
    }

    // Load mesh
    if(!this.playerHead) {
        // console.log('Loading mesh');
        this.loadMesh();
    }

    // Wait loading texture
    if(!options.texture) {
        // console.log('texPlayer not loaded');
        return;
    }

    var a_pos = new Vector(this.pos.x - Game.shift.x, this.pos.z - Game.shift.z, this.pos.y - Game.shift.y);

    // Draw head
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, [this.pos.x - Game.shift.x, this.pos.z - Game.shift.z, this.pos.y + this.height * options.scale - z_minus]);
    mat4.scale(modelMatrix, [scale, scale, scale]);
    mat4.rotateZ(modelMatrix, Math.PI - this.yaw);
    mat4.rotateX(modelMatrix, -pitch);
    uModelMat.update();

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, options.texture);
    render.drawBuffer(this.playerHead, a_pos);

    // Draw body
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, [this.pos.x - Game.shift.x, this.pos.z - Game.shift.z, this.pos.y + 0.01 - z_minus / 2]);
    mat4.scale(modelMatrix, [scale, scale, scale]);
    mat4.rotateZ(modelMatrix, Math.PI - this.yaw);
    //TODO: move modelMatrix to different uniform group
    uModelMat.update();
    render.drawBuffer(this.playerBody, a_pos);

    // Left arm
    mat4.translate(modelMatrix, [ 0, 0, 1.4]);
    mat4.rotateX(modelMatrix, 0.75 * aniangle);
    uModelMat.update();
    render.drawBuffer(this.playerLeftArm, a_pos);

    // Right arm
    mat4.rotateX(modelMatrix, -1.5 * aniangle);
    uModelMat.update();
    render.drawBuffer(this.playerRightArm, a_pos);
    mat4.rotateX(modelMatrix, 0.75 * aniangle);
    mat4.translate(modelMatrix, [ 0, 0, -0.67] );

    // Right leg
    mat4.rotateX(modelMatrix, 0.5 * aniangle);
    uModelMat.update();
    render.drawBuffer(this.playerRightLeg, a_pos);

    // Left leg
    mat4.rotateX(modelMatrix, -aniangle);
    uModelMat.update();
    render.drawBuffer(this.playerLeftLeg, a_pos);

    if(options.draw_nametag) {
        // Draw player name
        if(!this.nametag) {
            this.nametag = this.buildPlayerName(this.nick);
        }

        mat4.identity(modelMatrix);
        // Calculate angle so that the nametag always faces the local player
        var angZ = -Math.PI/2 + Math.atan2((camPos[2] - Game.shift.z) - (this.pos.z - Game.shift.z), (camPos[0] - Game.shift.x) - (this.pos.x - Game.shift.x));
        var angX = 0; // @todo

        mat4.translate(modelMatrix, [this.pos.x - Game.shift.x, this.pos.z - Game.shift.z, this.pos.y + (this.height + 0.35) * options.scale - z_minus]);
        mat4.rotateZ(modelMatrix, angZ);
        mat4.rotateX(modelMatrix, angX);
        mat4.scale(modelMatrix, [0.005, 1, 0.005]);
        uModelMat.update();
        gl.bindTexture(gl.TEXTURE_2D, this.nametag.texture);

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        render.drawBuffer(this.nametag.model, a_pos);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
    }

}

// Returns the texture and vertex buffer for drawing the name
// tag of the specified player over head.
PlayerModel.prototype.buildPlayerName = function(nickname) {
    nickname        = nickname.replace( /&lt;/g, "<" ).replace( /&gt;/g, ">" ).replace( /&quot;/, "\"" );
    var gl          = this.gl;
    var canvas      = this.textCanvas;
    var ctx         = this.textContext;
    var w           = ctx.measureText(nickname).width + 16;
    var h           = 45;
    // Draw text box
    ctx.fillStyle   = '#00000055';
    ctx.fillRect(0, 0, w, 45);
    ctx.fillStyle   = '#fff';
    ctx.font        = '24px Minecraftia';
    ctx.fillText(nickname, 10, 12);
    // Create texture
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Create model
    var vertices = [
        -w/2, 0, h, w/256, 0, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        w/2, 0, h, 0, 0, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        w/2, 0, 0, 0, h/64, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        w/2, 0, 0, 0, h/64, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -w/2, 0, 0, w/256, h/64, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
        -w/2, 0, h, w/256, 0, 1, 1, 1, 0.7, NORMALS.UP.x, NORMALS.UP.y, NORMALS.UP.z,
    ];
    var buffer = createPixiBuffer(vertices);
    return {
        texture: tex,
        model: buffer
    };
}
