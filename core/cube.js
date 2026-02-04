//CRIAÇÃO DO CUBO
export function createCube(gl) {
    const size = 10;

    const vertices = new Float32Array([
        -size, -size, -size,
         size, -size, -size,
         size,  size, -size,
        -size,  size, -size,

        -size, -size,  size,
         size, -size,  size,
         size,  size,  size,
        -size,  size,  size,
    ]);

    const indicesLines = new Uint16Array([
        // frente
        0,1, 1,2, 2,3, 3,0,
        // trás
        4,5, 5,6, 6,7, 7,4,
        // ligações
        0,4, 1,5, 2,6, 3,7
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesLines, gl.STATIC_DRAW);

    return {
        vbo,
        ebo,
        lineCount: indicesLines.length
    };
}

//===================================================================
//CRIAÇÃO DO RETANGULO
export function createRect(gl, width = 20, height = 10, depth = 5) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
        -w, -h, -d,
         w, -h, -d,
         w,  h, -d,
        -w,  h, -d,

        -w, -h,  d,
         w, -h,  d,
         w,  h,  d,
        -w,  h,  d,
    ]);

    const indicesLines = new Uint16Array([
        // frente
        0,1, 1,2, 2,3, 3,0,
        // trás
        4,5, 5,6, 6,7, 7,4,
        // ligações
        0,4, 1,5, 2,6, 3,7
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesLines, gl.STATIC_DRAW);

    return {
        vbo,
        ebo,
        lineCount: indicesLines.length
    };
}
