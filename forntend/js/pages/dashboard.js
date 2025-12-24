// js/pages/dashboard.js

// --------------------------
// globals / fallbacks
// --------------------------
window.currentCharts = window.currentCharts || { sales: null, status: null };

function formatCurrency(value) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  } catch {
    return `${n} ₽`;
  }
}

function showError(msg) {
  console.error(msg);
}

// Безопасная установка текста
function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

// Безопасный класс статуса (без пробелов/символов)
function statusClass(status) {
  return (status || "без статуса")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-я0-9\-]/gi, "");
}

// --------------------------
// KPI (карточки)
// --------------------------
function updateDashboardKPI(stats) {
  setText("#kpiTotalClients", stats.totalClients ?? 0);
  setText("#kpiActiveClients", stats.activeClients ?? 0);
  setText("#kpiTotalDeals", stats.totalDeals ?? 0);
  setText("#kpiMonthlySales", formatCurrency(stats.monthlySales ?? 0));
  setText("#kpiMonthlyProfit", formatCurrency(stats.monthlyIncome ?? 0)); // доход/прибыль 30%
}


// --------------------------
// Таблица "последние сделки"
// --------------------------
function updateDashboardDealsTable(deals) {
  // Пытаемся найти tbody (у тебя может отличаться разметка)
  const tbody =
    document.querySelector("#recentDealsTable tbody") ||
    document.querySelector(".recent-deals tbody") ||
    document.querySelector("table tbody");

  if (!tbody) return;

  // Сортируем по createdAt DESC и берём последние 5
  const sorted = (deals || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:14px;opacity:.7;">Нет сделок</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map(d => {
      const date = d.createdAt || "-";
      const title = d.title || "-";
      const client = d.clientName || d.clientId || "-";
      const amount = formatCurrency(d.amount || 0);
      const status = d.status || "без статуса";

      return `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(title)}</td>
          <td>${escapeHtml(String(client))}</td>
          <td>${amount}</td>
          <td><span class="status-badge status-${statusClass(status)}">${escapeHtml(status)}</span></td>
        </tr>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --------------------------
// data helpers
// --------------------------
function mapDealsClientName(deals, clients) {
  const map = new Map((clients || []).map(c => [c.id, c.name]));
  return (deals || []).map(d => ({
    ...d,
    clientName: map.get(d.clientId) || ""
  }));
}

function getSelectedMonths() {
  const el = document.querySelector(".chart-period");
  const val = el ? Number(el.value) : 6;
  return Number.isFinite(val) ? val : 6;
}

function aggregateDealsByMonth(deals, monthsBack = 6) {
  const list = (deals || []).filter(d => d.createdAt);

  // "опорная" дата = максимальная из данных
  let maxDate = new Date(0);
  for (const d of list) {
    const dt = new Date(d.createdAt);
    if (!isNaN(dt) && dt > maxDate) maxDate = dt;
  }
  if (maxDate.getTime() === 0) return { labels: [], totals: [] };

  const keys = [];
  const totalsMap = {};
  const cursor = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
    totalsMap[key] = 0;
  }

  for (const d of list) {
    const dt = new Date(d.createdAt);
    if (isNaN(dt)) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (key in totalsMap) totalsMap[key] += Number(d.amount) || 0;
  }

  const labels = keys.map(k => {
    const [y, m] = k.split("-");
    return `${m}.${y}`;
  });
  const totals = keys.map(k => totalsMap[k]);

  return { labels, totals };
}

function aggregateDealsByStatus(deals) {
  const map = {};
  for (const d of deals || []) {
    const s = (d.status || "без статуса").toString().trim().toLowerCase();
    map[s] = (map[s] || 0) + 1;
  }
  const labels = Object.keys(map);
  const counts = labels.map(k => map[k]);
  return { labels, counts };
}

// --------------------------
// charts
// --------------------------
function renderDashboardCharts(deals) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js не подключён");
    return;
  }

  const months = getSelectedMonths();
  const monthly = aggregateDealsByMonth(deals, months);
  createSalesChart(monthly.labels, monthly.totals);

  const status = aggregateDealsByStatus(deals);
  createStatusChart(status.labels, status.counts);
}

function createSalesChart(labels, data) {
  const canvas = document.getElementById("salesChart");
  if (!canvas) return;

  if (window.currentCharts.sales) window.currentCharts.sales.destroy();

  window.currentCharts.sales = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Сумма сделок",
          data,
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => formatCurrency(v) }
        }
      }
    }
  });
}

function createStatusChart(labels, data) {
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  if (window.currentCharts.status) window.currentCharts.status.destroy();

  window.currentCharts.status = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, borderWidth: 1 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } }
    }
  });
}

// --------------------------
// main
// --------------------------
async function initDashboardPage() {
  try {
    // KPI
    const stats = await api.getStats();
    updateDashboardKPI(stats);

    // Data
    const deals = await api.getDeals();
    const clients = await api.getClients();
    const dealsWithClientName = mapDealsClientName(deals, clients);

    // Table
    updateDashboardDealsTable(dealsWithClientName);

    // Charts
    renderDashboardCharts(deals);

    // period select re-render
    const periodSelect = document.querySelector(".chart-period");
    if (periodSelect && !periodSelect.dataset.bound) {
      periodSelect.dataset.bound = "1";
      periodSelect.addEventListener("change", () => renderDashboardCharts(deals));
    }
  } catch (e) {
    console.error(e);
    showError("Не удалось загрузить дашборд");
  }
}

// Старт страницы
initDashboardPage();
