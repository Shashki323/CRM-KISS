// script.js - Основная SPA логика

// Глобальные переменные
let currentPage = null;
let currentCharts = {};
let pageHistory = [];

// Инициализация приложения
async function initApp() {
    console.log('Инициализация CRM SPA...');
    
    // Загружаем боковую панель
    await loadSidebar();
    
    // Загружаем начальную страницу
    await navigateTo('dashboard');
    
    // Настраиваем глобальные обработчики
    setupGlobalHandlers();
    
    console.log('CRM SPA инициализирован');
}

// Загрузка боковой панели
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    try {
        // Можно загрузить из файла или генерировать
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                <ul class="nav-menu">
                    <li>
                        <a href="#" class="nav-item" data-page="dashboard">
                            <i class="fas fa-chart-line"></i>
                            <span>Дашборд</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-page="clients">
                            <i class="fas fa-users"></i>
                            <span>Клиенты</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-page="deals">
                            <i class="fas fa-box"></i>
                            <span>Сделки</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-page="users">
                            <i class="fas fa-address-book"></i>
                            <span>Пользователи</span>
                        </a>
                    </li>
                    <li class="nav-divider"></li>
                    <li>
                        <a href="#" class="nav-item" data-page="settings">
                            <i class="fas fa-cog"></i>
                            <span>Настройки</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div class="sidebar-footer">
                <div class="api-status">
                    <span class="status-dot status-online"></span>
                    <span>API доступен</span>
                </div>
            </div>
        `;
        
        // Навешиваем обработчики на меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                navigateTo(page);
            });
        });
        
    } catch (error) {
        console.error('Ошибка загрузки сайдбара:', error);
        sidebar.innerHTML = '<div class="sidebar-error">Ошибка загрузки меню</div>';
    }
}

// Навигация по страницам
async function navigateTo(pageName, params = {}) {
    console.log('Переход на страницу:', pageName);
    
    // Сохраняем в историю
    pageHistory.push({ page: currentPage, params: params });
    if (pageHistory.length > 10) pageHistory.shift();
    
    // Уничтожаем старые графики
    destroyCharts();
    
    // Показываем загрузку
    showLoading(true);
    
    try {
        // Загружаем контент страницы
        await loadPageContent(pageName, params);
        
        // Обновляем активный пункт меню
        updateActiveMenuItem(pageName);
        
        // Сохраняем текущую страницу
        currentPage = pageName;
        
        // Обновляем заголовок
        updatePageTitle(pageName);
        
    } catch (error) {
        console.error('Ошибка загрузки страницы:', error);
        showError('Не удалось загрузить страницу');
    } finally {
        showLoading(false);
    }
}

// Загрузка контента страницы
async function loadPageContent(pageName, params) {
    const contentWrapper = document.getElementById('contentWrapper');
    if (!contentWrapper) return;
    
    // Очищаем контент
    contentWrapper.innerHTML = '<div class="loading-content"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    
    // Загружаем компонент страницы
    const content = await loadComponent(pageName);
    
    // Вставляем контент
    contentWrapper.innerHTML = content;
    
    // Инициализируем страницу
    await initPage(pageName, params);
}

// Загрузка компонента
async function loadComponent(componentName) {
    try {
        // Пытаемся загрузить из файла
        const response = await fetch(`components/${componentName}.html`);
        if (!response.ok) throw new Error('Файл не найден');
        
        return await response.text();
        
    } catch (error) {
        console.warn(`Компонент ${componentName}.html не найден, используем заглушку`);
        
        // Возвращаем заглушку
        return getComponentStub(componentName);
    }
}

// Заглушки для компонентов
function getComponentStub(pageName) {
    const stubs = {
        dashboard: `
            <div class="page-stub">
                <h3><i class="fas fa-chart-line"></i> Дашборд</h3>
                <p>Загрузка аналитики...</p>
                <div id="dashboardContent"></div>
            </div>
        `,
        clients: `
            <div class="page-stub">
                <h3><i class="fas fa-users"></i> Клиенты</h3>
                <p>Загрузка списка клиентов...</p>
                <div id="clientsContent"></div>
            </div>
        `,
        deals: `
            <div class="page-stub">
                <h3><i class="fas fa-box"></i> Сделки</h3>
                <p>Загрузка списка сделок...</p>
                <div id="dealsContent"></div>
            </div>
        `,
        users: `
            <div class="page-stub">
                <h3><i class="fas fa-address-book"></i> Пользователи</h3>
                <p>Загрузка списка пользователей...</p>
                <div id="usersContent"></div>
            </div>
        `,
        settings: `
            <div class="page-stub">
                <h3><i class="fas fa-cog"></i> Настройки</h3>
                <p>Раздел в разработке...</p>
            </div>
        `
    };
    
    return stubs[pageName] || '<div class="page-error">Страница не найдена</div>';
}

// Инициализация конкретной страницы
async function initPage(pageName, params) {
    switch (pageName) {
        case 'dashboard':
            await initDashboardPage();
            break;
        case 'clients':
            await initClientsPage();
            break;
        case 'deals':
            await initDealsPage();  // ← добавьте эту строку
            break;
        case 'users':
            await initUsersPage();  // ← добавьте эту строку
            break;
        case 'settings':
            await initSettingsPage(); // ← добавьте эту строку
            break;
        default:
            console.warn('Неизвестная страница:', pageName);
    }
}

// Инициализация дашборда
async function initDashboardPage() {
    console.log('Инициализация дашборда');
    
    try {
        // Загружаем статистику
        const stats = await api.getStats();
        
        // Обновляем KPI
        updateDashboardKPI(stats);
        
        // Создаем графики
        createDashboardCharts(stats);
        
        // Обновляем таблицу сделок (используем deals из stats или отдельную загрузку)
        const deals = await api.getDeals();
        updateRecentDeals(deals);
        
        // Настраиваем кнопки
        setupDashboardButtons();
        
    } catch (error) {
        console.error('Ошибка инициализации дашборда:', error);
        showError('Не удалось загрузить статистику');
    }
}

// Обновление KPI дашборда
function updateDashboardKPI(stats) {
    const kpiElements = {
        totalClients: document.getElementById('kpiTotalClients'),
        activeClients: document.getElementById('kpiActiveClients'),
        totalDeals: document.getElementById('kpiTotalDeals'),
        monthlySales: document.getElementById('kpiMonthlySales'),
        monthlyProfit: document.getElementById('kpiMonthlyProfit')
    };
    
    if (kpiElements.totalClients) {
        kpiElements.totalClients.textContent = stats.totalClients;
    }
    if (kpiElements.activeClients) {
        kpiElements.activeClients.textContent = stats.activeClients;
    }
    if (kpiElements.totalDeals) {
        kpiElements.totalDeals.textContent = stats.totalDeals;
    }
    if (kpiElements.monthlySales) {
        kpiElements.monthlySales.textContent = formatCurrency(stats.monthlySales);
    }
    if (kpiElements.monthlyProfit) {
        kpiElements.monthlyProfit.textContent = formatCurrency(stats.monthlyProfit);
    }
}

// Обновление таблицы последних сделок в дашборде
function updateRecentDeals(deals) {
    const tbody = document.getElementById('recentDealsTable');
    if (!tbody) return;
    
    // Сортируем по дате (новые сверху), берем 10 последних
    const recent = deals
        .filter(d => d.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Нет сделок</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map(deal => `
        <tr>
            <td>#${deal.id || '—'}</td>
            <td><strong>${deal.clientName || deal.clientId || 'Без клиента'}</strong></td>
            <td>${deal.title || 'Без названия'}</td>
            <td>${formatCurrency(deal.amount || 0)}</td>
            <td>
                <span class="status-badge status-${deal.status || 'новый'}">
                    ${deal.status || 'новый'}
                </span>
            </td>
            <td>${formatDate(deal.createdAt)}</td>
        </tr>
    `).join('');
    
    console.log('Обновлена таблица сделок:', recent.length, 'записей');
}

// Настройка кнопок дашборда
function setupDashboardButtons() {
    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            await initDashboardPage();
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить дашборд';
            }, 1000);
        });
    }
    
    // Обработчик выбора периода
    const periodSelect = document.querySelector('.chart-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            console.log('Выбран период:', periodSelect.value);
            // Здесь можно добавить перерисовку графика
        });
    }
}    

// Создание графиков дашборда
function createDashboardCharts(stats) {
    // График продаж
    createSalesChart(stats);
    
    // Круговая диаграмма статусов
    createStatusChart(stats);
}

function createSalesChart(stats) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        console.warn('Canvas salesChart не найден');
        return;
    }
    
    // Уничтожаем старый график
    if (currentCharts.sales) {
        currentCharts.sales.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Простые тестовые данные (замените реальными)
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    const salesData = [120000, 150000, 180000, 140000, 220000, 200000];
    
    currentCharts.sales = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Продажи',
                data: salesData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    console.log('График продаж создан');
}

function createStatusChart(stats) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) {
        console.warn('Canvas statusChart не найден');
        return;
    }
    
    if (currentCharts.status) {
        currentCharts.status.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // Тестовые данные (замените реальными)
    const statusData = {
        'новый': 5,
        'в работе': 8,
        'завершен': 12,
        'отменен': 2
    };
    
    currentCharts.status = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusData),
            datasets: [{
                data: Object.values(statusData),
                backgroundColor: [
                    '#FF9800', // новый
                    '#2196F3', // в работе
                    '#4CAF50', // завершен
                    '#F44336'  // отменен
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    console.log('Круговая диаграмма создана');
}

// Инициализация страницы клиентов
async function initClientsPage() {
    console.log('Инициализация клиентов');
    
    try {
        const clients = await api.getClients();
        console.log('Клиенты загружены:', clients.length);
        renderClientsTable(clients);
        setupClientsHandlers(); // ← добавьте этот вызов
        
    } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        showError('Не удалось загрузить клиентов');
    }
}

// Инициализация страницы сделок
async function initDealsPage() {
    console.log('Инициализация сделок');
    
    try {
        const deals = await api.getDeals();
        console.log('Сделки загружены:', deals.length);
        renderDealsTable(deals);
        setupDealsHandlers();
        
    } catch (error) {
        console.error('Ошибка загрузки сделок:', error);
        showError('Не удалось загрузить сделки');
    }
}

// Рендер таблицы сделок
function renderDealsTable(deals) {
    const tbody = document.getElementById('dealsTableBody');
    if (!tbody) return;
    
    if (deals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Сделок пока нет</td></tr>';
        return;
    }
    
    tbody.innerHTML = deals.map(deal => `
        <tr>
            <td>${deal.id}</td>
            <td>
                <div class="deal-title">${deal.title || 'Без названия'}</div>
                ${deal.description ? `<small>${deal.description}</small>` : ''}
            </td>
            <td>${deal.clientName || deal.clientId || '—'}</td>
            <td>${formatCurrency(deal.amount || 0)}</td>
            <td>
                <span class="status-badge status-${deal.status || 'новый'}">
                    ${deal.status || 'новый'}
                </span>
            </td>
            <td>${formatDate(deal.createdAt)}</td>
            <td>${formatDate(deal.deadline)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-action btn-edit" data-deal-id="${deal.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Настройка обработчиков для страницы сделок
function setupDealsHandlers() {
    console.log('Настройка обработчиков сделок...');
    
    // Кнопка добавления сделки
    const addBtn = document.getElementById('addDealBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            console.log('Открытие формы добавления сделки');
            showDealForm();
        });
    }
    
    // Поиск сделок
    const searchInput = document.getElementById('dealSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterDeals(e.target.value);
        });
    }
    
    // Фильтр по статусу
    const statusFilter = document.getElementById('dealStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterDeals('', e.target.value);
        });
    }
}

