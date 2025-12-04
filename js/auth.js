// ==========================================
// FinnanceFlow - Authentication Module
// ==========================================

const Auth = {
  /**
   * Save authentication token to localStorage
   */
  saveToken(token) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
      return true;
    } catch (error) {
      console.error("Error saving token:", error);
      return false;
    }
  },

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    try {
      return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  removeToken() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_VIEW);
      return true;
    } catch (error) {
      console.error("Error removing token:", error);
      return false;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    return token !== null && token !== "";
  },

  /**
   * Login with username and password
   */
  async login(username, password) {
    try {
      console.log("=== LOGIN DEBUG ===");
      console.log("API_URL:", CONFIG.API_URL);
      console.log("Username:", username);
      console.log("Tentando fazer requisição...");

      const url = `${CONFIG.API_URL}?action=login`;
      console.log("URL completa:", url);

      // Try direct request first
      try {
        const response = await fetch(url, {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({ username, password }),
        });

        console.log("Response status:", response.status);
        console.log("Response type:", response.type);

        const data = await response.json();
        console.log("Response data:", data);

        if (data.success && data.token) {
          this.saveToken(data.token);
          if (data.userData) {
            this.saveUserData(data.userData);
          }
          return { success: true };
        }

        return { success: false, error: data.error || "Login failed" };
      } catch (directError) {
        console.log("Erro na requisição direta:", directError.message);

        // Se falhou por CORS, tenta com proxy CORS
        if (
          directError.message.includes("Failed to fetch") ||
          directError.message.includes("CORS")
        ) {
          console.log("Tentando com método alternativo (form submit)...");
          return await this.loginViaFormSubmit(username, password, url);
        }
        throw directError;
      }
    } catch (error) {
      console.error("Error during login:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      let errorMsg =
        "Erro ao conectar com o servidor.\n\n" +
        "Soluções:\n" +
        "1. Publique no GitHub Pages (recomendado)\n" +
        "2. Use a extensão 'Allow CORS' do navegador\n" +
        "3. Abra o Chrome com: chrome.exe --disable-web-security\n\n" +
        "Veja: docs/FIX-CORS.md";

      return { success: false, error: errorMsg };
    }
  },

  /**
   * Alternative login method using hidden form (bypasses CORS)
   */
  async loginViaFormSubmit(username, password, url) {
    return new Promise((resolve) => {
      console.log("Usando método de form submit...");

      // Create hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.name = "cors-frame";
      document.body.appendChild(iframe);

      // Create form
      const form = document.createElement("form");
      form.target = "cors-frame";
      form.method = "POST";
      form.action = url;
      form.style.display = "none";

      // Add data as hidden input
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "data";
      input.value = JSON.stringify({ username, password });
      form.appendChild(input);

      document.body.appendChild(form);

      // Listen for iframe load
      let timeout;
      iframe.onload = () => {
        clearTimeout(timeout);
        try {
          // Try to read iframe content
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          const responseText = iframeDoc.body.textContent;
          const data = JSON.parse(responseText);

          if (data.success && data.token) {
            this.saveToken(data.token);
            if (data.userData) {
              this.saveUserData(data.userData);
            }
            resolve({ success: true });
          } else {
            resolve({ success: false, error: data.error || "Login failed" });
          }
        } catch (e) {
          console.error("Erro ao ler resposta do iframe:", e);
          resolve({
            success: false,
            error:
              "Não foi possível verificar o login. Use GitHub Pages ou extensão CORS.",
          });
        } finally {
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(iframe);
            document.body.removeChild(form);
          }, 100);
        }
      };

      // Submit form
      form.submit();

      // Timeout fallback
      timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        document.body.removeChild(form);
        resolve({
          success: false,
          error:
            "Timeout. Por favor, publique no GitHub Pages ou use extensão CORS.",
        });
      }, 10000);
    });
  },

  /**
   * Validate existing token
   */
  async validateToken(token) {
    try {
      const response = await fetch(`${CONFIG.API_URL}?action=validateToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  },

  /**
   * Save user data to localStorage
   */
  saveUserData(userData) {
    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      return false;
    }
  },

  /**
   * Get user data from localStorage
   */
  getUserData() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  /**
   * Logout user
   */
  logout() {
    this.removeToken();
    window.location.href = "index.html";
  },

  /**
   * Redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  },

  /**
   * Redirect to dashboard if already authenticated
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = "dashboard.html";
      return true;
    }
    return false;
  },
};

// Make Auth available globally
window.Auth = Auth;
