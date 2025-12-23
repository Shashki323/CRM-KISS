document.addEventListener("DOMContentLoaded", () => {
    // --- Диагностика: проверим, загружен ли Chart ---
    console.log("typeof Chart:", typeof Chart);
    if (typeof Chart === "undefined") {
        console.error("Chart.js не загружен. Проверьте подключение CDN или подключите chart.umd.min.js локально.");
        // показываем в UI (опционально)
        const chartWrapper = document.querySelector(".chart-wrapper");
        if (chartWrapper) {
            chartWrapper.innerHTML = "<div style='color:#a11; padding:20px;'>Ошибка: Chart.js не найден. Проверьте подключение CDN.</div>";
        }
        return;
    }

    /* ======= Данные тестовые ======= */
    const dashboardData = {
        salesMonth: 340000,
        newOrders: 28,
        profit: 120000,
        clients: 15,
    };

    const salesChartData = {
        labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
        values: [120000, 150000, 170000, 140000, 200000, 220000]
    };

    const lastOrders = [
        { id: 101, client: "ООО Прима", amount: 24000, status: "Оплачено" },
        { id: 102, client: "ИП Козлов", amount: 18000, status: "Обработка" },
        { id: 103, client: "TechStore", amount: 52000, status: "Отправлено" },
        { id: 104, client: "Рога и Копыта", amount: 31000, status: "Оплачено" },
        { id: 105, client: "Мама и Папа", amount: 51000, status: "Оплачено" },
        { id: 106, client: "ООО Мир Металл", amount: 61000, status: "Отправлено" },
        { id: 107, client: "Сметана", amount: 21000, status: "Обработка" },
        { id: 108, client: "Горчица", amount: 11000, status: "Оплачено" },
        { id: 109, client: "Ромашка", amount: 121000, status: "Отменено" }
    ];

    /* ======= Рендер KPI ======= */
    document.getElementById("salesMonth").textContent = dashboardData.salesMonth + " ₽";
    document.getElementById("newOrders").textContent = dashboardData.newOrders;
    document.getElementById("profit").textContent = dashboardData.profit + " ₽";
    document.getElementById("clientsCount").textContent = dashboardData.clients;

    /* ======= Таблица ======= */
    const ordersBody = document.getElementById("ordersTableBody");
    lastOrders.forEach(order => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${order.id}</td><td>${order.client}</td><td>${order.amount} ₽</td><td>${order.status}</td>`;
        ordersBody.appendChild(tr);
    });

    /* ======= Построение графика ======= */
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        console.error("Canvas с id 'salesChart' не найден");
        return;
    }

    // explicit context
    const ctx = canvas.getContext('2d');

    // Создаём chart
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesChartData.labels,
            datasets: [{
                label: 'Продажи, ₽',
                data: salesChartData.values,
                borderWidth: 3,
                borderColor: '#0984e3',
                tension: 0.35,
                fill: true,
                backgroundColor: 'rgba(9,132,227,0.18)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: {
                    ticks: {
                        // форматирование чисел (тысячи)
                        callback: function(value) {
                            return value.toLocaleString('ru-RU') + ' ₽';
                        }
                    }
                }
            }
        }
    });

    console.log("Chart created:", myChart);

    /* ======= Круговая диаграмма статусов заказов ======= */

const statuses = lastOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
}, {});

const statusLabels = Object.keys(statuses);
const statusValues = Object.values(statuses);

const statusCanvas = document.getElementById('statusChart').getContext('2d');

const statusChart = new Chart(statusCanvas, {
    type: 'pie',
    data: {
        labels: statusLabels,
        datasets: [{
            data: statusValues,
            backgroundColor: [
                '#00b894', // Оплачено
                '#0984e3', // Обработка
                '#fdcb6e', // Отправлено
                '#d63031'  // Отменено (если есть)
            ],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    }
});


    /* ======= Меню переключение страниц ======= */
    const menuItems = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".section");
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const page = item.dataset.page;
            sections.forEach(s => s.classList.add("hidden"));
            const target = document.getElementById(page);
            if (target) target.classList.remove("hidden");
            // При переключении: если chart находится в скрытой секции,
            // вызовем update() после показа — не требуется здесь, но на будущее:
            if (page === 'dashboard') {
                // обновим размер графика, если нужно
                myChart.resize();
                myChart.update();
            }
        });
    });
});
