#define SHADER_NAME renderer-planet.frag

precision highp float;

uniform mat4 uRotation;
uniform sampler2D uClouds;
uniform sampler2D uDiffuse;
uniform sampler2D uNormal;
uniform sampler2D uSpecular;
uniform sampler2D uEmission;
uniform vec3 uAmbient;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uSpecularPower;
varying vec2 vUV;
varying vec3 vPos;

void main() {
    vec4 clouds = texture2D(uClouds, vUV);
    vec3 color = texture2D(uDiffuse, vUV).rgb;
    vec3 emission = texture2D(uEmission, vUV).rgb;
    vec3 lPos = normalize(uLightPos);
    vec3 trueNormal = normalize(vPos);
    clouds.rgb = clouds.rgb * clamp(dot(lPos, trueNormal), 0.0, 1.0);
    vec3 normal = texture2D(uNormal, vUV).rgb;
    normal = normal * 2.0 - 1.0;
    normal = vec3(uRotation * vec4(normal,1));
    float d = dot(normal, lPos);
    float specular = texture2D(uSpecular, vUV).r;
    float intensity = clamp(d, 0.0, 1.0);
    vec3 highlight = pow(clamp(d, 0.0, 1.0), uSpecularPower) * uLightColor * specular;
    vec3 baseColor = color * uLightColor * intensity + uAmbient + highlight + emission;
    gl_FragColor = vec4(mix(baseColor, clouds.rgb, clouds.a), 1.0);
}