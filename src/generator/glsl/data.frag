#define SHADER_NAME generator-data.frag

precision highp float;

uniform sampler2D uNormalMagGrad;
uniform vec3 uScale;
uniform vec3 uOffset;
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
    return h;
}

mat3 rotAtoB(vec3 a, vec3 b) {
    vec3 v = cross(a, b);
    float s = length(v);
    float c = dot(a, b);
    mat3 I = mat3(
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    );
    mat3 vx = mat3(
        0, v.z, -v.y,
        -v.z, 0, v.x,
        v.y, -v.x, 0
    );
    return I + vx + vx * vx * ((1.0 - c) / (s * s));
}

void main() {
    vec3 p = normalize(vPos);
    float dr = 0.0001;
    vec3 zero = vec3(0, 0, -1);
    vec3 north = vec3(0, 1, 0);
    vec3 east = vec3(1, 0, 0);
    mat3 align = rotAtoB(zero, p);
    north = align * north;
    east = align * east;
    vec3 pn = normalize(p + north * dr);
    vec3 pe = normalize(p + east * dr);
    float h = height(p);
    float hn = height(pn);
    float he = height(pe);
    float grad = texture2D(uNormalMagGrad, vec2(h, 0.0)).r;
    vec3 q = p * pow(h, grad);
    vec3 qn = pn * pow(hn, grad);
    vec3 qe = pe * pow(he, grad);
    vec3 n = normalize(cross(normalize(qn - q), normalize(qe - q)));
    n *= vec3(1,1,-1);
    n = 0.5 * (n + 1.0);
    gl_FragColor = vec4(n,h);
}