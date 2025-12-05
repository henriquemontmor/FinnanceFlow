// ==========================================
// FinnanceFlow - Invoices Management
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

(async function () {
  let invoices = [];
  let cards = [];
  let currentInvoice = null;

  // DOM Elements
  const addInvoiceBtn = document.getElementById("addInvoiceBtn");
  const invoiceModal = document.getElementById("invoiceModal");
  const invoiceForm = document.getElementById("invoiceForm");
  const invoicesList = document.getElementById("invoicesList");
  const logoutBtn = document.getElementById("logoutBtn");
  const closeButtons = document.querySelectorAll(".modal-close");
  const closeInvoiceBtn = document.getElementById("closeInvoiceBtn");

  // Initialize
  await loadCards();
  await loadInvoices();

  // Event Listeners
  addInvoiceBtn.addEventListener("click", () => openModal());
  logoutBtn.addEventListener("click", () => Auth.logout());
  closeButtons.forEach((btn) =>
    btn.addEventListener("click", () => closeModal())
  );
  invoiceForm.addEventListener("submit", handleSubmit);
  closeInvoiceBtn.addEventListener("click", handleCloseInvoice);

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === invoiceModal) {
      closeModal();
    }
  });

  // Card selection change - show invoice info
  document.getElementById("invoiceCard").addEventListener("change", (e) => {
    const cardId = e.target.value;
    if (cardId && currentInvoice) {
      updateInvoiceInfo();
    }
  });

  // ==========================================
  // Load Functions
  // ==========================================

  async function loadCards() {
    try {
      const result = await API.request("getCards");
      cards = result.cards || [];
      populateCardSelect();
    } catch (error) {
      console.error("Error loading cards:", error);
      alert("Erro ao carregar cartões: " + error.message);
    }
  }

  async function loadInvoices() {
    try {
      const result = await API.request("getInvoices");
      invoices = result.invoices || [];
      renderInvoices();
    } catch (error) {
      console.error("Error loading invoices:", error);
      alert("Erro ao carregar faturas: " + error.message);
    }
  }

  function populateCardSelect() {
    const select = document.getElementById("invoiceCard");
    select.innerHTML = '<option value="">Selecione um cartão</option>';

    cards.forEach((card) => {
      const option = document.createElement("option");
      option.value = card.id;
      option.textContent = `${card.name} (Venc: ${card.dueDay}, Fech: ${card.closingDay})`;
      select.appendChild(option);
    });
  }

  // ==========================================
  // Render Functions
  // ==========================================

  function renderInvoices() {
    if (invoices.length === 0) {
      invoicesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-text">Nenhuma fatura cadastrada</div>
          <p>Clique em "Nova Fatura" para começar</p>
        </div>
      `;
      return;
    }

    // Sort by year and month (most recent first)
    const sortedInvoices = [...invoices].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    invoicesList.innerHTML = sortedInvoices
      .map((invoice) => {
        const card = cards.find((c) => c.id === invoice.cardId);
        const cardName = card ? card.name : "Cartão Desconhecido";
        const statusClass = getStatusClass(invoice.status);
        const statusText = getStatusText(invoice.status);
        const monthName = getMonthName(invoice.month);

        return `
        <div class="invoice-card" data-id="${
          invoice.id
        }" onclick="viewInvoice('${invoice.id}')">
          <div class="invoice-card-header">
            <div class="invoice-card-title">💳 ${cardName}</div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="invoice-card-body">
            <div class="invoice-detail-row">
              <span class="invoice-label">Período</span>
              <span class="invoice-value">${monthName}/${invoice.year}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="invoice-label">Fechamento</span>
              <span class="invoice-value">${formatDate(
                invoice.closingDate
              )}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="invoice-label">Vencimento</span>
              <span class="invoice-value">${formatDate(invoice.dueDate)}</span>
            </div>
          </div>
          <div class="invoice-amount">R$ ${formatMoney(
            invoice.totalAmount
          )}</div>
        </div>
      `;
      })
      .join("");
  }

  // ==========================================
  // Modal Functions
  // ==========================================

  function openModal(invoice = null) {
    currentInvoice = invoice;

    document.getElementById("modalTitle").textContent = invoice
      ? "Detalhes da Fatura"
      : "Nova Fatura";

    if (invoice) {
      // View/edit mode
      document.getElementById("invoiceId").value = invoice.id;
      document.getElementById("invoiceCard").value = invoice.cardId;
      document.getElementById("invoiceMonth").value = invoice.month;
      document.getElementById("invoiceYear").value = invoice.year;

      // Disable editing card, month, year
      document.getElementById("invoiceCard").disabled = true;
      document.getElementById("invoiceMonth").disabled = true;
      document.getElementById("invoiceYear").disabled = true;

      // Show invoice info
      document.getElementById("invoiceInfo").style.display = "block";
      document.getElementById("infoClosingDate").textContent = formatDate(
        invoice.closingDate
      );
      document.getElementById("infoDueDate").textContent = formatDate(
        invoice.dueDate
      );
      document.getElementById("infoTotalAmount").textContent =
        "R$ " + formatMoney(invoice.totalAmount);
      document.getElementById("infoStatus").textContent = getStatusText(
        invoice.status
      );
      document.getElementById("infoStatus").className =
        "status-badge " + getStatusClass(invoice.status);

      // Show close button if status is open, hide save button
      const saveBtn = document.getElementById("saveInvoiceBtn");
      if (invoice.status === "open") {
        closeInvoiceBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
      } else {
        closeInvoiceBtn.style.display = "none";
        saveBtn.style.display = "none";
      }
    } else {
      // Create mode
      invoiceForm.reset();
      document.getElementById("invoiceCard").disabled = false;
      document.getElementById("invoiceMonth").disabled = false;
      document.getElementById("invoiceYear").disabled = false;
      document.getElementById("invoiceInfo").style.display = "none";
      closeInvoiceBtn.style.display = "none";
      document.getElementById("saveInvoiceBtn").style.display = "inline-block";

      // Set default year to current
      const currentYear = new Date().getFullYear();
      document.getElementById("invoiceYear").value = currentYear;
    }

    invoiceModal.style.display = "flex";
  }

  function closeModal() {
    invoiceModal.style.display = "none";
    invoiceForm.reset();
    currentInvoice = null;
  }

  function updateInvoiceInfo() {
    // This would be called if we allow editing
    // For now, info is static from loaded invoice
  }

  // ==========================================
  // CRUD Operations
  // ==========================================

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(invoiceForm);
    const data = {
      cardId: formData.get("cardId"),
      month: parseInt(formData.get("month")),
      year: parseInt(formData.get("year")),
    };

    try {
      if (currentInvoice) {
        // Update (currently not supported - view only)
        alert("Faturas não podem ser editadas após criação");
      } else {
        // Create
        await API.request("createInvoice", data);
        alert("Fatura criada com sucesso!");
      }

      closeModal();
      await loadInvoices();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Erro ao salvar fatura: " + error.message);
    }
  }

  async function handleCloseInvoice() {
    if (!currentInvoice) return;

    if (
      !confirm(
        "Deseja fechar esta fatura? Todas as despesas de cartão associadas serão marcadas como PAGAS."
      )
    ) {
      return;
    }

    try {
      const result = await API.request("closeInvoice", {
        id: currentInvoice.id,
      });
      alert(
        `Fatura fechada com sucesso! Total: R$ ${formatMoney(
          result.totalAmount
        )}\nTodas as despesas foram marcadas como pagas.`
      );
      closeModal();
      await loadInvoices();
    } catch (error) {
      console.error("Error closing invoice:", error);
      alert("Erro ao fechar fatura: " + error.message);
    }
  }

  // Make functions global for onclick
  window.viewInvoice = async function (id) {
    const invoice = invoices.find((i) => i.id === id);
    if (invoice) {
      openModal(invoice);
    }
  };

  window.deleteInvoice = async function (id) {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return;

    const monthName = getMonthName(invoice.month);
    if (
      !confirm(
        `Tem certeza que deseja excluir a fatura de ${monthName}/${invoice.year}?`
      )
    ) {
      return;
    }

    try {
      await API.request("deleteInvoice", { id });
      await loadInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Erro ao excluir fatura: " + error.message);
    }
  };

  // ==========================================
  // Helper Functions
  // ==========================================

  function formatMoney(value) {
    return Number(value).toFixed(2).replace(".", ",");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  }

  function getMonthName(month) {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[month - 1] || "";
  }

  function getStatusText(status) {
    const statusMap = {
      open: "Aberta",
      closed: "Fechada",
      paid: "Paga",
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status) {
    const classMap = {
      open: "status-open",
      closed: "status-closed",
      paid: "status-paid",
    };
    return classMap[status] || "";
  }
})();
