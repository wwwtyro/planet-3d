#define SHADER_NAME generator-data.vert

attribute vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPos;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vPos = vec3(uModel * vec4(aPosition, 1.0));
}