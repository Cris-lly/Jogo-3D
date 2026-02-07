// game.js
import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRect, createWireRect } from "../core/cube.js";
import { loadTexture } from "../core/loadTexture.js";

import {
    camPos,
    enableMouse,
    updateCameraPosition,
    canInteract,
    currentInteraction,
    keys,
    addInteractionZone,
    addObstacle
} from "../core/input.js";
import { loadOBJ } from "../core/objLoader.js";


const outlineColor = [0.043, 0.059, 0.129, 1.0]; // #0B0F21
// =======================
// CANVAS
// =======================
const canvas = document.getElementById("glCanvas");
const modal = document.getElementById("modalInfo");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

// =======================
// HUD / INTERAÇÃO
// =======================
const container = document.getElementById("progressContainer");
const bar       = document.getElementById("progressBar");

const INTERACTION_TIME = 120;
const interactionState = { painel: 0, electric: 0, door: 0 };

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
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSrc));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc));
gl.linkProgram(program);
gl.useProgram(program);



function drawSolidRect(rect, color) {
    gl.uniform1i(useTexLoc, false);
    gl.uniform4fv(colorLoc, color);

    // vértices
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.vbo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // triângulos
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rect.ebo);
    gl.drawElements(gl.TRIANGLES, rect.indexCount, gl.UNSIGNED_SHORT, 0);
}

function drawWireRect(rect, color) {
    gl.uniform1i(useTexLoc, false);
    gl.uniform4fv(colorLoc, color);

    gl.bindBuffer(gl.ARRAY_BUFFER, rect.vbo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rect.lbo);
    gl.drawElements(gl.LINES, rect.lineCount, gl.UNSIGNED_SHORT, 0);
}
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
const ceilingTexture = loadTexture(gl, "./assets/texture/teto.jpg");
// =======================
// PAINEL PRINCIPAL
// =======================
const panelW = 40, panelH = 6, panelD = 6;
const panelY = -(roomHeight / 2) + panelH / 2; // encostado no chão
const panelZ = -(roomDepth / 2) + wallThickness + panelD / 2 + 0.01; // encostado na parede

const panel = createWireRect(gl, panelW, panelH, panelD, [0, panelY, panelZ]);

addObstacle({
    minX: -panelW / 2,
    maxX:  panelW / 2,
    minY: panelY - panelH / 2,
    maxY: panelY + panelH / 2,
    minZ: panelZ - panelD / 2,
    maxZ: panelZ + panelD / 2
});

addInteractionZone({
    id: "painel",
    minX: -panelW / 2,
    maxX:  panelW / 2,
    minZ: panelZ - panelD / 2 - 1.5,
    maxZ: panelZ + panelD / 2 + 1.5
});

// =======================
// PAINEL ELÉTRICO
// =======================
const electricW = 6, electricH = 10, electricD = 2;
const electricX = (roomWidth / 2) - wallThickness - electricD / 2 - 0.01;

const electricPanel = createWireRect(
    gl,
    electricD,
    electricH,
    electricW,
    [electricX, 0, 0]
);
addObstacle({
    minX: electricX - electricD / 2,
    maxX: electricX + electricD / 2,
    minY: -electricH / 2,
    maxY:  electricH / 2,
    minZ: -electricW / 2,
    maxZ:  electricW / 2
});

addInteractionZone({
    id: "electric",
    minX: electricX - electricD / 2 - 1.5,
    maxX: electricX + electricD / 2 + 1.5,
    minZ: -electricW / 2 - 1.5,
    maxZ:  electricW / 2 + 1.5
});

// =======================
// PORTA
// =======================
const doorW = 12, doorH = 18, doorD = 2;
const doorZ = +(roomDepth / 2) - wallThickness - doorD / 2 - 0.01;

const door = createWireRect(
  gl,
  doorW,
  doorH,
  doorD,
  [0, -(roomHeight / 2) + doorH / 2, doorZ]
);


addObstacle({
    minX: -doorW / 2,
    maxX:  doorW / 2,
    minY: -(roomHeight / 2),
    maxY: -(roomHeight / 2) + doorH,
    minZ: doorZ - doorD / 2,
    maxZ: doorZ + doorD / 2
});

addInteractionZone({
    id: "door",
    minX: -doorW / 2 - 1.5,
    maxX:  doorW / 2 + 1.5,
    minZ: doorZ - 2.5,
    maxZ: doorZ + 2.5
});

// =======================
// JANELA (VISUAL, SEM COLISÃO)
// =======================
const spaceWindow = createWireRect(gl, 50, 15, 0.1, [0, 0, -(roomDepth / 2) + wallThickness + 0.05]);
const windowTexture = loadTexture(gl, "./assets/texture/universo.jpg");

// =======================
// ASTRONAUTA
// =======================
const floatAmplitude = 0.8;
const floatSpeed = 0.002;
let objeto = null;

const objWidth  = 4;
const objHeight = 6;
const objDepth  = 3;
const objScale = 8.0; // 
const objRotation = 80 * Math.PI / 180;
const astronautColor = [1.0, 1.0, 1.0, 1.0]; // branco


