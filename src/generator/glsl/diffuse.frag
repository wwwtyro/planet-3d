#define SHADER_NAME generator-diffuse.frag

precision highp float;

uniform sampler2D uData;
uniform sampler2D uGradient;
varying vec2 vPosition;

void main() {
    float h = texture2D(uData, vPosition * 0.5 + 0.5).a;
    vec3 color = texture2D(uGradient, vec2(h, 0.0)).rgb;
    gl_FragColor = vec4(color, 1);
}