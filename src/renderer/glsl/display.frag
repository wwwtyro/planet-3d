#define SHADER_NAME renderer-display.frag

precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uBlur;
uniform sampler2D uAtmosphere;
uniform vec2 uRes;

void main() {
    vec2 p = gl_FragCoord.xy/uRes;
    vec4 color = texture2D(uTexture, p);
    vec4 blur = texture2D(uBlur, p);
    vec4 atmo = texture2D(uAtmosphere, p);
    gl_FragColor = color + blur + atmo * atmo.a;
}