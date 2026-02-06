// core/input.js
export const keys = {};
export let camPos = [0, -3, 20]; //altura da camera do jogador
export let yaw = 0;
export let pitch = 0;
export const speed = 0.5;

//a câmera ocupa um cubo de ±1 unidade
const CAMERA_RADIUS = 1.0;


// limites da sala
export const bounds = {
    minX: -30,
    maxX:  30,
    minY: -15,
    maxY:  15,
    minZ: -45,
    maxZ:  45
};

// obstáculos (painel, etc)
export const obstacles = [];

// =====================
// EVENTOS
// =====================
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

export function enableMouse(canvas){
    canvas.addEventListener("click", () => canvas.requestPointerLock());

    window.addEventListener("mousemove", e => {
        if(document.pointerLockElement === canvas){
            const sens = 0.002;
            yaw += e.movementX * sens;
            pitch -= e.movementY * sens;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });
}

// =====================
// COLISÃO AABB
// =====================
function collidesXZ(pos, box){
    return !(
        pos[0] + CAMERA_RADIUS < box.minX ||
        pos[0] - CAMERA_RADIUS > box.maxX ||
        pos[2] + CAMERA_RADIUS < box.minZ ||
        pos[2] - CAMERA_RADIUS > box.maxZ
    );
}

export function addObstacle(box){
    obstacles.push(box);
}

// =====================
// MOVIMENTO DA CÂMERA
// =====================
export function updateCameraPosition(){

    const dir = [
        Math.cos(pitch) * Math.sin(yaw),
        Math.sin(pitch),
        -Math.cos(pitch) * Math.cos(yaw)
    ];

    const right = [
        Math.cos(yaw),
        0,
        Math.sin(yaw)
    ];

    let newPos = [...camPos];

    // movimento
    if(keys["w"]){
        newPos[0] += dir[0] * speed;
        newPos[2] += dir[2] * speed;
    }
    if(keys["s"]){
        newPos[0] -= dir[0] * speed;
        newPos[2] -= dir[2] * speed;
    }
    if(keys["a"]){
        newPos[0] -= right[0] * speed;
        newPos[2] -= right[2] * speed;
    }
    if(keys["d"]){
        newPos[0] += right[0] * speed;
        newPos[2] += right[2] * speed;
    }

    // trava altura
    const EYE_HEIGHT = -3;
    newPos[1] = EYE_HEIGHT;

    // limites da sala
    newPos[0] = Math.max(
        bounds.minX + CAMERA_RADIUS,
        Math.min(bounds.maxX - CAMERA_RADIUS, newPos[0])
    );

    newPos[2] = Math.max(
        bounds.minZ + CAMERA_RADIUS,
        Math.min(bounds.maxZ - CAMERA_RADIUS, newPos[2])
    );

    // colisão
    let blocked = false;
    for(const box of obstacles){
        if(collidesXZ(newPos, box)){
            blocked = true;
            break;
        }
    }

    if(!blocked){
        camPos = newPos;
    }

    return dir;
}