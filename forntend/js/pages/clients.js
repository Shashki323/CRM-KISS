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
                <span class="status-badge status-${statusClass(client.status || 'активен')}">
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

