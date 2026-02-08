import { moonFragmentShaderSrc ,moonVertexShaderSrc} from "../assets/shaders/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRect, createWireRect } from "../core/cube.js";
import { loadTexture } from "../core/loadTexture.js";

import {
    camPos,
    enableMouse,
    updateCameraPosition
} from "../core/input.js";

let running = true;

// =======================
// CANVAS
// =======================
const canvas = document.getElementById("glCanvas");
const modal = document.getElementById("modalInfo");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;


// =======================
// WEBGL
// =======================
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
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, moonVertexShaderSrc));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, moonFragmentShaderSrc));
gl.linkProgram(program);
gl.useProgram(program);
// ===== PHONG: UNIFORMS =====
const uLightPosLoc   = gl.getUniformLocation(program, "uLightPos");
const uViewPosLoc    = gl.getUniformLocation(program, "uViewPos");
const uLightColorLoc = gl.getUniformLocation(program, "uLightColor");
const uShininessLoc  = gl.getUniformLocation(program, "uShininess");

// ===== VALORES =====
gl.uniform3fv(uLightPosLoc, [2.0, 4.0, 2.0]);   // posição da luz (sol)
gl.uniform3fv(uViewPosLoc, camPos);            // posição da câmera
gl.uniform3fv(uLightColorLoc, [1.0, 1.0, 1.0]); // luz branca
gl.uniform1f(uShininessLoc, 32.0);              // brilho Phong


const lightPosLoc  = gl.getUniformLocation(program, "uLightPos");
const viewPosLoc   = gl.getUniformLocation(program, "uViewPos");
const lightColorLoc = gl.getUniformLocation(program, "uLightColor");


// =======================
// DIMENSÕES DA SALA
// =======================
const roomWidth  = 60;
const roomHeight = 30;
const roomDepth  = 90;
const wallThickness = 0.5;

// =======================
// PAREDES
// =======================
const wallFront = createWireRect(gl, roomWidth, roomHeight, wallThickness, [0, 0, -(roomDepth / 2)]);
const wallBack  = createWireRect(gl, roomWidth, roomHeight, wallThickness, [0, 0, +(roomDepth / 2)]);
const wallLeft  = createWireRect(gl, wallThickness, roomHeight, roomDepth, [-(roomWidth / 2), 0, 0]);
const wallRight = createWireRect(gl, wallThickness, roomHeight, roomDepth, [+(roomWidth / 2), 0, 0]);
const floor     = createWireRect(gl, roomWidth, wallThickness, roomDepth, [0, -(roomHeight / 2), 0]);
const ceiling   = createWireRect(gl, roomWidth, wallThickness, roomDepth, [0, +(roomHeight / 2), 0]);
const ceilingTexture = loadTexture(gl, "./assets/texture/tetoLua.png");


// =======================
// WEBGL STATE
// =======================
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.961, 0.961, 0.961, 1.0);

const transfLoc = gl.getUniformLocation(program, "transf");
const colorLoc  = gl.getUniformLocation(program, "uColor");
const posLoc    = gl.getAttribLocation(program, "aPosition");
const texLoc        = gl.getAttribLocation(program, "aTexCoord");
const useTexLoc     = gl.getUniformLocation(program, "uUseTexture");
const textureLoc    = gl.getUniformLocation(program, "uTexture");


// =======================
// MATRIZ / UTILIDADES
// =======================
function multiply(a, b) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            r[j*4+i] = a[i]*b[j*4] + a[i+4]*b[j*4+1] + a[i+8]*b[j*4+2] + a[i+12]*b[j*4+3];
    return r;
}

function drawTexturedRect(rect) {
    gl.uniform1i(useTexLoc, true);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    gl.uniform1i(textureLoc, 0);

    // posição
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.vbo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // UV
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.tbo);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texLoc);

    // triângulos
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rect.ebo);
    gl.drawElements(gl.TRIANGLES, rect.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(useTexLoc, false);
}

function drawTexturedSurface(rect, texture) {
    gl.uniform1i(useTexLoc, true);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLoc, 0);

    // posição
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.vbo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // UV
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.tbo);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texLoc);

    // triângulos
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rect.ebo);
    gl.drawElements(gl.TRIANGLES, rect.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(useTexLoc, false);
}

const floorTexture = loadTexture(gl, "./assets/texture/pisoLua.jpg");

gl.enable(gl.DEPTH_TEST);
gl.activeTexture(gl.TEXTURE0);

const wallTextureBack = loadTexture(gl, "./assets/texture/fundoLua.png");
const wallTextureFront = loadTexture(gl, "./assets/texture/paredeFrente.png");
const wallTextureDir = loadTexture(gl, "./assets/texture/paredeDir.png");
const wallTextureEsq = loadTexture(gl, "./assets/texture/paredeEsq.png");
// =======================
// RENDER LOOP
// =======================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
    const dir = updateCameraPosition();

    const cam = createCamera(
        camPos,
        [camPos[0] + dir[0], camPos[1] + dir[1], camPos[2] + dir[2]],
        [0, 1, 0]
    );

    gl.uniformMatrix4fv(transfLoc, false, multiply(proj, cam));
    gl.uniform3fv(lightPosLoc, [50, 80, 50]);
    gl.uniform3fv(lightColorLoc, [1.0, 1.0, 1.0]);

    // Posição da câmera (necessário pro specular)
    gl.uniform3fv(viewPosLoc, camPos);

    gl.uniform3fv(uLightPosLoc, [2.0, 4.0, 2.0]);
    gl.uniform3fv(uViewPosLoc, camPos); // posição da câmera
    gl.uniform3fv(uLightColorLoc, [1.0, 1.0, 1.0]);
    gl.uniform1f(uShininessLoc, 32.0);

    // =======================
    // DESENHO SALA
    // =======================
    // paredes com textura
    drawTexturedSurface(wallFront, wallTextureFront);
    drawTexturedSurface(wallBack,  wallTextureBack);
    drawTexturedSurface(wallLeft,  wallTextureEsq);
    drawTexturedSurface(wallRight, wallTextureDir);


    drawTexturedRect(floor); // 

    drawTexturedSurface(ceiling,    ceilingTexture);
    

    if (running) {
        requestAnimationFrame(render);
    }
}

export function stopGame() {
       running = false;
}

console.log("GAME.JS CARREGADO");
render();