const objX = -(roomWidth / 2) + (objWidth / 2); // lateral esquerda
const objY = -(roomHeight / 2) + (objHeight / 2); // chão
const objZ = 0;
const floatY = Math.sin(performance.now() * floatSpeed) * floatAmplitude;
addObstacle({
    minX: objX - objWidth / 2,
    maxX: objX + objWidth / 2,
    minY: objY - objHeight / 2 + floatY,
    maxY: objY + objHeight / 2 + floatY,
    minZ: objZ - objDepth / 2,
    maxZ: objZ + objDepth / 2
});


(async function loadModels() {
    objeto = await loadOBJ(gl, "./assets/models/astronaut.obj");
})();




function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}
function worldToScreen(pos, viewProj, width, height) {
  const [x, y, z] = pos;
  const v = [x, y, z, 1];

  const r = new Float32Array(4);
  for (let i = 0; i < 4; i++) {
    r[i] =
      v[0] * viewProj[i] +
      v[1] * viewProj[i + 4] +
      v[2] * viewProj[i + 8] +
      v[3] * viewProj[i + 12];
  }

  const ndcX = r[0] / r[3];
  const ndcY = r[1] / r[3];

  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (-ndcY * 0.5 + 0.5) * height
  };
}



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
        0, 1, 0, 0,
        s, 0,  c, 0,
        0, 0, 0, 1
    ]);
}

function drawRect(rect, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, rect.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rect.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
    gl.uniform4fv(colorLoc, color);
    gl.drawElements(gl.LINES, rect.lineCount, gl.UNSIGNED_SHORT, 0);
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

const floorTexture = loadTexture(gl, "./assets/texture/piso (1).jpg");

gl.enable(gl.DEPTH_TEST);
gl.activeTexture(gl.TEXTURE0);

const wallTexture = loadTexture(gl, "./assets/texture/parede.jpg");
// =======================
// RENDER LOOP
// =======================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
    const dir = updateCameraPosition();

    // ===== INTERAÇÃO =====
    if (canInteract && currentInteraction) {
        if (keys["e"]) {
            interactionState[currentInteraction]++;
            if (interactionState[currentInteraction] >= INTERACTION_TIME) {
                interactionState[currentInteraction] = INTERACTION_TIME;
                console.log("INTERAÇÃO CONCLUÍDA:", currentInteraction);
            }
        } else {
            interactionState[currentInteraction] = 0;
        }

        const progress = Math.min(interactionState[currentInteraction] / INTERACTION_TIME, 1);
        bar.style.width = (progress * 100) + "%";
        container.style.display = "block";
    } else {
        container.style.display = "none";
        bar.style.width = "0%";
    }

    const cam = createCamera(
        camPos,
        [camPos[0] + dir[0], camPos[1] + dir[1], camPos[2] + dir[2]],
        [0, 1, 0]
    );

    gl.uniformMatrix4fv(transfLoc, false, multiply(proj, cam));

    // =======================
    // DESENHO SALA
    // =======================
    // paredes com textura
    drawTexturedSurface(wallFront, wallTexture);
    drawTexturedSurface(wallBack,  wallTexture);
    drawTexturedSurface(wallLeft,  wallTexture);
    drawTexturedSurface(wallRight, wallTexture);


    drawTexturedRect(floor); // 👈 chão com imagem

    drawTexturedSurface(ceiling,    ceilingTexture);


    drawSolidRect(panel,         [0.208, 0.235, 0.388, 1.0]);
    drawWireRect(panel, outlineColor);

    // painel elétrico sólido
    drawSolidRect(electricPanel, [0.741, 0.808, 0.910, 1.0]);
    drawWireRect(electricPanel, outlineColor);

    drawSolidRect(door,          [0.729, 0.749, 0.776, 1.0]);
    drawWireRect(door, outlineColor);


    drawTexturedSurface(spaceWindow, windowTexture);

    // =======================
    // DESENHO ASTRONAUTA
    // =======================
    if (objeto) {
        const time = performance.now();
        const floatY = Math.sin(time * floatSpeed) * floatAmplitude;

        const S = scaleMatrix(objScale, objScale, objScale);
        const R = rotateY(objRotation);
        const T = translate(objX, objY + floatY, objZ);

        const model = multiply(T, multiply(R, S));

        gl.uniformMatrix4fv(transfLoc, false, multiply(proj, multiply(cam, model)));
        gl.bindBuffer(gl.ARRAY_BUFFER, objeto.vbo);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);

        gl.uniform4fv(colorLoc, astronautColor);
        gl.drawArrays(gl.TRIANGLES, 0, objeto.vertexCount);

        gl.uniform4fv(colorLoc, outlineColor);
        gl.drawArrays(gl.LINES, 0, objeto.vertexCount);


        const objWorldPos = [objX, objY, objZ];
    const d = distance(camPos, objWorldPos);

    const SHOW_DISTANCE = 12;

    if (d < SHOW_DISTANCE) {
        modal.style.display = "block";

        const vp = multiply(proj, cam);

        const screenPos = worldToScreen(
            [objX, objY + 8, objZ], // acima do astronauta
            vp,
            canvas.width,
            canvas.height
        );

        modal.style.left = `${screenPos.x}px`;
        modal.style.top  = `${screenPos.y}px`;
        } else {
        modal.style.display = "none";
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
    }
    }

    requestAnimationFrame(render);
}

console.log("GAME.JS CARREGADO");
render();
