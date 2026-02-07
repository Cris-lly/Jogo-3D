import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRoomWireframe, createRect } from "../core/cube.js";
import {
    camPos,
    enableMouse,
    updateCameraPosition,
    addObstacle,
    canInteract,
    currentInteraction,
    keys,
    addInteractionZone
} from "../core/input.js";

// =======================
// CANVAS
// =======================
const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =======================
// HUD
// =======================
const container = document.getElementById("progressContainer");
const bar = document.getElementById("progressBar");

// =======================
// SISTEMA DE MISSÕES (GENÉRICO)
// =======================
const missions = {
    painel: {
        progress: 0,
        time: 120,
        completed: false
    },
    painel_eletrico: {
        progress: 0,
        time: 180,
        completed: false
    },
    porta:{
        progress: 0,
        time: 120,
        completed: false
    }
};

// =======================
// WEBGL
// =======================
const gl = canvas.getContext("webgl");
if (!gl) alert("WebGL não suportado");

gl.viewport(0, 0, canvas.width, canvas.height);
enableMouse(canvas);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.9, 0.9, 0.95, 1.0);

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

// SALA
const roomWidth = 60;
const roomHeight = 30;
const roomDepth = 90;

const room = createRoomWireframe(gl, roomWidth, roomHeight, roomDepth);

// =======================
// PAINEL PRINCIPAL
// =======================
const panelWidth = 40;
const panelHeight = 6;
const panelDepth = 6;

const panelY = -(roomHeight / 2) + (panelHeight / 2);
const panelZ = -(roomDepth / 2) + (panelDepth / 2) + 0.01;

const panel = createRect(
    gl,
    panelWidth,
    panelHeight,
    panelDepth,
    [0, panelY, panelZ]
);

// colisão física
addObstacle({
    minX: -panelWidth / 2,
    maxX: panelWidth / 2,
    minY: panelY - panelHeight / 2,
    maxY: panelY + panelHeight / 2,
    minZ: panelZ - panelDepth / 2,
    maxZ: panelZ + panelDepth / 2
});

// zona de interação
addInteractionZone({
    id: "painel",
    minX: -panelWidth / 2,
    maxX: panelWidth / 2,
    minY: panelY - panelHeight / 2,
    maxY: panelY + panelHeight / 2,
    minZ: panelZ - panelDepth / 2 - 1.5,
    maxZ: panelZ + panelDepth / 2 + 1.5
});

// =======================
// PAINEL ELÉTRICO (PAREDE DIREITA)
// =======================
const electricWidth = 6;
const electricHeight = 10;
const electricDepth = 2;

const electricX = (roomWidth / 2) - (electricDepth / 2) - 0.01;
const electricY = -5;
const electricZ = 0;

const electricPanel = createRect(
    gl,
    electricDepth,
    electricHeight,
    electricWidth,
    [electricX, electricY, electricZ]
);

// colisão física
addObstacle({
    minX: electricX - electricDepth / 2,
    maxX: electricX + electricDepth / 2,
    minY: electricY - electricHeight / 2,
    maxY: electricY + electricHeight / 2,
    minZ: electricZ - electricWidth / 2,
    maxZ: electricZ + electricWidth / 2
});

// zona de interação
addInteractionZone({
    id: "painel_eletrico",
    minX: electricX - electricDepth / 2 - 1.5,
    maxX: electricX + electricDepth / 2 + 1.5,
    minY: electricY - electricHeight / 2,
    maxY: electricY + electricHeight / 2,
    minZ: electricZ - electricWidth / 2 - 1.5,
    maxZ: electricZ + electricWidth / 2 + 1.5
});



// =======================
// PORTA (PAREDE DE TRÁS)
// =======================
const doorWidth  = 12;
const doorHeight = 16;
const doorDepth  = 2;

// posição da porta
const doorX = 0; // centralizada
const doorY = -(roomHeight / 2) + (doorHeight / 2);
const doorZ = +(roomDepth / 2) + 0.01;

