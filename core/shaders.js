export const vertexShaderSrc = `
attribute vec3 aPosition;
uniform mat4 transf;

void main() {
    gl_Position = transf * vec4(aPosition, 1.0);
}
`;

export const fragmentShaderSrc = `
precision mediump float;
void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // linhas pretas
}
`;