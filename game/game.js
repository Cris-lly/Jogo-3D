import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createCube } from "../core/cube.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRoom } from "./scene.js";
//==============================================
//CONTROLES DO TECLADO
let yaw = 0;              // rotação esquerda/direita
const turnSpeed = 0.2;  // velocidade de giro

const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});
//=================================================

const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
if (!gl) {
    alert("WebGL não suportado");
}
gl.viewport(0, 0, canvas.width, canvas.height);


function draw() {
   // projection
   // camera
   // uniforms
   // gl.drawArrays
}

// === Shaders ===
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// === Geometria do cubo ===
const cube = createCube(gl);

// === Limpeza ===
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.6, 0.6, 0.6, 1.0);


//========================
gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
const transfLoc = gl.getUniformLocation(program, "transf");

// === Loop ===
function multiply(a, b) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            r[j*4+i] =
                a[i]   * b[j*4] +
                a[i+4] * b[j*4+1] +
                a[i+8] * b[j*4+2] +
                a[i+12]* b[j*4+3];
        }
    }
    return r;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(
        Math.PI / 3,
        canvas.width / canvas.height,
        0.1,
        100
    );

    // === ROTACAO COM A / D ===
    if (keys["a"]) yaw += turnSpeed;
    if (keys["d"]) yaw -= turnSpeed;

    const dir = [
        Math.sin(yaw),
        0,
        -Math.cos(yaw)
    ];

    const camPos = [0, 0, 10];

    const cam = createCamera(
        camPos,
        [
            camPos[0] + dir[0],
            camPos[1] + dir[1],
            camPos[2] + dir[2]
        ],
        [0, 1, 0]
    );

    const transf = multiply(proj, cam);
    gl.uniformMatrix4fv(transfLoc, false, transf);

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.ebo);

    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.drawElements(
        gl.LINES,
        cube.lineCount,
        gl.UNSIGNED_SHORT,
        0
    );

    // 🔁 LOOP
    requestAnimationFrame(render);
}



console.log("GAME.JS CARREGADO");
document.body.style.background = "blue";
console.log("ARESTAS:", cube.lineCount);


render();
