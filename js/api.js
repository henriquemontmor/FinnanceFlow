// ==========================================
// FinnanceFlow - API Client
// ==========================================

const API = {
  // Development mode - shows simplified errors
  isDevelopment:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1",

  /**
   * Make API request with authentication
   */
  async request(action, data = {}) {
    const token = Auth.getToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(`${CONFIG.API_URL}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if token is invalid
      if (result.error === "Invalid token") {
        Auth.logout();
        throw new Error("Session expired. Please login again.");
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      // In development, CORS errors are expected
      if (this.isDevelopment && error.message === "Failed to fetch") {
        console.warn(
          "⚠️ CORS Error (esperado em localhost) - Publique no GitHub Pages para resolver"
        );
      }
      console.error("API request error:", error);
      throw error;
    }
  },

  /**
   * Get all transactions
   */
  async getTransactions(filters = {}) {
    return await this.request("getTransactions", filters);
  },

  /**
   * Get transaction by ID
   */
  async getTransaction(id) {
    return await this.request("getTransaction", { id });
  },

  /**
   * Create new transaction
   */
  async createTransaction(transactionData) {
    return await this.request("createTransaction", transactionData);
  },

  /**
   * Update transaction
   */
  async updateTransaction(id, transactionData) {
    return await this.request("updateTransaction", {
      id,
      ...transactionData,
    });
  },

  /**
   * Delete transaction
   */
  async deleteTransaction(id) {
    return await this.request("deleteTransaction", { id });
  },

  /**
   * Mark transaction as paid
   */
  async markAsPaid(id) {
    return await this.request("markAsPaid", { id });
  },

  /**
   * Get summary/statistics
   */
  async getSummary(filters = {}) {
    return await this.request("getSummary", filters);
  },

  // ==========================================
  // Credit Cards API
  // ==========================================

  /**
   * Get all cards
   */
  async getCards() {
    return await this.request("getCards");
  },

  /**
   * Create new card
   */
  async createCard(cardData) {
    return await this.request("createCard", cardData);
  },

  /**
   * Update card
   */
  async updateCard(id, cardData) {
    return await this.request("updateCard", {
      id,
      ...cardData,
    });
  },

  /**
   * Delete card
   */
  async deleteCard(id) {
    return await this.request("deleteCard", { id });
  },

  // ==========================================
  // Invoice Operations
  // ==========================================

  /**
   * Get all invoices or filter by card/month/year
   */
  async getInvoices(filters = {}) {
    return await this.request("getInvoices", filters);
  },

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData) {
    return await this.request("createInvoice", invoiceData);
  },

  /**
   * Update invoice (recalculates total)
   */
  async updateInvoice(id, status = null) {
    return await this.request("updateInvoice", {
      id,
      ...(status && { status }),
    });
  },

  /**
   * Delete invoice
   */
  async deleteInvoice(id) {
    return await this.request("deleteInvoice", { id });
  },

  /**
   * Close invoice (calculates total and sets status to closed)
   */
  async closeInvoice(id) {
    return await this.request("closeInvoice", { id });
  },
};

// Make API available globally
window.API = API;
