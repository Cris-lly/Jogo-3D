// controls.js
export const keys = {};
export let camPos = [0, 0, 0];
export let yaw = 0;
export let pitch = 0;
export const speed = 0.5;

// Limites da sala (metade do tamanho da sala)
export const bounds = {
    minX: -30, maxX: 30,
    minY: -15, maxY: 15,
    minZ: -45, maxZ: 45
};

// Teclado
window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// Mouse
export function enableMouse(canvas) {
    canvas.addEventListener("click", () => canvas.requestPointerLock());
    window.addEventListener("mousemove", (e) => {
        if(document.pointerLockElement === canvas) {
            const sensitivity = 0.002;
            yaw += e.movementX * sensitivity;
            pitch -= e.movementY * sensitivity;
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
        }
    });
}

// Atualiza posição da câmera com colisão
export function updateCameraPosition() {
    // direção da câmera
    const dir = [
        Math.cos(pitch) * Math.sin(yaw),
        Math.sin(pitch),
        -Math.cos(pitch) * Math.cos(yaw)
    ];

    // vetor lateral horizontal (A/D)
    const right = [
        Math.cos(yaw),
        0,
        Math.sin(yaw)
    ];

    // movimento horizontal apenas (ignora y)
    let moveDir = [dir[0], 0, dir[2]];

    // normaliza moveDir
    const len = Math.hypot(moveDir[0], moveDir[2]);
    if (len !== 0) {
        moveDir[0] /= len;
        moveDir[2] /= len;
    }

    // nova posição
    let newPos = [...camPos];

    if(keys["w"]){
        newPos[0] += moveDir[0] * speed;
        newPos[2] += moveDir[2] * speed;
    }
    if(keys["s"]){
        newPos[0] -= moveDir[0] * speed;
        newPos[2] -= moveDir[2] * speed;
    }
    if(keys["a"]){
        newPos[0] -= right[0] * speed;
        newPos[2] -= right[2] * speed;
    }
    if(keys["d"]){
        newPos[0] += right[0] * speed;
        newPos[2] += right[2] * speed;
    }

    // mantém a altura fixa
    newPos[1] = camPos[1];

    // ===== Colisão com limites da sala =====
    newPos[0] = Math.max(bounds.minX, Math.min(bounds.maxX, newPos[0]));
    newPos[2] = Math.max(bounds.minZ, Math.min(bounds.maxZ, newPos[2]));

    camPos = newPos;

    return dir;
}
