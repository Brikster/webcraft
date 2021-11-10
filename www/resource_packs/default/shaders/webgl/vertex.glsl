#version 300 es

in vec3 a_position;
in vec3 a_axisX;
in vec3 a_axisY;
in vec2 a_uvCenter;
in vec2 a_uvSize;
in vec3 a_color;
in vec4 a_occlusion;
in float a_flags;
in vec2 a_quad;
in vec4 a_quadOcc;

uniform mat4 uProjMatrix;
uniform mat4 u_worldView;
uniform mat4 uModelMatrix;
uniform bool u_fogOn;
uniform float u_brightness;
uniform vec3 u_add_pos;
uniform float u_pixelSize;
uniform vec2 u_resolution;
uniform vec3 u_shift;
uniform bool u_TestLightOn;
uniform vec3 u_SunDir; // = vec3(0.7, 1.0, 0.85);

out vec3 world_pos;
out vec3 v_position;
out vec2 v_texcoord;
out vec4 v_texClamp;
out vec4 v_color;
out vec3 v_normal;
out float light;
out vec4 crosshair;

void main() {
    v_color         = vec4(a_color, dot(a_occlusion, a_quadOcc));

    // find flags
    float flagBiome = step(1.5, a_flags);
    float flags = a_flags - flagBiome * 2.0;
    float flagNormalUp = step(0.5, flags);

    if (flagNormalUp > 0.0) {
        v_normal = -a_axisY;
    } else {
        v_normal = normalize(cross(a_axisX, a_axisY));
    }

    // Crosshair
    if(u_resolution.x > u_resolution.y) {
        crosshair = vec4(0., 0., u_resolution.x * 0.001, u_resolution.x * 0.001 * 7.);
    } else {
        crosshair = vec4(0., 0., u_resolution.y * 0.001, u_resolution.y * 0.001 * 7.);
    }

    v_normal.yz = v_normal.zy;

    vec3 pos = a_position + (a_axisX * a_quad.x) + (a_axisY * a_quad.y);

    v_texcoord = a_uvCenter + (a_uvSize * a_quad);

    // flip UV for top quad
    // todo Looks dirty but working
    if (abs(v_normal.y) * (1. - flagNormalUp) > 0.5 ) {
        v_texcoord.y = a_uvCenter.y - (a_uvSize.y * a_quad.y);
    }

    v_texClamp = vec4(a_uvCenter - abs(a_uvSize * 0.5) + u_pixelSize * 0.5, a_uvCenter + abs(a_uvSize * 0.5) - u_pixelSize * 0.5);

    vec3 n = normalize(v_normal);
    // light = 1. - v_color.a;
    light = max(.5, max(.7, dot(n, u_SunDir)) - v_color.a);

    if(u_fogOn) {
        if (flagBiome < 0.5) {
            v_color.r = -1.0;
        }
    }

    world_pos = (uModelMatrix *  vec4(pos, 1.0)).xyz + u_add_pos;
    v_position = (u_worldView * vec4(world_pos, 1.0)). xyz;
    gl_Position = uProjMatrix * vec4(v_position, 1.0);
}