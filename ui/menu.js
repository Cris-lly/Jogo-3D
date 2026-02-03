// Botões principais
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

