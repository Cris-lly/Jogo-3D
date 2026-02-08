await import("../game/game.js");


let currentGame = "sala";


const canvas = document.getElementById("glCanvas");
const encerramento = document.getElementById("missao-6")

canvas.tabIndex = 1; // permite foco
canvas.focus();


canvas.addEventListener("keydown", async (e) => {
  if (e.key === "l" || e.key === "L") {
      console.log("Tecla:", e.key);
        if (currentGame === "sala") {
            currentGame = "lua";


            // para o jogo atual
            const sala = await import("../game/game.js");
            sala.stopGame();


            // carrega a lua
            document.querySelectorAll(".modal").forEach(modal => {
                modal.style.display = "none";
            });
            
            await import("../game/gameLua.js");
            // demorar 2 SEGUNDOS após entrar na lua para exibir modal 
            setTimeout(() => {
              encerramento.style.display = "flex";
              setTimeout(() => {
                window.close();
              }, 10000);
            }, 2000);


        }
    }
});


// Botões principais
console.log("GAME INICIADO");

document.getElementById("exit").onclick = () => {
  window.close();
};

const modal = document.getElementById("myModal");
const modalMissao1 = document.getElementById("missao-1")
const openBtn = document.getElementById("story-btn");
const closeBtn = document.getElementById("closeModal");

const modalProfile = document.getElementById("myProfile");
const openBtnProfile = document.getElementById("profile");
const closeBtnProfile = document.getElementById("closeModalProfile");

const closeBtnMissao = document.getElementById("closeModalMissao");

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

// Fechar modal ao clicar no X
closeBtnMissao.onclick = () => {
  modalMissao1.style.display = "none";
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
  // Clicar fora do modal de missao
  if (e.target === modalMissao1) {
    modalMissao1.style.display = "none";
  }
};
//======================================================
//ADICIONA MUSICA
const startButton = document.getElementById("start");
const menu = document.getElementById("menu-container");
const title = document.getElementById("titulo");

const menuMusic = document.getElementById("menu-music");
const gameMusic = document.getElementById("game-music");

menuMusic.volume = 0.5;
gameMusic.volume = 0.4;

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

    gameMusic.currentTime = 0;
    gameMusic.play();

    modalMissao1.style.display = "flex";
    menu.style.display = "none";
    title.style.display = "none";

    const gameScreen = document.getElementById("game-screen");
    const canvas = document.getElementById("glCanvas");
    gameScreen.style.display = "block";
    canvas.style.display = "block";
    await import("../game/game.js");
});


