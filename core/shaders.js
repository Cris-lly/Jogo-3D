export const vertexShaderSrc = `
attribute vec3 aPosition;
uniform mat4 transf;

void main() {
    gl_Position = transf * vec4(aPosition, 1.0);
}
`;

export const fragmentShaderSrc = `
precision mediump float;
uniform vec4 uColor;

void main() {
    gl_FragColor = uColor;
}
`;
