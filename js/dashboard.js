// ==========================================
// FinnanceFlow - Dashboard
// ==========================================

// Require authentication
Auth.requireAuth();

// Get current user data
const currentUserData = Auth.getUserData();
const currentUsername = currentUserData?.username || "user";
const allUsers = currentUserData?.allUsers || [currentUsername];

// State
let currentView =
  localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_VIEW) || currentUsername;
let transactions = [];
let currentFilter = "all";

// DOM Elements
const logoutBtn = document.getElementById("logoutBtn");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const addIncomeBtn = document.getElementById("addIncomeBtn");
const filterStatus = document.getElementById("filterStatus");
const transactionsList = document.getElementById("transactionsList");
const modal = document.getElementById("transactionModal");
const modalTitle = document.getElementById("modalTitle");
const transactionForm = document.getElementById("transactionForm");
const modalCloseBtn = modal.querySelector(".modal-close");
const modalCancelBtn = modal.querySelector(".modal-cancel");

// Summary elements
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const totalPendingEl = document.getElementById("totalPending");
const balanceEl = document.getElementById("balance");

// ==========================================
// Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("=== Dashboard Initialization ===");
  console.log("Current User Data:", currentUserData);
  console.log("Current Username:", currentUsername);
  console.log("All Users:", allUsers);
  console.log("Current View:", currentView);

  try {
    initMonthYearFilter(); // Initialize month/year filter
    initializeViewButtons(); // Initialize view buttons with user names
    initializePersonSelect(); // Initialize person select in modal
    initializeEventListeners();
    loadDashboardData();
    setActiveView(currentView);
  } catch (error) {
    console.error("Error during dashboard initialization:", error);
    showError("Erro ao inicializar dashboard: " + error.message);
  }
});

// ==========================================
// Event Listeners
// ==========================================

function initializeViewButtons() {
  const viewSelector = document.querySelector(".view-selector");
  if (!viewSelector) return;

  // Clear existing buttons
  viewSelector.innerHTML = "";

  // Add "My View" button (user's own transactions + shared)
  const myViewBtn = document.createElement("button");
  myViewBtn.className = "view-btn active";
  myViewBtn.dataset.view = currentUsername;
  myViewBtn.textContent = `Minhas Contas`;
  viewSelector.appendChild(myViewBtn);

  // Add "Shared" button
  const sharedBtn = document.createElement("button");
  sharedBtn.className = "view-btn";
  sharedBtn.dataset.view = "geral";
  sharedBtn.textContent = "Compartilhado";
  viewSelector.appendChild(sharedBtn);

  // Re-query view buttons after creating them
  const newViewButtons = document.querySelectorAll(".view-btn");
  newViewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      setActiveView(view);
      loadDashboardData();
    });
  });
}

function initializePersonSelect() {
  const personSelect = document.getElementById("person");
  if (!personSelect) return;

  // Clear existing options
  personSelect.innerHTML = "";

  // Add current user option
  const userOption = document.createElement("option");
  userOption.value = currentUsername;
  userOption.textContent = `${currentUsername} (Minha)`;
  personSelect.appendChild(userOption);

  // Add shared option
  const sharedOption = document.createElement("option");
  sharedOption.value = "shared";
  sharedOption.textContent = "Compartilhado";
  personSelect.appendChild(sharedOption);
}

function initializeEventListeners() {
  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja sair?")) {
        Auth.logout();
      }
    });
  }

  // View switcher is handled in initializeViewButtons()

  // Add transaction buttons
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", () => {
      openModal("expense");
    });
  }

  if (addIncomeBtn) {
    addIncomeBtn.addEventListener("click", () => {
      openModal("income");
    });
  }

  // Filter
  if (filterStatus) {
    filterStatus.addEventListener("change", () => {
      currentFilter = filterStatus.value;
      renderTransactions();
    });
  }

  // Modal
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Form submission
  if (transactionForm) {
    transactionForm.addEventListener("submit", handleFormSubmit);
  }
}

// ==========================================
// View Management
// ==========================================

