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
let running = true;

const outlineColor = [0.043, 0.059, 0.129, 1.0]; // #0B0F21
// =======================
// CANVAS
// =======================
const canvas = document.getElementById("glCanvas");
const modal  = document.getElementById("modalInfo");

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("wheel", e => e.preventDefault(), { passive:false });

// =======================
// HUD / PROGRESS BAR
// =======================
const container = document.getElementById("progressContainer");
const bar       = document.getElementById("progressBar");

const INTERACTION_TIME = 120;

// progresso independente por missão
const interactionState = {
    painel: 0,
    electric: 0,
    door: 0
};

// conclusão independente por missão
const completed = {
    painel: false,
    electric: false,
    door: false
};

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
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
    }
    return s;
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
// SALA
// =======================
const roomWidth = 60;
const roomHeight = 30;
const roomDepth = 90;
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
    minX:-20, maxX:20,
    minY:-roomHeight/2, maxY:-roomHeight/2+6,
    minZ:-roomDepth/2+0.5, maxZ:-roomDepth/2+6
});

addInteractionZone({
    id:"painel",
    minX:-20, maxX:20,
    minZ:-roomDepth/2+2, maxZ:-roomDepth/2+8
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
    minX:roomWidth/2-2, maxX:roomWidth/2,
    minY:-5, maxY:5,
    minZ:-3, maxZ:3
});

addInteractionZone({
    id:"electric",
    minX:roomWidth/2-3, maxX:roomWidth/2,
    minZ:-4, maxZ:4
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
    minX:-6, maxX:6,
    minY:-roomHeight/2, maxY:-roomHeight/2+18,
    minZ:roomDepth/2-2, maxZ:roomDepth/2
});

addInteractionZone({
    id:"door",
    minX:-8, maxX:8,
    minZ:roomDepth/2-4, maxZ:roomDepth/2
});

// =======================
// JANELA (VISUAL)
// =======================
const spaceWindow = createWireRect(gl, 50, 15, 0.1, [0, 0, -(roomDepth / 2) + wallThickness + 0.05]);
const windowTexture = loadTexture(gl, "./assets/texture/universo.jpg");

// =======================
// ASTRONAUTA
// =======================
// =======================
// POSIÇÃO DO ASTRONAUTA
// =======================
const objScale = 6.0;
const objRotation = 80 * Math.PI / 180;

const objX = -(roomWidth / 2) + 4;   // colado na parede esquerda
const objY = -(roomHeight / 2) + 3;  // em cima do chão
const objZ = 0;                      // meio da sala

const floatAmplitude = 0.8;
const floatSpeed = 0.002;

const astronautColor = [1, 1, 1, 1];
let astronaut = null;

(async () => {
    astronaut = await loadOBJ(gl, "./assets/models/astronaut.obj");
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
// MATRIZES
// =======================
function multiply(a,b){
    const r=new Float32Array(16);
    for(let i=0;i<4;i++)
        for(let j=0;j<4;j++)
            r[j*4+i]=a[i]*b[j*4]+a[i+4]*b[j*4+1]+a[i+8]*b[j*4+2]+a[i+12]*b[j*4+3];
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
         0, 1,  0, 0,
         s, 0,  c, 0,
         0, 0,  0, 1
    ]);
}
// =======================
// WEBGL STATE
// =======================
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.9,0.9,0.95,1);

const transfLoc = gl.getUniformLocation(program,"transf");
const colorLoc  = gl.getUniformLocation(program,"uColor");
const posLoc    = gl.getAttribLocation(program,"aPosition");

// =======================
// DRAW
// =======================
function drawRect(r,c){
    gl.bindBuffer(gl.ARRAY_BUFFER,r.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,r.ebo);
    gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(posLoc);
    gl.uniform4fv(colorLoc,c);
    gl.drawElements(gl.LINES,r.lineCount,gl.UNSIGNED_SHORT,0);
}

