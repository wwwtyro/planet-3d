#define SHADER_NAME generator-quad.vert

attribute vec3 aPosition;
varying vec2 vPosition;
void main() {
    gl_Position = vec4(aPosition, 1.0);
    vPosition = aPosition.xy;
}
