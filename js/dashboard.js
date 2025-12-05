// ==========================================
// FinnanceFlow - Dashboard
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

// Get current user data
const currentUserData = Auth.getUserData();
const currentUsername = currentUserData?.username || "user";
const allUsers = currentUserData?.allUsers || [currentUsername];

// State
let currentView =
  localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_VIEW) || currentUsername;
let transactions = [];
let currentFilter = "all";
let currentTypeFilter = "all";

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
const totalCardEl = document.getElementById("totalCard");
const totalSavingsEl = document.getElementById("totalSavings");

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
    initializeCardSelect(); // Initialize card select for installments
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

  // Add "My View" button (user's own transactions only, not shared)
  const myViewBtn = document.createElement("button");
  myViewBtn.className = "view-btn active";
  myViewBtn.dataset.view = currentUsername;
  myViewBtn.textContent = `Minhas Contas`;
  viewSelector.appendChild(myViewBtn);

  // Add "Shared" button (shared expenses only)
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

async function initializeCardSelect() {
  const cardSelect = document.getElementById("cardId");
  if (!cardSelect) return;

  try {
    const response = await API.getCards();
    const cards = response.cards || [];

    // Clear existing options except first
    cardSelect.innerHTML = '<option value="">Selecione um cartão</option>';

    // Add card options
    cards.forEach((card) => {
      const option = document.createElement("option");
      option.value = card.id;
      option.textContent = `${card.name} (Fecha dia ${card.closingDay})`;
      cardSelect.appendChild(option);
    });

    // Add option to create new card if none exist
    if (cards.length === 0) {
      const noCardOption = document.createElement("option");
      noCardOption.value = "";
      noCardOption.textContent = "Nenhum cartão cadastrado";
      noCardOption.disabled = true;
      cardSelect.appendChild(noCardOption);
    }
  } catch (error) {
    console.error("Error loading cards:", error);
  }
}

async function initializeInvoiceSelect() {
  const invoiceSelect = document.getElementById("invoiceId");
  const cardSelect = document.getElementById("cardId");
  if (!invoiceSelect || !cardSelect) return;

  const cardId = cardSelect.value;
  if (!cardId) {
    invoiceSelect.innerHTML = '<option value="">Sem fatura associada</option>';
    return;
  }

  try {
    const response = await API.getInvoices({ cardId, status: "open" });
    const invoices = response.invoices || [];

    // Clear existing options
    invoiceSelect.innerHTML = '<option value="">Sem fatura associada</option>';

    // Add invoice options (only open ones)
    invoices
      .filter((inv) => inv.status === "open")
      .forEach((invoice) => {
        const option = document.createElement("option");
        option.value = invoice.id;
        const monthName = getMonthName(invoice.month);
        option.textContent = `${monthName}/${
          invoice.year
        } - Vence ${formatDateShort(invoice.dueDate)}`;
        invoiceSelect.appendChild(option);
      });
  } catch (error) {
    console.error("Error loading invoices:", error);
  }
}

