// game.js
import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";
import { createRect } from "../core/cube.js";
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

// =======================
// SALA
// =======================
const roomWidth = 60;
const roomHeight = 30;
const roomDepth = 90;
const wallThickness = 0.5;

const wallFront = createRect(gl, roomWidth, roomHeight, wallThickness, [0,0,-roomDepth/2]);
const wallBack  = createRect(gl, roomWidth, roomHeight, wallThickness, [0,0, roomDepth/2]);
const wallLeft  = createRect(gl, wallThickness, roomHeight, roomDepth, [-roomWidth/2,0,0]);
const wallRight = createRect(gl, wallThickness, roomHeight, roomDepth, [ roomWidth/2,0,0]);
const floor     = createRect(gl, roomWidth, wallThickness, roomDepth, [0,-roomHeight/2,0]);
const ceiling   = createRect(gl, roomWidth, wallThickness, roomDepth, [0, roomHeight/2,0]);

// =======================
// PAINEL PRINCIPAL
// =======================
const panel = createRect(
    gl, 40, 6, 6,
    [0, -roomHeight/2 + 3, -roomDepth/2 + wallThickness + 3]
);

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
const electricPanel = createRect(
    gl, 2, 10, 6,
    [roomWidth/2 - 1, 0, 0]
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
const door = createRect(
    gl, 12, 18, 2,
    [0, -roomHeight/2 + 9, roomDepth/2 - 1]
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
const spaceWindow = createRect(
    gl, 50, 15, 0.1,
    [0, 0, -roomDepth/2 + wallThickness + 0.05]
);

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
// RENDER LOOP
// =======================
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(Math.PI/3, canvas.width/canvas.height, 0.1, 1000);
    const dir  = updateCameraPosition();

    const cam = createCamera(
        camPos,
        [camPos[0]+dir[0], camPos[1]+dir[1], camPos[2]+dir[2]],
        [0,1,0]
    );

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

                if (currentInteraction === "door") {
                    setTimeout(() => {
                        window.location.href = "fase2.html";
                    }, 500);
                }
            }
        } else {
            interactionState[currentInteraction] = 0;
        }
        
        const p = interactionState[currentInteraction] / INTERACTION_TIME;
        bar.style.width = `${Math.min(p,1)*100}%`;
        container.style.display = "block";
    } else {
        container.style.display = "none";
        bar.style.width = "0%";
    }

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
      requestAnimationFrame(render);
   
}
console.log("GAME.JS CARREGADO");
render();
