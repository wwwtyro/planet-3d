#define SHADER_NAME generator-clouds.frag

precision highp float;

uniform vec3 uScale;
uniform vec3 uOffset;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uFalloff;
uniform int uDetail;

varying vec3 vPos;

#pragma glslify: cnoise4d = require(glsl-noise/classic/4d)

float noise(vec3 p) {
    return cnoise4d(vec4(p, 0));
}

float normalNoise(vec3 p) {
    return 0.5 * noise(p) + 0.5;
}

float height(vec3 p) {
    p += uOffset;
    p *= uScale;
    const int steps = 9;
    int detail = int(max(1.0, min(float(steps), float(uDetail))));
    float scale = pow(2.0, float(detail));
    vec3 displace;
    for (int i = 0; i < steps; i++) {
        if (i >= detail) {
            break;
        }
        displace = vec3(
            normalNoise(p.xyz * scale + displace),
            normalNoise(p.yzx * scale + displace),
            normalNoise(p.zxy * scale + displace)
        );
        scale *= 0.5;
    }
    float h = normalNoise(p * scale + displace);
    h = pow(h, uFalloff);
    h = h * uOpacity;
    return h;
}

void main() {
    vec3 p = normalize(vPos);
    float h = height(p);
    gl_FragColor = vec4(uColor,h);
}