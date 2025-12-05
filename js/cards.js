// ==========================================
// FinnanceFlow - Cards Management
// ==========================================

// Require authentication and validate token
(async function validateSession() {
  const token = Auth.getToken();
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // Validar se o token ainda é válido
  const isValid = await Auth.validateToken(token);
  if (!isValid) {
    Auth.removeToken();
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }
})();

// State
let cards = [];

// DOM Elements
const logoutBtn = document.getElementById("logoutBtn");
const addCardBtn = document.getElementById("addCardBtn");
const cardsList = document.getElementById("cardsList");
const modal = document.getElementById("cardModal");
const modalTitle = document.getElementById("modalTitle");
const cardForm = document.getElementById("cardForm");
const modalCloseBtn = modal.querySelector(".modal-close");
const modalCancelBtn = modal.querySelector(".modal-cancel");

// ==========================================
// Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  loadCards();
});

// ==========================================
// Event Listeners
// ==========================================

function initializeEventListeners() {
  logoutBtn.addEventListener("click", () => {
    Auth.logout();
  });

  addCardBtn.addEventListener("click", () => {
    openModal();
  });

  modalCloseBtn.addEventListener("click", closeModal);
  modalCancelBtn.addEventListener("click", closeModal);

  cardForm.addEventListener("submit", handleFormSubmit);

  // Close modal on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// ==========================================
// Data Loading
// ==========================================

async function loadCards() {
  try {
    const response = await API.getCards();
    cards = response.cards || [];
    renderCards();
  } catch (error) {
    console.error("Error loading cards:", error);
    showError("Erro ao carregar cartões: " + error.message);
  }
}

// ==========================================
// Rendering
// ==========================================

function renderCards() {
  if (cards.length === 0) {
    cardsList.innerHTML = `
      <div class="empty-state">
        <p>Nenhum cartão cadastrado</p>
        <p>Clique em "+ Novo Cartão" para começar</p>
      </div>
    `;
    return;
  }

  cardsList.innerHTML = cards
    .map(
      (card) => `
    <div class="card-item" data-id="${card.id}">
      <div class="card-header">
        <h3>💳 ${card.name}</h3>
        <div class="card-actions">
          <button class="action-icon" data-action="edit" data-id="${card.id}" title="Editar">✏️</button>
          <button class="action-icon" data-action="delete" data-id="${card.id}" title="Excluir">🗑️</button>
        </div>
      </div>
      <div class="card-details">
        <div class="detail-item">
          <span class="detail-label">Fechamento:</span>
          <span class="detail-value">Dia ${card.closingDay}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Vencimento:</span>
          <span class="detail-value">Dia ${card.dueDay}</span>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  attachEventListeners();
}

function attachEventListeners() {
  const actionButtons = cardsList.querySelectorAll(".action-icon");

  actionButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "edit") {
        await handleEdit(id);
      } else if (action === "delete") {
        await handleDelete(id);
      }
    });
  });
}

// ==========================================
// Card Actions
// ==========================================

async function handleEdit(id) {
  const card = cards.find((c) => c.id === id);
  if (!card) return;

  // Fill form with card data
  document.getElementById("cardId").value = card.id;
  document.getElementById("cardName").value = card.name;
  document.getElementById("closingDay").value = card.closingDay;
  document.getElementById("dueDay").value = card.dueDay;

  modalTitle.textContent = "Editar Cartão";
  modal.classList.add("active");
}

async function handleDelete(id) {
  try {
    await API.deleteCard(id);
    await loadCards();
    showSuccess("Cartão excluído com sucesso!");
  } catch (error) {
    console.error("Error deleting card:", error);
    showError("Erro ao excluir cartão.");
  }
}

// ==========================================
// Modal Management
// ==========================================

function openModal() {
  cardForm.reset();
  document.getElementById("cardId").value = "";
  modalTitle.textContent = "Novo Cartão";
  modal.classList.add("active");
  document.getElementById("cardName").focus();
}

function closeModal() {
  modal.classList.remove("active");
  cardForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(cardForm);
  const id = formData.get("id");

  const cardData = {
    name: formData.get("name"),
    closingDay: parseInt(formData.get("closingDay")),
    dueDay: parseInt(formData.get("dueDay")),
  };

  try {
    if (id) {
      await API.updateCard(id, cardData);
      showSuccess("Cartão atualizado com sucesso!");
    } else {
      await API.createCard(cardData);
      showSuccess("Cartão criado com sucesso!");
    }

    closeModal();
    await loadCards();
  } catch (error) {
    console.error("Error saving card:", error);
    showError("Erro ao salvar cartão: " + error.message);
  }
}

// ==========================================
// Toast Notifications
// ==========================================

function showSuccess(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast success show";
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showError(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast error show";
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
