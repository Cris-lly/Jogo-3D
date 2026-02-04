import { vertexShaderSrc, fragmentShaderSrc } from "../core/shaders.js";
import { createPerspective } from "../math/math3d.js";
import { createCamera } from "../core/camera.js";

//==============================================
// CONTROLES DO MOUSE
let yaw = 0;    // rotação esquerda/direita
let pitch = 0;  // rotação cima/baixo

const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl");
if (!gl) alert("WebGL não suportado");
gl.viewport(0,0,canvas.width,canvas.height);

// clicar para travar mouse
canvas.addEventListener("click", () => canvas.requestPointerLock());

// movimento do mouse
window.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
        const sensitivity = 0.002;
        yaw += e.movementX * sensitivity;
        pitch -= e.movementY * sensitivity;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    }
});

//==============================================
// === Shaders ===
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(shader));
    return shader;
}

const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

//==============================================
// FUNÇÃO PARA CRIAR RETÂNGULO (SALA)
function createRect(gl, width = 50, height = 30, depth = 70) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = new Float32Array([
        -w,-h,-d,  w,-h,-d,  w,h,-d,  -w,h,-d,
        -w,-h,d,   w,-h,d,   w,h,d,   -w,h,d,
    ]);

    const indicesLines = new Uint16Array([
        0,1, 1,2, 2,3, 3,0, // frente
        4,5, 5,6, 6,7, 7,4, // trás
        0,4, 1,5, 2,6, 3,7  // ligações
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesLines, gl.STATIC_DRAW);

    return { vbo, ebo, lineCount: indicesLines.length };
}

//==============================================
// Criar sala retangular
const room = createRect(gl, 60, 30, 90); // largura, altura, profundidade

//==============================================
// Limpeza
gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
gl.clearColor(0.6,0.6,0.6,1.0);

const transfLoc = gl.getUniformLocation(program, "transf");

//==============================================
// Função de multiplicar matrizes 4x4
function multiply(a,b){
    const r = new Float32Array(16);
    for(let i=0;i<4;i++){
        for(let j=0;j<4;j++){
            r[j*4+i] =
                a[i]*b[j*4] +
                a[i+4]*b[j*4+1] +
                a[i+8]*b[j*4+2] +
                a[i+12]*b[j*4+3];
        }
    }
    return r;
}

//==============================================
// Loop de renderização
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = createPerspective(Math.PI/3, canvas.width/canvas.height, 0.1, 1000);

    const dir = [
        Math.cos(pitch)*Math.sin(yaw),
        Math.sin(pitch),
        -Math.cos(pitch)*Math.cos(yaw)
    ];

    // câmera dentro da sala
    const camPos = [0,0,0]; // dentro do retângulo
    const cam = createCamera(
        camPos,
        [camPos[0]+dir[0], camPos[1]+dir[1], camPos[2]+dir[2]],
        [0,1,0]
    );

    const transf = multiply(proj, cam);
    gl.uniformMatrix4fv(transfLoc, false, transf);

    gl.bindBuffer(gl.ARRAY_BUFFER, room.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, room.ebo);

    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    gl.drawElements(gl.LINES, room.lineCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

//==============================================
console.log("GAME.JS CARREGADO");
document.body.style.background = "blue";

render();
