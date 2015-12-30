#define SHADER_NAME generator-normal.frag

precision highp float;

uniform sampler2D uData;
varying vec2 vPosition;

void main() {
    vec4 data = texture2D(uData, vPosition * 0.5 + 0.5);
    gl_FragColor = vec4(data.rgb, 1);
}