// Показать форму сделки
function showDealForm(deal = null) {
    alert(deal ? `Редактирование сделки #${deal.id}` : 'Добавление новой сделки');
}

// Фильтрация сделок
function filterDeals(searchTerm = '', status = '') {
    console.log('Фильтрация сделок:', { searchTerm, status });
}

// Инициализация страницы пользователей
async function initUsersPage() {
    console.log('Инициализация пользователей');
    // Пока просто показываем статическую страницу
    setupUsersHandlers();
}

// Настройка обработчиков для страницы пользователей
function setupUsersHandlers() {
    console.log('Настройка обработчиков пользователей...');
    
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert('Добавление пользователя - в разработке');
        });
    }
}

// Инициализация страницы настроек
async function initSettingsPage() {
    console.log('Инициализация настроек');
    // Пока просто показываем статическую страницу
    setupSettingsHandlers();
}

// Настройка обработчиков для страницы настроек
function setupSettingsHandlers() {
    console.log('Настройка обработчиков настроек...');
    
    // Обработчики для чекбоксов и кнопок на странице настроек
    const checkConnectionBtn = document.querySelector('.settings-card .btn-outline');
    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener('click', () => {
            alert('Проверка соединения...\nСоединение с API установлено!');
        });
    }
}

// Рендер таблицы клиентов
function renderClientsTable(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Клиентов пока нет</td></tr>';
        return;
    }
    
    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.id}</td>
            <td>
                <div class="client-name">${client.name || 'Без названия'}</div>
                ${client.company ? `<small>${client.company}</small>` : ''}
            </td>
            <td>${client.contactPerson || '—'}</td>
            <td>${client.email || '—'}</td>
            <td>${client.phone || '—'}</td>
            <td>
                <span class="status-badge status-${client.status || 'активен'}">
                    ${client.status || 'активен'}
                </span>
            </td>
            <td>${formatDate(client.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-action btn-edit" data-client-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-client-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Настройка обработчиков для страницы клиентов
function setupClientsHandlers() {
    console.log('Настройка обработчиков клиентов...');
    
    // Кнопка добавления клиента
    const addBtn = document.getElementById('addClientBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            console.log('Открытие формы добавления клиента');
            showClientForm();
        });
    }
    
    // Поиск клиентов
    const searchInput = document.getElementById('clientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterClients(e.target.value);
        });
    }
    
    // Фильтр по статусу
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterClients('', e.target.value);
        });
    }
    
    // Если есть кнопки редактирования/удаления в таблице
    setTimeout(() => {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = e.target.closest('button').dataset.clientId;
                editClient(clientId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = e.target.closest('button').dataset.clientId;
                deleteClient(clientId);
            });
        });
    }, 100);
}

