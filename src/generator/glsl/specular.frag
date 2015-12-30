#define SHADER_NAME generator-specular.frag

precision highp float;

uniform sampler2D uData;
uniform sampler2D uGradient;
varying vec2 vPosition;

void main() {
    float h = texture2D(uData, vPosition * 0.5 + 0.5).a;
    float s = texture2D(uGradient, vec2(h, 0.0)).r;
    gl_FragColor = vec4(s,s,s, 1);
}