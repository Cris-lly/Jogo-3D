export function createCamera(pos, target, up) {
    const z = normalize(subtract(pos, target));
    const x = normalize(cross(up, z));
    const y = cross(z, x);

    return new Float32Array([
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -dot(x, pos), -dot(y, pos), -dot(z, pos), 1
    ]);
}

function subtract(a, b) {
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}
function cross(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
}
function dot(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}
function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
}
