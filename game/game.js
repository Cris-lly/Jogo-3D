import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRoomWireframe, createRect } from "../core/cube.js";
import {
    camPos,
    enableMouse,
    updateCameraPosition,
    addObstacle
} from "../core/input.js";

import { loadOBJ } from "../core/objLoader.js";


// =======================
// CANVAS
// =======================
const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
if (!gl) alert("WebGL não suportado");

gl.viewport(0, 0, canvas.width, canvas.height);
enableMouse(canvas);

// =======================
// SHADERS
// =======================
function compileShader(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSrc));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc));
gl.linkProgram(program);
gl.useProgram(program);

// =======================
// OBJETOS
// =======================

// SALA (WIREFRAME)
const roomWidth  = 60;
const roomHeight = 30;
const roomDepth  = 90;

const room = createRoomWireframe(
    gl,
    roomWidth,
    roomHeight,
    roomDepth
);

// PAINEL
const panelWidth  = 40; // largura (X)
const panelHeight = 6; // altura (Y)
const panelDepth  = 6;  // espessura (Z)
const objWidth  = 4;
const objHeight = 6;
const objDepth  = 3;
const objScale = 6.0; // 
const objRotation = 80 * Math.PI / 180;
const astronautColor = [1.0, 1.0, 1.0, 1.0]; // branco



const objX = -(roomWidth / 2) + (objWidth / 2); // lateral esquerda
const objY = -(roomHeight / 2) + (objHeight / 2); // chão
const objZ = 0;



const panelY = -(roomHeight / 2) + (panelHeight / 2);
const panelZ = -(roomDepth / 2) + (panelDepth / 2) + 0.01;

const panel = createRect(
    gl,
    panelWidth,
    panelHeight,
    panelDepth,
    [0, panelY, panelZ]
);

// =======================
// Astronauta
// =======================
const floatAmplitude = 0.8; // quanto sobe/desce
const floatSpeed = 0.002;  // velocidade da flutuação


let objeto = null;

(async function loadModels() {
    objeto = await loadOBJ(
        gl,
        "./assets/models/astronaut.obj"
    );
})();


// =======================
// COLISÃO DO PAINEL
// =======================
addObstacle({
    minX: -panelWidth / 2,
    maxX:  panelWidth / 2,

    minY: panelY - panelHeight / 2,
    maxY: panelY + panelHeight / 2,

    minZ: panelZ - panelDepth / 2,
    maxZ: panelZ + panelDepth / 2
});


// =======================
// WEBGL STATE
// =======================
gl.enable(gl.DEPTH_TEST);

// fundo claro → contraste com as linhas
gl.clearColor(0.9, 0.9, 0.95, 1.0);

// =======================
// UNIFORMS / ATTRIBUTES
// =======================
const transfLoc = gl.getUniformLocation(program, "transf");
const colorLoc  = gl.getUniformLocation(program, "uColor");
const posLoc    = gl.getAttribLocation(program, "aPosition");

// =======================
// MATRIZ
// =======================
function multiply(a, b) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            r[j * 4 + i] =
                a[i] * b[j * 4] +
                a[i + 4] * b[j * 4 + 1] +
                a[i + 8] * b[j * 4 + 2] +
                a[i + 12] * b[j * 4 + 3];
        }
    }
    return r;
}

// Transformações geométricas

function translate(x, y, z) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

function scaleMatrix(sx, sy, sz) {
    return new Float32Array([
        sx, 0,  0,  0,
        0,  sy, 0,  0,
        0,  0,  sz, 0,
        0,  0,  0,  1
    ]);
}

function rotateY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([
         c, 0, -s, 0,
         0, 1,  0, 0,
         s, 0,  c, 0,
         0, 0,  0, 1
    ]);
}

// =======================
// RENDER
// =======================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(
        Math.PI / 3,
        canvas.width / canvas.height,
        0.1,
        1000
    );

    const dir = updateCameraPosition();

    const cam = createCamera(
        camPos,
        [
            camPos[0] + dir[0],
            camPos[1] + dir[1],
            camPos[2] + dir[2]
        ],
        [0, 1, 0]
    );

    gl.uniformMatrix4fv(
        transfLoc,
        false,
        multiply(proj, cam)
    );

    // =======================
    // SALA (WIREFRAME)
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, room.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, room.ebo);

    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.uniform4f(colorLoc, 0.15, 0.15, 0.15, 1.0);
    gl.drawElements(gl.LINES, room.lineCount, gl.UNSIGNED_SHORT, 0);

    // =======================
    // PAINEL
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, panel.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, panel.ebo);

    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4f(colorLoc, 0.2, 0.2, 0.2, 1.0);
    gl.drawElements(gl.LINES, panel.lineCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
    
    // =======================
    // ASTRONAUTA (OBJ)
    // =======================
    if (objeto) {
        // =======================
        // FLUTUAÇÃO
        // =======================
        const time = performance.now();
        const floatY = Math.sin(time * floatSpeed) * floatAmplitude;

        // =======================
        // MATRIZ DO MODELO (MANTIDA)
        // =======================
        const S = scaleMatrix(objScale, objScale, objScale);
        const R = rotateY(objRotation);
        const T = translate(objX, objY + floatY, objZ); // 👈 só aqui muda

        const model = multiply(T, multiply(R, S));

        gl.uniformMatrix4fv(
            transfLoc,
            false,
            multiply(proj, multiply(cam, model))
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, objeto.vbo);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);

        // =======================
        // OBJETO SÓLIDO
        // =======================
        gl.uniform4fv(colorLoc, astronautColor);
        gl.drawArrays(gl.TRIANGLES, 0, objeto.vertexCount);

        // =======================
        // WIREFRAME
        // =======================
        gl.uniform4f(colorLoc, 0.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.LINES, 0, objeto.vertexCount);
    }





}

console.log("GAME.JS CARREGADO");
render();
