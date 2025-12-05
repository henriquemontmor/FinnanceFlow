// ==========================================
// FinnanceFlow - Login Page
// ==========================================

// Verificar configuração
if (!CONFIG.API_URL || CONFIG.API_URL.includes("YOUR_DEPLOYMENT_ID")) {
  alert(
    "⚠️ CONFIGURAÇÃO NECESSÁRIA\n\n" +
      "A URL da API ainda não foi configurada.\n\n" +
      "Por favor, edite o arquivo js/config.js e adicione a URL do seu Apps Script."
  );
}

// Check if user is already logged in
(async function checkExistingSession() {
  const token = Auth.getToken();
  if (token) {
    // Validar se o token ainda é válido
    const isValid = await Auth.validateToken(token);
    if (isValid) {
      // Token válido, redirecionar para dashboard
      window.location.href = "dashboard.html";
      return;
    } else {
      // Token expirado, limpar
      Auth.removeToken();
    }
  }
})();

// Get form elements
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");
const submitButton = loginForm.querySelector('button[type="submit"]');
const btnText = submitButton.querySelector(".btn-text");
const btnLoader = submitButton.querySelector(".btn-loader");

/**
 * Show error message
 */
function showError(message) {
  errorMessage.innerHTML = message.replace(/\n/g, "<br>");
  errorMessage.style.display = "block";

  // Se for erro de CORS, adicionar botão de ajuda
  if (
    message.includes("CORS") ||
    message.includes("Failed to fetch") ||
    message.includes("GitHub Pages")
  ) {
    const helpButton = document.createElement("button");
    helpButton.textContent = "🔧 Ver Soluções";
    helpButton.className = "btn btn-secondary";
    helpButton.style.marginTop = "10px";
    helpButton.onclick = () => {
      window.location.href = "fix-cors-rapido.html";
    };
    errorMessage.appendChild(document.createElement("br"));
    errorMessage.appendChild(helpButton);
  }

  // Auto-hide after 15 seconds (mais tempo para ler)
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 15000);
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.style.display = "none";
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  usernameInput.disabled = isLoading;
  passwordInput.disabled = isLoading;

  if (isLoading) {
    btnText.style.display = "none";
    btnLoader.style.display = "inline";
  } else {
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

/**
 * Handle login form submission
 */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Validate input
  if (!username || !password) {
    showError("Por favor, preencha usuário e senha.");
    return;
  }

  setLoading(true);

  try {
    // Login with username and password
    const result = await Auth.login(username, password);

    if (result.success) {
      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } else {
      showError(result.error || "Usuário ou senha inválidos.");
      passwordInput.value = "";
      passwordInput.focus();
    }
  } catch (error) {
    console.error("Login error:", error);
    showError(
      "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente."
    );
  } finally {
    setLoading(false);
  }
});

// Focus on username input on page load
usernameInput.focus();
