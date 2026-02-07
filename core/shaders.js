export const vertexShaderSrc = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 transf;

varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = transf * vec4(aPosition, 1.0);
}
`;


export const fragmentShaderSrc = `
precision mediump float;

uniform vec4 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;

varying vec2 vTexCoord;

void main() {
    if (uUseTexture) {
        gl_FragColor = texture2D(uTexture, vTexCoord);
    } else {
        gl_FragColor = uColor;
    }
}
`;


