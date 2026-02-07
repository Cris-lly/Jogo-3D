// =====================
// INPUT / CAMERA / COLISÃO
// =====================

export const keys = {};
export let camPos = [0, -3, 20];
export let yaw = 0;
export let pitch = 0;
export const speed = 0.5;

// estado de interação
export let canInteract = false;
export let currentInteraction = null;

// a câmera ocupa um cubo de ±1 unidade
const CAMERA_RADIUS = 1.0;

// =====================
// LIMITES DA SALA
// =====================
export const bounds = {
    minX: -30,
    maxX:  30,
    minY: -15,
    maxY:  15,
    minZ: -45,
    maxZ:  45
};

// obstáculos físicos (paredes, painel)
export const obstacles = [];

// zonas de interação (gatilhos)
const interactionZones = [];

// =====================
// EVENTOS DE TECLADO
// =====================
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// =====================
// MOUSE (LOOK)
// =====================
export function enableMouse(canvas){
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });

    window.addEventListener("mousemove", e => {
        if (document.pointerLockElement === canvas) {
            const sens = 0.002;
            yaw   += e.movementX * sens;
            pitch -= e.movementY * sens;
            pitch = Math.max(-1.4, Math.min(1.4, pitch));
        }
    });
}

// =====================
// COLISÕES
// =====================
function collidesXZ(pos, box){
    return !(
        pos[0] + CAMERA_RADIUS < box.minX ||
        pos[0] - CAMERA_RADIUS > box.maxX ||
        pos[2] + CAMERA_RADIUS < box.minZ ||
        pos[2] - CAMERA_RADIUS > box.maxZ
    );
}
function collides(pos, box){
    return !(
        pos[0] + CAMERA_RADIUS < box.minX ||
        pos[0] - CAMERA_RADIUS > box.maxX ||
        pos[1] + CAMERA_RADIUS < box.minY ||
        pos[1] - CAMERA_RADIUS > box.maxY ||
        pos[2] + CAMERA_RADIUS < box.minZ ||
        pos[2] - CAMERA_RADIUS > box.maxZ
    );
}

// =====================
// REGISTRO
// =====================
export function addObstacle(box){
    obstacles.push(box);
}

export function addInteractionZone(zone){
    interactionZones.push(zone);
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

    if (keys["w"]) {
        newPos[0] += dir[0] * speed;
        newPos[2] += dir[2] * speed;
    }
    if (keys["s"]) {
        newPos[0] -= dir[0] * speed;
        newPos[2] -= dir[2] * speed;
    }
    if (keys["a"]) {
        newPos[0] -= right[0] * speed;
        newPos[2] -= right[2] * speed;
    }
    if (keys["d"]) {
        newPos[0] += right[0] * speed;
        newPos[2] += right[2] * speed;
    }

    // altura fixa FPS
    newPos[1] = -3;

    // limites da sala
    newPos[0] = Math.max(bounds.minX + CAMERA_RADIUS,
        Math.min(bounds.maxX - CAMERA_RADIUS, newPos[0]));
    newPos[2] = Math.max(bounds.minZ + CAMERA_RADIUS,
        Math.min(bounds.maxZ - CAMERA_RADIUS, newPos[2]));

    // =====================
    // COLISÃO FÍSICA (XZ)
    // =====================
    let blocked = false;
    for (const obs of obstacles) {
        if (collidesXZ(newPos, obs)) {
            blocked = true;
            break;
        }
    }

    if (!blocked) {
        camPos = newPos;
    }

    // =====================
    // INTERAÇÃO (XZ)
    // =====================
    canInteract = false;
    currentInteraction = null;

    for (const zone of interactionZones) {
        if (collidesXZ(camPos, zone)) {
            canInteract = true;
            currentInteraction = zone.id;
            break;
        }
    }

    return dir;
}