function getMonthName(month) {
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return months[month - 1] || "";
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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

  const addCardBtn = document.getElementById("addCardBtn");
  if (addCardBtn) {
    addCardBtn.addEventListener("click", () => {
      openModal("cartao");
    });
  }

  const addSavingsBtn = document.getElementById("addSavingsBtn");
  if (addSavingsBtn) {
    addSavingsBtn.addEventListener("click", () => {
      openModal("caixinha");
    });
  }

  const withdrawSavingsBtn = document.getElementById("withdrawSavingsBtn");
  if (withdrawSavingsBtn) {
    withdrawSavingsBtn.addEventListener("click", () => {
      openModal("retirada-caixinha");
    });
  }

  // Installment checkbox toggle
  const isInstallmentCheckbox = document.getElementById("isInstallment");
  const installmentFields = document.getElementById("installmentFields");
  const isRecurringCheckbox = document.getElementById("isRecurring");

  if (isInstallmentCheckbox && installmentFields) {
    isInstallmentCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        installmentFields.style.display = "block";
        document.getElementById("cardId").required = true;
        document.getElementById("installments").required = true;
        // Disable recurring when installment is checked
        if (isRecurringCheckbox) {
          isRecurringCheckbox.checked = false;
          isRecurringCheckbox.disabled = true;
        }
      } else {
        installmentFields.style.display = "none";
        document.getElementById("cardId").required = false;
        document.getElementById("installments").required = false;
        // Re-enable recurring
        if (isRecurringCheckbox) {
          isRecurringCheckbox.disabled = false;
        }
      }
    });
  }

  // Card transaction type change - show/hide invoice select
  const cardTransactionType = document.getElementById("cardTransactionType");
  const invoiceSelectGroup = document.getElementById("invoiceSelectGroup");
  if (cardTransactionType && invoiceSelectGroup) {
    cardTransactionType.addEventListener("change", (e) => {
      if (e.target.value === "credit") {
        invoiceSelectGroup.style.display = "block";
        initializeInvoiceSelect();
      } else {
        invoiceSelectGroup.style.display = "none";
      }
    });
  }

  // Card selection change - reload invoices
  const cardSelect = document.getElementById("cardId");
  if (cardSelect && invoiceSelectGroup) {
    cardSelect.addEventListener("change", () => {
      if (cardTransactionType && cardTransactionType.value === "credit") {
        initializeInvoiceSelect();
      }
    });
  }

  // Recurring checkbox - disable installment when checked
  if (isRecurringCheckbox && isInstallmentCheckbox) {
    isRecurringCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        isInstallmentCheckbox.checked = false;
        isInstallmentCheckbox.disabled = true;
        if (installmentFields) {
          installmentFields.style.display = "none";
        }
      } else {
        isInstallmentCheckbox.disabled = false;
      }
    });
  }

  // Reset installment checkbox state when opening modal
  const newTransactionBtn = document.getElementById("newTransactionBtn");
  if (newTransactionBtn && isInstallmentCheckbox) {
    newTransactionBtn.addEventListener("click", () => {
      isInstallmentCheckbox.disabled = false;
    });
  }

  // Filter
  if (filterStatus) {
    filterStatus.addEventListener("change", () => {
      currentFilter = filterStatus.value;
      renderTransactions();
    });
  }

  const filterType = document.getElementById("filterType");
  if (filterType) {
    filterType.addEventListener("change", () => {
      currentTypeFilter = filterType.value;
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
  totalCardEl.textContent = formatCurrency(data.totalCard || 0);
  totalSavingsEl.textContent = formatCurrency(data.totalSavings || 0);

  const balance = (data.totalIncome || 0) - (data.totalExpense || 0);
  balanceEl.textContent = formatCurrency(balance);

  // Color balance based on positive/negative
  if (balance >= 0) {
    balanceEl.style.color = "var(--success-color)";
  } else {
    balanceEl.style.color = "var(--danger-color)";
  }

  // Color card based on value
  if (totalCardEl) {
    if ((data.totalCard || 0) > 0) {
      totalCardEl.style.color = "var(--danger-color)";
    } else {
      totalCardEl.style.color = "var(--text-color)";
    }
  }

  // Color savings based on value
  if (totalSavingsEl) {
    if ((data.totalSavings || 0) > 0) {
      totalSavingsEl.style.color = "var(--success-color)";
    } else {
      totalSavingsEl.style.color = "var(--text-color)";
    }
  }
}

// ==========================================
// Transactions List
// ==========================================

function renderTransactions() {
  // Filter transactions
  let filtered = transactions;

  if (currentFilter !== "all") {
    filtered = filtered.filter((t) => t.status === currentFilter);
  }

  if (currentTypeFilter !== "all") {
    filtered = filtered.filter((t) => t.type === currentTypeFilter);
  }

  // Custom sort: pending (oldest first), then paid (most recently updated first)
  filtered.sort((a, b) => {
    // Priority 1: Pending transactions come first
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    // Priority 2: Within each group, sort by appropriate date
    if (a.status === "pending" && b.status === "pending") {
      // Pending: oldest first (by due date)
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else {
      // Paid: most recently updated first
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

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
  // Define icons and classes based on type
  const typeConfig = {
    income: { icon: "💵", class: "income", prefix: "+" },
    expense: { icon: "💳", class: "expense", prefix: "-" },
    cartao: { icon: "💳", class: "card", prefix: "-" },
    caixinha: { icon: "🐷", class: "savings", prefix: "+" },
    "retirada-caixinha": { icon: "📤", class: "withdraw", prefix: "-" },
  };

  const config = typeConfig[transaction.type] || typeConfig.expense;
  const icon = config.icon;
  const typeClass = config.class;
  const amountPrefix = config.prefix;

  // Display person name - show username or "Compartilhado"
  const personName =
    transaction.person === "shared" ? "Compartilhado" : transaction.person;

  const recurringBadge = transaction.isRecurring
    ? `<span class="recurring-badge">🔄 Recorrente</span>`
    : "";

  // Show installment info if applicable
  const installmentBadge =
    transaction.currentInstallment && transaction.totalInstallments
      ? `<span class="recurring-badge">${transaction.currentInstallment}/${transaction.totalInstallments}</span>`
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
                    ${installmentBadge}
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

  // Set current date as default, user can change it
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("dueDate").value = today;

  // Set title based on type
  const titles = {
    expense: "Nova Despesa",
    income: "Nova Receita",
    cartao: "Gasto no Cartão",
    caixinha: "Guardar Dinheiro",
    "retirada-caixinha": "Retirar da Caixinha",
  };
  modalTitle.textContent = titles[type] || "Nova Transação";

  // Show/hide fields based on type
  const isExpense = type === "expense";
  const isIncome = type === "income";
  const isSpecialType = ["cartao", "caixinha", "retirada-caixinha"].includes(
    type
  );

  // Person field - only for expenses, cartao, caixinha
  const personGroup = document.getElementById("personGroup");
  if (personGroup) {
    const needsPerson = [
      "expense",
      "cartao",
      "caixinha",
      "retirada-caixinha",
    ].includes(type);
    personGroup.style.display = needsPerson ? "block" : "none";
    document.getElementById("person").required = needsPerson;
  }

  // Status field - hide for income and special types
  const statusGroup = document.getElementById("statusGroup");
  if (statusGroup) {
    statusGroup.style.display =
      isExpense || type === "cartao" ? "block" : "none";
    document.getElementById("status").required = isExpense || type === "cartao";
  }

  // Installment checkbox - only for expenses
  const installmentCheckboxGroup = document.getElementById(
    "installmentCheckboxGroup"
  );
  if (installmentCheckboxGroup) {
    installmentCheckboxGroup.style.display = isExpense ? "block" : "none";
  }

  // Recurring checkbox - only for expenses
  const recurringGroup = document.getElementById("recurringGroup");
  if (recurringGroup) {
    recurringGroup.style.display = isExpense ? "block" : "none";
  }

  // Reset checkboxes
  document.getElementById("isInstallment").checked = false;
  document.getElementById("isRecurring").checked = false;

  // Installment fields - show for cartao type, hide for others
  const installmentFields = document.getElementById("installmentFields");
  if (installmentFields) {
    if (type === "cartao") {
      installmentFields.style.display = "block";
      document.getElementById("cardId").required = true;
      document.getElementById("cardTransactionType").required = true;
      document.getElementById("installments").required = true;
    } else {
      installmentFields.style.display = "none";
      document.getElementById("cardId").required = false;
      document.getElementById("cardTransactionType").required = false;
      document.getElementById("installments").required = false;
    }
  }

  // Populate categories based on type
  populateCategories(type);

  modal.classList.add("active");
  document.getElementById("description").focus();
}

function populateCategories(type) {
  const categorySelect = document.getElementById("category");

  const expenseCategories = [
    { value: "alimentacao", label: "Alimentação" },
    { value: "lanche", label: "Lanche" },
    { value: "salgadinho", label: "Salgadinho" },
    { value: "moradia", label: "Moradia" },
    { value: "transporte", label: "Transporte" },
    { value: "saude", label: "Saúde" },
    { value: "lazer", label: "Lazer" },
    { value: "educacao", label: "Educação" },
    { value: "parcela", label: "Parcela" },
    { value: "henrique", label: "Henrique" },
    { value: "juliana", label: "Juliana" },
    { value: "outros", label: "Outros" },
  ];

  const incomeCategories = [
    { value: "salario", label: "Salário" },
    { value: "particular", label: "Particular" },
    { value: "salgado", label: "Salgado" },
    { value: "freelancer", label: "Freelancer" },
    { value: "outros", label: "Outros" },
  ];

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  categorySelect.innerHTML = "";
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.value;
    option.textContent = cat.label;
    categorySelect.appendChild(option);
  });
}

function closeModal() {
  modal.classList.remove("active");
  transactionForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(transactionForm);
  const id = formData.get("id");
  const transactionType = formData.get("type");
  const isExpense = transactionType === "expense";
  const isCartao = transactionType === "cartao";
  const isInstallment = document.getElementById("isInstallment").checked;

  const transactionData = {
    description: formData.get("description"),
    amount: parseFloat(formData.get("amount")),
    type: transactionType,
    // For income: always current user and paid
    // For expense/cartao: use form values
    person: isExpense || isCartao ? formData.get("person") : currentUsername,
    category: formData.get("category"),
    dueDate: formData.get("dueDate"),
    status: isExpense || isCartao ? formData.get("status") : "paid",
    notes: formData.get("notes"),
    isRecurring: isExpense
      ? document.getElementById("isRecurring").checked
      : false,
  };

  // Add card data for "cartao" type or installment expenses
  if ((isCartao || isInstallment) && !id) {
    transactionData.cardId = formData.get("cardId");
    transactionData.cardTransactionType = formData.get("cardTransactionType");
    transactionData.invoiceId = formData.get("invoiceId") || null;
    transactionData.installments = parseInt(formData.get("installments")) || 1;

    if (!transactionData.cardId) {
      showError("Por favor, selecione um cartão.");
      return;
    }

    if (!transactionData.cardTransactionType) {
      showError(
        "Por favor, selecione o tipo de transação (débito ou crédito)."
      );
      return;
    }

    if (!transactionData.installments || transactionData.installments < 1) {
      showError("Número de parcelas deve ser maior ou igual a 1.");
      return;
    }

    // For "cartao" type, always mark as needing installment processing
    if (isCartao && transactionData.installments >= 1) {
      // Backend will handle installment creation
    }
  }

  try {
    // Close modal immediately to prevent double submission
    closeModal();

    if (id) {
      transactionData.id = id;
      await API.updateTransaction(id, transactionData);
      showSuccess("Transação atualizada!");
    } else {
      await API.createTransaction(transactionData);
      // Show brief success message for card transactions
      if ((isCartao || isInstallment) && transactionData.installments > 1) {
        showSuccess(`${transactionData.installments} parcelas criadas! 💳`);
      } else if (isCartao) {
        showSuccess("Despesa de cartão criada! 💳");
      }
    }

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
  const formatter = new Intl.DateTimeFormat(CONFIG.LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return formatter.format(date);
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
