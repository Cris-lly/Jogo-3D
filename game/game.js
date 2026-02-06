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
}

console.log("GAME.JS CARREGADO");
render();
