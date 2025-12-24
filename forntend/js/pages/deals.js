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
                <span class="status-badge status-${statusClass(deal.status || 'новый')}">
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