// geometria
const door = createRect(
    gl,
    doorWidth,
    doorHeight,
    doorDepth,
    [doorX, doorY, doorZ]
);

addObstacle({
    minX: doorX - doorWidth / 2,
    maxX: doorX + doorWidth / 2,

    minY: doorY - doorHeight / 2,
    maxY: doorY + doorHeight / 2,

    minZ: doorZ - doorDepth / 2,
    maxZ: doorZ + doorDepth / 2
});

addInteractionZone({
    id: "porta",

    minX: doorX - doorWidth / 2 - 1.5,
    maxX: doorX + doorWidth / 2 + 1.5,

    minY: doorY - doorHeight / 2,
    maxY: doorY + doorHeight / 2,

    minZ: doorZ - doorDepth / 2 - 1.5,
    maxZ: doorZ + doorDepth / 2 + 1.5
});


// =======================
// JANELA (PAREDE DA FRENTE)
// =======================
const windowWidth  = 50;
const windowHeight = 15;
const windowDepth  = 0.5;

// parede da frente → Z negativo
const windowZ = -(roomDepth / 2) + 0.02;
const windowY = 0;
const windowX = 0;

const windowPanel = createRect(
    gl,
    windowWidth,
    windowHeight,
    windowDepth,
    [windowX, windowY, windowZ]
);

// =======================
// UNIFORMS
// =======================
const transfLoc = gl.getUniformLocation(program, "transf");
const colorLoc = gl.getUniformLocation(program, "uColor");
const posLoc = gl.getAttribLocation(program, "aPosition");

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

    // =======================
    // ATUALIZA CÂMERA + INTERAÇÃO
    // =======================
    const dir = updateCameraPosition();

    // =======================
    // MISSÕES (GENÉRICO)
    // =======================
    if (canInteract && currentInteraction) {
        const mission = missions[currentInteraction];

        if (mission && !mission.completed && keys["e"]) {
            mission.progress++;

            if (mission.progress >= mission.time) {
                mission.progress = mission.time;
                mission.completed = true;
                console.log(`MISSÃO ${currentInteraction} CONCLUÍDA ✅`);
            }
        }

        if (mission && !mission.completed) {
            container.style.display = "block";
            bar.style.width =
                (mission.progress / mission.time * 100) + "%";
        } else {
            container.style.display = "none";
        }
    } else {
        container.style.display = "none";
    }

    // =======================
    // CÂMERA / MATRIZ
    // =======================
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
    // SALA
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, room.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, room.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.uniform4f(colorLoc, 0.15, 0.15, 0.15, 1.0);
    gl.drawElements(gl.LINES, room.lineCount, gl.UNSIGNED_SHORT, 0);

    // =======================
    // PAINEL PRINCIPAL
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, panel.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, panel.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4f(colorLoc, 0.2, 0.2, 0.2, 1.0);
    gl.drawElements(gl.LINES, panel.lineCount, gl.UNSIGNED_SHORT, 0);

    // =======================
    // PAINEL ELÉTRICO
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, electricPanel.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, electricPanel.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4f(colorLoc, 0.1, 0.3, 0.1, 1.0);
    gl.drawElements(gl.LINES, electricPanel.lineCount, gl.UNSIGNED_SHORT, 0);

    // =======================
    // PORTA
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, door.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, door.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4f(colorLoc, 0.4, 0.25, 0.1, 1.0);
    gl.drawElements(gl.LINES, door.lineCount, gl.UNSIGNED_SHORT, 0);
    // =======================
    // JANELA
    // =======================
    gl.bindBuffer(gl.ARRAY_BUFFER, windowPanel.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, windowPanel.ebo);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4f(colorLoc, 0.05, 0.1, 0.2, 1.0); // azul escuro (espaço fake 👀)
    gl.drawElements(gl.LINES, windowPanel.lineCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}


console.log("GAME.JS CARREGADO");
render();
