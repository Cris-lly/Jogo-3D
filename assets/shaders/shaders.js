
export const vertexShaderSrc = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 transf;

varying vec2 vTexCoord;
varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    gl_Position = transf * vec4(aPosition, 1.0);

    // Espaço local
    vFragPos = aPosition;

    // NORMAL FIXA (simples e funcional)
    vNormal = vec3(0.0, 1.0, 0.0);

    vTexCoord = aTexCoord;
}
`;
export const moonVertexShaderSrc= `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 transf;

varying vec2 vTexCoord;
varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    gl_Position = transf * vec4(aPosition, 1.0);

    vFragPos = aPosition;
    vNormal = normalize(aNormal);

    vTexCoord = aTexCoord;
}
`;


export const fragmentShaderSrc = `
precision mediump float;

uniform vec4 uColor;
uniform bool uUseTexture;
uniform sampler2D uTexture;

varying vec2 vTexCoord;

void main() {
    if (uUseTexture) {
        gl_FragColor = texture2D(uTexture, vTexCoord);
    } else {
        gl_FragColor = uColor;
    }
}

`;


export const moonFragmentShaderSrc = `
precision mediump float;

uniform sampler2D uTexture;
uniform bool uUseTexture;

uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uViewPos;

uniform float uShininess;

varying vec2 vTexCoord;
varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    vec3 norm = normalize(vNormal);

    // ===== POSIÇÕES =====
    vec3 lightDir = normalize(uLightPos - vFragPos); // luz principal
    vec3 viewDir  = normalize(uViewPos - vFragPos);

    // ===== DIFUSA =====
    float diff = max(dot(norm, lightDir), 0.0);

    // ===== ESPECULAR (Phong) =====
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);

    // ===== BACK LIGHT (luz vindo de trás) =====
    vec3 backLightDir = normalize(-lightDir);
    float back = max(dot(norm, -lightDir), 0.0) * 0.7;

    // ===== AMBIENTE =====
    vec3 ambient = 0.2 * uLightColor;

    vec3 lighting =
        ambient +
        diff * uLightColor +
        spec * uLightColor +
        back * uLightColor;

    vec4 baseColor = texture2D(uTexture, vTexCoord);

    gl_FragColor = vec4(baseColor.rgb * lighting, baseColor.a);
}

`;
