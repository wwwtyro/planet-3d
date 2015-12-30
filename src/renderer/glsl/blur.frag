#define SHADER_NAME renderer-blur.frag

precision highp float;

uniform sampler2D uTexture;
uniform vec2 uDir;
uniform vec2 uRes;
uniform float uStrength;

void main() {
    vec2 size = 1.0/uRes;
    vec2 p = gl_FragCoord.xy;
    vec4 color;
    color += texture2D(uTexture, (p + uDir * 4.0) * size) * 0.0162162162;
    color += texture2D(uTexture, (p + uDir * 3.0) * size) * 0.0540540541;
    color += texture2D(uTexture, (p + uDir * 2.0) * size) * 0.1216216216;
    color += texture2D(uTexture, (p + uDir * 1.0) * size) * 0.1945945946;
    color += texture2D(uTexture, (p + uDir * 0.0) * size) * 0.2270270270;
    color += texture2D(uTexture, (p - uDir * 1.0) * size) * 0.1945945946;
    color += texture2D(uTexture, (p - uDir * 2.0) * size) * 0.1216216216;
    color += texture2D(uTexture, (p - uDir * 3.0) * size) * 0.0540540541;
    color += texture2D(uTexture, (p - uDir * 4.0) * size) * 0.0162162162;
    color *= uStrength;
    gl_FragColor = vec4(color.rgb, color.r+color.g+color.b);
}