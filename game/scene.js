export function createRoom(gl, program) {
    const s = 5;

    const vertices = new Float32Array([
        // frente
        -s,-s,-s,  s,-s,-s,  s, s,-s,
        -s,-s,-s,  s, s,-s, -s, s,-s,

        // trás
         s,-s, s, -s,-s, s, -s, s, s,
         s,-s, s, -s, s, s,  s, s, s,

        // esquerda
        -s,-s, s, -s,-s,-s, -s, s,-s,
        -s,-s, s, -s, s,-s, -s, s, s,

        // direita
         s,-s,-s,  s,-s, s,  s, s, s,
         s,-s,-s,  s, s, s,  s, s,-s,

        // teto
        -s, s,-s,  s, s,-s,  s, s, s,
        -s, s,-s,  s, s, s, -s, s, s,

        // chão
        -s,-s, s,  s,-s, s,  s,-s,-s,
        -s,-s, s,  s,-s,-s, -s,-s,-s
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    return vertices.length / 3;
}
