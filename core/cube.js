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
// =====================
// RETÂNGULO (WIREFRAME)
// =====================
export function createRect(gl, width, height, depth, position = [0,0,0]) {
    const [px, py, pz] = position;
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
        -w+px, -h+py, -d+pz,
         w+px, -h+py, -d+pz,
         w+px,  h+py, -d+pz,
        -w+px,  h+py, -d+pz,

        -w+px, -h+py,  d+pz,
         w+px, -h+py,  d+pz,
         w+px,  h+py,  d+pz,
        -w+px,  h+py,  d+pz
    ]);

    const indices = new Uint16Array([
        0,1, 1,2, 2,3, 3,0,
        4,5, 5,6, 6,7, 7,4,
        0,4, 1,5, 2,6, 3,7
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return { vbo, ebo, lineCount: indices.length };
}

export function createWireRect(gl, width, height, depth, position = [0,0,0]) {

    const [px, py, pz] = position;
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    // ======================
    // VÉRTICES (24 para UV)
    // ======================
    const vertices = new Float32Array([
        // Frente
        -w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,
        // Trás
         w, -h, -d,  -w, -h, -d,  -w,  h, -d,   w,  h, -d,
        // Topo
        -w,  h,  d,   w,  h,  d,   w,  h, -d,  -w,  h, -d,
        // Base
        -w, -h, -d,   w, -h, -d,   w, -h,  d,  -w, -h,  d,
        // Direita
         w, -h,  d,   w, -h, -d,   w,  h, -d,   w,  h,  d,
        // Esquerda
        -w, -h, -d,  -w, -h,  d,  -w,  h,  d,  -w,  h, -d
    ].map((v, i) =>
        i % 3 === 0 ? v + px :
        i % 3 === 1 ? v + py :
                      v + pz
    ));

    // ======================
    // UVs
    // ======================
    const texCoords = new Float32Array([
        0,0, 1,0, 1,1, 0,1,
        0,0, 1,0, 1,1, 0,1,
        0,0, 1,0, 1,1, 0,1,
        0,0, 1,0, 1,1, 0,1,
        0,0, 1,0, 1,1, 0,1,
        0,0, 1,0, 1,1, 0,1
    ]);

    // ======================
    // ÍNDICES TRIÂNGULOS
    // ======================
    const indices = new Uint16Array([
        0,1,2, 0,2,3,
        4,5,6, 4,6,7,
        8,9,10, 8,10,11,
        12,13,14, 12,14,15,
        16,17,18, 16,18,19,
        20,21,22, 20,22,23
    ]);

    // ======================
    // ÍNDICES WIREFRAME
    // ======================
    const lineIndices = new Uint16Array([
        0,1, 1,2, 2,3, 3,0,
        4,5, 5,6, 6,7, 7,4,
        0,4, 1,5, 2,6, 3,7
    ]);

    // ======================
    // BUFFERS
    // ======================
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const tbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const lbo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.STATIC_DRAW);

    return {
        vbo,
        tbo,
        ebo,          // triângulos (textura)
        lbo,          // linhas (wireframe)
        indexCount: indices.length,
        lineCount: lineIndices.length
    };
}

// =====================
// SALA SÓLIDA
// =====================


export function createRoomWireframe(gl, width, height, depth) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
        -w,-h,-d,  w,-h,-d,  w, h,-d, -w, h,-d,
        -w,-h, d,  w,-h, d,  w, h, d, -w, h, d
    ]);

    const indices = new Uint16Array([
        0,1, 1,2, 2,3, 3,0,   // frente
        4,5, 5,6, 6,7, 7,4,   // trás
        0,4, 1,5, 2,6, 3,7    // ligações
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
        vbo,
        ebo,
        lineCount: indices.length
    };
}