// Показать форму клиента
function showClientForm(client = null) {
    alert(client ? `Редактирование клиента #${client.id}` : 'Добавление нового клиента');
    // Здесь будет модальное окно
}

// Редактировать клиента
function editClient(id) {
    console.log('Редактирование клиента:', id);
    // Здесь будет загрузка данных клиента и открытие формы
}

// Удалить клиента
function deleteClient(id) {
    if (confirm('Удалить клиента?')) {
        console.log('Удаление клиента:', id);
        // Здесь будет DELETE запрос к API
    }
}

// Фильтрация клиентов
function filterClients(searchTerm = '', status = '') {
    console.log('Фильтрация клиентов:', { searchTerm, status });
    // Здесь будет логика фильтрации
}

// Утилиты
function showLoading(show) {
    const loader = document.querySelector('.loading-screen');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    console.error('Ошибка:', message);
    // Можно показать уведомление пользователю
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #ffebee; color: #c62828; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `;
    
    const contentWrapper = document.getElementById('contentWrapper');
    if (contentWrapper) {
        contentWrapper.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function updateActiveMenuItem(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function updatePageTitle(pageName) {
    const titles = {
        dashboard: 'Дашборд',
        clients: 'Клиенты',
        deals: 'Сделки',
        users: 'Пользователи',
        settings: 'Настройки'
    };
    
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = titles[pageName] || 'CRM';
    }
}

function destroyCharts() {
    Object.values(currentCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    currentCharts = {};
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
        return '—';
    }
}

// Глобальные обработчики
function setupGlobalHandlers() {
    // Обработчик выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Выйти из системы?')) {
                localStorage.removeItem('crm_token');
                location.reload();
            }
        });
    }
    
    // Кнопка "Назад" в браузере
    window.addEventListener('popstate', () => {
        if (pageHistory.length > 0) {
            const prev = pageHistory.pop();
            if (prev) {
                navigateTo(prev.page, prev.params);
            }
        }
    });
}

// Экспорт
window.initApp = initApp;
window.navigateTo = navigateTo;
window.currentCharts = currentCharts;