// =======================
// FASE 2 – SOLO LUNAR
// =======================

//chao da lua
function drawRectFilled(r, c) {
    gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.ebo);

    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.uniform4fv(colorLoc, c);

    // 🔑 TRIÂNGULOS, não linhas
    gl.drawElements(gl.TRIANGLES, r.triangleCount, gl.UNSIGNED_SHORT, 0);
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
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        const proj = createPerspective(Math.PI/3, canvas.width/canvas.height, 0.1, 1000);
        const dir  = updateCameraPosition();
       if (currentState === GameState.OUTSIDE) {
    container.style.display = "none";
    bar.style.width = "0%";

    gl.useProgram(program);           // 🔑 CORREÇÃO
    gl.enable(gl.DEPTH_TEST);          // 🔑 CORREÇÃO

    gl.clearColor(0.02, 0.02, 0.06, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(
        Math.PI / 3,
        canvas.width / canvas.height,
        0.1,
        5000
    );

    const dir = updateCameraPosition();

    const cam = createCamera(
        camPos,
        [camPos[0] + dir[0], camPos[1] + dir[1], camPos[2] + dir[2]],
        [0, 1, 0]
    );

    const groundModel = translate(
    camPos[0],
    camPos[1] - 2,
    camPos[2]
);

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
    // INTERAÇÃO (CORETO)
    // =======================
    if (
        canInteract &&
        currentInteraction &&
        !completed[currentInteraction]
    ) {
        if (keys["e"]) {
            interactionState[currentInteraction]++;

            if (interactionState[currentInteraction] >= INTERACTION_TIME) {
                completed[currentInteraction] = true;
                interactionState[currentInteraction] = 0;

                container.style.display = "none";
                bar.style.width = "0%";

                console.log(`INTERAÇÃO CONCLUÍDA: ${currentInteraction}`);

        gl.uniform4fv(colorLoc, outlineColor);
        gl.drawArrays(gl.LINES, 0, objeto.vertexCount);

    gl.uniformMatrix4fv(transfLoc,false,multiply(proj,cam));

    // =======================
    // DESENHO
    // =======================
    drawRect(wallFront,[.2,.2,.25,1]);
    drawRect(wallBack,[.25,.2,.2,1]);
    drawRect(wallLeft,[.2,.25,.2,1]);
    drawRect(wallRight,[.2,.25,.25,1]);
    drawRect(floor,[.15,.15,.15,1]);
    drawRect(ceiling,[.3,.3,.3,1]);

    drawRect(panel,[.2,.2,.2,1]);
    drawRect(electricPanel,[.1,.4,.1,1]);
    drawRect(door,[.4,.25,.1,1]);
    drawRect(spaceWindow,[.1,.15,.3,1]);
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
    }
      // =======================
        if (astronaut) {
        const time = performance.now();
        const floatY = Math.sin(time * floatSpeed) * floatAmplitude;

        const S = scaleMatrix(objScale, objScale, objScale);
        const R = rotateY(objRotation);
        const T = translate(objX, objY + floatY, objZ);

        const model = multiply(T, multiply(R, S));
        const mvp = multiply(proj, multiply(cam, model));

        gl.uniformMatrix4fv(transfLoc, false, mvp);

        gl.bindBuffer(gl.ARRAY_BUFFER, astronaut.vbo);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);

        // =======================
        // OBJETO SÓLIDO
        // =======================
        gl.uniform4fv(colorLoc, astronautColor);
        gl.drawArrays(gl.TRIANGLES, 0, astronaut.vertexCount);

        // =======================
        // WIREFRAME (LINHAS)
        // =======================
        gl.uniform4f(colorLoc, 0.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.LINES, 0, astronaut.vertexCount);
    }
    }

    if (running) {
        requestAnimationFrame(render);
    }

}

export function stopGame() {
       running = false;
}
console.log("GAME.JS CARREGADO");
render();
