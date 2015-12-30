#define SHADER_NAME renderer-planet.vert

attribute vec3 aPosition;
attribute vec2 aUV;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec2 vUV;
varying vec3 vPos;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vUV = aUV;
    vPos = vec3(uModel * vec4(aPosition, 1.0));
}
