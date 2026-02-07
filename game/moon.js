// logic.js

export const GameState = {
    INSIDE: "inside",
    OUTSIDE: "outside"
};

export let currentState = GameState.INSIDE;

export function goOutside() {
    currentState = GameState.OUTSIDE;
    console.log("MODO: FORA DA NAVE");
}
