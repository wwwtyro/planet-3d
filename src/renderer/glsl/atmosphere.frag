#define SHADER_NAME renderer-atmosphere.frag

precision highp float;

uniform float uFrac;
uniform vec3 uLightPos;
uniform vec2 uRes;
uniform float uWrap;
uniform vec3 uColor;
uniform float uWidth;

void main() {
    float end = (1.0 + uWidth) * uFrac;
    vec2 p = (gl_FragCoord.xy - uRes*0.5)/(uRes.yy * 0.5);
    vec3 n = normalize(vec3(p, 0));
    float l = clamp(dot(normalize(uLightPos), n) + uWrap, 0.0, 1.0);
    float d = length(p);
    float c = 1.0 - smoothstep(0.0, end - uFrac, d - uFrac);
    c = step(uFrac, d) * c;
    gl_FragColor = vec4(uColor, c * l);
}