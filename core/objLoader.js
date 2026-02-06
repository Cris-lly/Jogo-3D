// core/objLoader.js

export async function loadOBJ(gl, url) {
    const response = await fetch(url);
    const text = await response.text();

    const positions = [];
    const vertices = [];

    let material = { Kd: [1, 1, 1] }; // cor padrão
    let mtlFile = null;

    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();

        // referencia ao MTL
        if (line.startsWith("mtllib ")) {
            mtlFile = line.split(/\s+/)[1];
        }

        // vértices
        if (line.startsWith("v ")) {
            const [, x, y, z] = line.split(/\s+/);
            positions.push(
                parseFloat(x),
                parseFloat(y),
                parseFloat(z)
            );
        }

        // faces
        if (line.startsWith("f ")) {
            const parts = line.split(/\s+/).slice(1);

            for (let i = 1; i < parts.length - 1; i++) {
                const i1 = parseIndex(parts[0]);
                const i2 = parseIndex(parts[i]);
                const i3 = parseIndex(parts[i + 1]);

                vertices.push(
                    positions[i1], positions[i1 + 1], positions[i1 + 2],
                    positions[i2], positions[i2 + 1], positions[i2 + 2],
                    positions[i3], positions[i3 + 1], positions[i3 + 2]
                );
            }
        }
    }

    // =======================
    // CARREGAR MTL (se existir)
    // =======================
    if (mtlFile) {
        const basePath = url.substring(0, url.lastIndexOf("/") + 1);
        material = await loadMTL(basePath + mtlFile);
    }

    // =======================
    // BUFFER
    // =======================
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
    );

    return {
        vbo,
        vertexCount: vertices.length / 3,
        color: material.Kd
    };
}

// =======================
// MTL LOADER
// =======================
async function loadMTL(url) {
    const response = await fetch(url);
    const text = await response.text();

    let kd = [1, 1, 1];

    const lines = text.split("\n");

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith("Kd ")) {
            const [, r, g, b] = line.split(/\s+/);
            kd = [
                parseFloat(r),
                parseFloat(g),
                parseFloat(b)
            ];
        }
    }

    return { Kd: kd };
}

// =======================
// INDEX
// =======================
function parseIndex(data) {
    const index = data.split("/")[0];
    return (parseInt(index) - 1) * 3;
}
