#define SHADER_NAME renderer-emission.frag

precision highp float;

uniform sampler2D uEmission;
varying vec2 vUV;

void main() {
    gl_FragColor = texture2D(uEmission, vUV);
}