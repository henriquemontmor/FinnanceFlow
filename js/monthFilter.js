// ==========================================
// FinnanceFlow - Month/Year Filter
// ==========================================

// State
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// Month names in Portuguese
const MONTH_NAMES = [
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

// ==========================================
// Initialize Filter
// ==========================================

function initMonthYearFilter() {
  const filterContainer = document.querySelector(".filters");

  if (!filterContainer) return;

  // Create month/year filter HTML
  const filterHTML = `
    <div class="month-year-filter">
      <button id="prevMonth" class="month-nav-btn" title="Mês anterior">◀</button>
      <div class="month-year-display">
        <span id="currentMonthYear">${
          MONTH_NAMES[currentMonth - 1]
        } ${currentYear}</span>
      </div>
      <button id="nextMonth" class="month-nav-btn" title="Próximo mês">▶</button>
      <button id="resetMonth" class="btn btn-secondary btn-sm" title="Voltar ao mês atual">Atual</button>
    </div>
  `;

  // Insert before existing filters
  filterContainer.insertAdjacentHTML("afterbegin", filterHTML);

  // Add event listeners
  document.getElementById("prevMonth").addEventListener("click", () => {
    changeMonth(-1);
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    changeMonth(1);
  });

  document.getElementById("resetMonth").addEventListener("click", () => {
    resetToCurrentMonth();
  });

  updateMonthYearDisplay();
}

// ==========================================
// Month Navigation
// ==========================================

function changeMonth(delta) {
  currentMonth += delta;

  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  } else if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }

  updateMonthYearDisplay();

  // Reload dashboard with new month/year
  if (typeof loadDashboardData === "function") {
    loadDashboardData();
  }
}

function resetToCurrentMonth() {
  const now = new Date();
  currentMonth = now.getMonth() + 1;
  currentYear = now.getFullYear();

  updateMonthYearDisplay();

  // Reload dashboard with current month/year
  if (typeof loadDashboardData === "function") {
    loadDashboardData();
  }
}

function updateMonthYearDisplay() {
  const display = document.getElementById("currentMonthYear");
  if (display) {
    display.textContent = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
  }
}

// ==========================================
// Getters
// ==========================================

function getCurrentMonthYear() {
  return {
    month: currentMonth,
    year: currentYear,
  };
}

// Make functions available globally
window.getCurrentMonthYear = getCurrentMonthYear;
window.initMonthYearFilter = initMonthYearFilter;
