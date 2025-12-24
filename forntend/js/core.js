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
                            <span>Dashboards</span>
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


// Подключение CSS для страницы
function loadPageCss(pageName) {
    const id = 'page-css';
    let link = document.getElementById(id);
    if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    // base.css подключается в index.html, тут только страничный CSS
    link.href = `css/${pageName}.css`;
}

// Навигация по страницам
async function navigateTo(pageName, params = {}) {
    console.log('Переход на страницу:', pageName);
    
    // Сохраняем в историю
    pageHistory.push({ page: currentPage, params: params });
    if (pageHistory.length > 10) pageHistory.shift();
    
    // Уничтожаем старые графики
    destroyCharts();

    // Подключаем CSS страницы
    loadPageCss(pageName);
    
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
                <h3><i class="fas fa-chart-line"></i> Dashboards</h3>
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
        dashboard: 'Dashboards',
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

// Превращает статус в безопасное имя CSS-класса (без пробелов/символов)
function statusClass(status) {
    if (!status) return 'активен';
    return String(status)
        .toLowerCase()
        .trim()
        .replace(/ё/g, 'е')
        .replace(/\s+/g, '-')
        .replace(/[^0-9a-zа-я\-]/gi, '');
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
window.statusClass = statusClass;
window.statusClass = statusClass;

// все не работает