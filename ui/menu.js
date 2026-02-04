// Botões principais
console.log("GAME INICIADO");


document.getElementById("start").onclick = () => {
  alert("Iniciar jogo!");
};

document.getElementById("exit").onclick = () => {
  alert("Sair do jogo");
};

const modal = document.getElementById("myModal");
const openBtn = document.getElementById("story-btn");
const closeBtn = document.getElementById("closeModal");

const modalProfile = document.getElementById("myProfile");
const openBtnProfile = document.getElementById("profile");
const closeBtnProfile = document.getElementById("closeModalProfile");

// Abrir modal
openBtn.onclick = () => {
  modal.style.display = "flex";
};

// Fechar modal ao clicar no X
closeBtn.onclick = () => {
  modal.style.display = "none";
};


// Abrir modal
openBtnProfile.onclick = () => {
  modalProfile.style.display = "flex";
};

// Fechar modal ao clicar no X
closeBtnProfile.onclick = () => {
  modalProfile.style.display = "none";
};

window.onclick = (e) => {
  // Clicar fora do modal de história
  if (e.target === modal) {
    modal.style.display = "none";
  }
  // Clicar fora do modal de perfil
  if (e.target === modalProfile) {
    modalProfile.style.display = "none";
  }
};
//======================================================
//ADICIONA MUSICA
const startButton = document.getElementById("start");
const menu = document.getElementById("menu-container");
const title = document.getElementById("titulo");
const menuMusic = document.getElementById("menu-music");

menuMusic.volume = 0.5;

// tenta tocar assim que a tela carrega
menuMusic.play().catch(() => {
    // se o navegador bloquear, libera no primeiro clique
    document.addEventListener("click", () => {
        menuMusic.play();
    }, { once: true });
});

// botão iniciar
startButton.addEventListener("click", async () => {
    // para a música
    menuMusic.pause();
    menuMusic.currentTime = 0;

    // troca de tela
    menu.style.display = "none";
    title.style.display = "none";

    const gameScreen = document.getElementById("game-screen");
    const canvas = document.getElementById("glCanvas");
    gameScreen.style.display = "block";
    canvas.style.display = "block";

    await import("../game/game.js");
});