function setActiveView(view) {
  currentView = view;
  localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_VIEW, view);

  // Query view buttons dynamically (they might have been recreated)
  const currentViewButtons = document.querySelectorAll(".view-btn");
  currentViewButtons.forEach((btn) => {
    if (btn.dataset.view === view) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// ==========================================
// Data Loading
// ==========================================

async function loadDashboardData() {
  try {
    showLoading();

    // Get month/year or use current date as fallback
    let month, year;
    if (typeof getCurrentMonthYear === "function") {
      const monthYear = getCurrentMonthYear();
      month = monthYear.month;
      year = monthYear.year;
    } else {
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    // Load transactions and summary with month/year filter
    const [transactionsData, summaryData] = await Promise.all([
      API.getTransactions({ view: currentView, month, year }),
      API.getSummary({ view: currentView, month, year }),
    ]);

    transactions = transactionsData.transactions || [];
    updateSummary(summaryData);
    renderTransactions();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    console.error("Error details:", error.message, error.stack);

    // Check if it's a CORS error in development
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isDev && error.message === "Failed to fetch") {
      console.warn("🚧 Ambiente de desenvolvimento - CORS bloqueado");
      showDevelopmentPlaceholder();
    } else {
      showError("Erro ao carregar dados: " + error.message);
    }
  }
}

// ==========================================
// Summary
// ==========================================

function updateSummary(data) {
  totalIncomeEl.textContent = formatCurrency(data.totalIncome || 0);
  totalExpenseEl.textContent = formatCurrency(data.totalExpense || 0);
  totalPendingEl.textContent = formatCurrency(data.totalPending || 0);

  const balance = (data.totalIncome || 0) - (data.totalExpense || 0);
  balanceEl.textContent = formatCurrency(balance);

  // Color balance based on positive/negative
  if (balance >= 0) {
    balanceEl.style.color = "var(--success-color)";
  } else {
    balanceEl.style.color = "var(--danger-color)";
  }
}

// ==========================================
// Transactions List
// ==========================================

function renderTransactions() {
  // Filter transactions
  let filtered = transactions;

  if (currentFilter !== "all") {
    filtered = transactions.filter((t) => t.status === currentFilter);
  }

  // Sort by date (most recent first)
  filtered.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  if (filtered.length === 0) {
    transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>Nenhuma transação encontrada</h3>
                <p>Adicione uma nova receita ou despesa para começar.</p>
            </div>
        `;
    return;
  }

  transactionsList.innerHTML = filtered
    .map((transaction) => createTransactionElement(transaction))
    .join("");

  // Add event listeners to action buttons
  attachTransactionEventListeners();
}

function createTransactionElement(transaction) {
  const isIncome = transaction.type === "income";
  const icon = isIncome ? "💵" : "💳";
  const typeClass = isIncome ? "income" : "expense";
  const amountPrefix = isIncome ? "+" : "-";

  // Display person name - show username or "Compartilhado"
  const personName =
    transaction.person === "shared" ? "Compartilhado" : transaction.person;

  const recurringBadge = transaction.isRecurring
    ? `<span class="recurring-badge">🔄 Recorrente</span>`
    : "";

  return `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-icon ${typeClass}">
                ${icon}
            </div>
            <div class="transaction-info">
                <div class="transaction-title">
                    ${transaction.description}
                    ${recurringBadge}
                </div>
                <div class="transaction-meta">
                    <span>${formatDate(transaction.dueDate)}</span>
                    <span>•</span>
                    <span>${personName}</span>
                    <span>•</span>
                    <span class="status-badge ${transaction.status}">${
    transaction.status === "paid" ? "Pago" : "Pendente"
  }</span>
                </div>
            </div>
            <div class="transaction-amount ${typeClass}">
                ${amountPrefix} ${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                ${
                  transaction.status === "pending"
                    ? `
                    <button class="action-icon check" data-action="pay" data-id="${transaction.id}" title="Marcar como pago">
                        ✓
                    </button>
                `
                    : ""
                }
                <button class="action-icon edit" data-action="edit" data-id="${
                  transaction.id
                }" title="Editar">
                    ✏️
                </button>
                <button class="action-icon delete" data-action="delete" data-id="${
                  transaction.id
                }" title="Excluir">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function attachTransactionEventListeners() {
  const actionButtons = transactionsList.querySelectorAll(".action-icon");

  actionButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case "pay":
          await handleMarkAsPaid(id);
          break;
        case "edit":
          await handleEdit(id);
          break;
        case "delete":
          await handleDelete(id);
          break;
      }
    });
  });
}

// ==========================================
// Transaction Actions
// ==========================================

async function handleMarkAsPaid(id) {
  if (!confirm("Marcar esta transação como paga?")) {
    return;
  }

  try {
    await API.markAsPaid(id);
    await loadDashboardData();
    showSuccess("Transação marcada como paga!");
  } catch (error) {
    console.error("Error marking as paid:", error);
    showError("Erro ao atualizar transação.");
  }
}

async function handleEdit(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  // Fill form with transaction data
  document.getElementById("transactionId").value = transaction.id;
  document.getElementById("description").value = transaction.description;
  document.getElementById("amount").value = transaction.amount;
  document.getElementById("type").value = transaction.type;
  document.getElementById("person").value = transaction.person;
  document.getElementById("category").value = transaction.category || "outros";
  document.getElementById("dueDate").value = transaction.dueDate;
  document.getElementById("status").value = transaction.status;
  document.getElementById("notes").value = transaction.notes || "";

  modalTitle.textContent = "Editar Transação";
  modal.classList.add("active");
}

async function handleDelete(id) {
  if (!confirm("Tem certeza que deseja excluir esta transação?")) {
    return;
  }

  try {
    await API.deleteTransaction(id);
    await loadDashboardData();
    showSuccess("Transação excluída com sucesso!");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    showError("Erro ao excluir transação.");
  }
}

// ==========================================
// Modal Management
// ==========================================

function openModal(type = "expense") {
  transactionForm.reset();
  document.getElementById("transactionId").value = "";
  document.getElementById("type").value = type;
  document.getElementById("dueDate").value = new Date()
    .toISOString()
    .split("T")[0];

  modalTitle.textContent = type === "expense" ? "Nova Despesa" : "Nova Receita";
  modal.classList.add("active");

  document.getElementById("description").focus();
}

function closeModal() {
  modal.classList.remove("active");
  transactionForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(transactionForm);
  const id = formData.get("id");

  const transactionData = {
    description: formData.get("description"),
    amount: parseFloat(formData.get("amount")),
    type: formData.get("type"),
    person: formData.get("person"),
    category: formData.get("category"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    isRecurring: document.getElementById("isRecurring").checked,
  };

  try {
    if (id) {
      transactionData.id = id;
      await API.updateTransaction(id, transactionData);
      showSuccess("Transação atualizada com sucesso!");
    } else {
      await API.createTransaction(transactionData);
      const message = transactionData.isRecurring
        ? "Transação recorrente criada! 🔄"
        : "Transação criada com sucesso!";
      showSuccess(message);
    }

    closeModal();
    await loadDashboardData();
  } catch (error) {
    console.error("Error saving transaction:", error);
    showError("Erro ao salvar transação.");
  }
}

// ==========================================
// Utilities
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat(CONFIG.LOCALE, {
    style: "currency",
    currency: CONFIG.CURRENCY,
  }).format(value);
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return new Intl.DateFormat(CONFIG.LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function showLoading() {
  if (transactionsList) {
    transactionsList.innerHTML = '<div class="loading">Carregando...</div>';
  }
}

function showDevelopmentPlaceholder() {
  if (transactionsList) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚧</div>
        <h3>Modo Desenvolvimento</h3>
        <p>CORS bloqueando requisições do localhost.</p>
        <p><strong>Solução:</strong> Publique no GitHub Pages ou use extensão CORS.</p>
        <br>
        <p><a href="fix-cors-rapido.html" target="_blank" style="color: var(--primary-color); text-decoration: underline;">Ver Guia de Solução →</a></p>
      </div>
    `;
  }

  // Show zeros in summary
  updateSummary({
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    balance: 0,
  });
}

function showError(message) {
  // Simple alert for now - can be improved with a toast notification
  console.error("Dashboard Error:", message);
  alert(message);
}

function showSuccess(message) {
  // Simple alert for now - can be improved with a toast notification
  alert(message);
}
