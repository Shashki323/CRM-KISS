// api.js - Работа с API сервером

const API_BASE_URL = 'http://localhost:3000';

// --- Нормализация данных под разные версии БД ---
// Новая БД использует статусы типа 'active', старая — 'активен'.
// UI в текущем виде ожидает русские статусы и некоторые поля в "плоском" формате.

function normalizeClientStatus(status) {
    if (!status) return 'активен';
    const s = String(status).toLowerCase().trim();
    if (s === 'active' || s === 'enabled') return 'активен';
    if (s === 'inactive' || s === 'disabled') return 'неактивен';
    if (s === 'potential' || s === 'prospect') return 'потенциальный';
    // если уже русское значение или любое другое — возвращаем как есть
    return String(status);
}

function denormalizeClientStatus(status) {
    // На сервер (новая БД) предпочтительно отправлять 'active'/'inactive'.
    if (!status) return 'active';
    const s = String(status).toLowerCase().trim();
    if (s === 'активен') return 'active';
    if (s === 'неактивен') return 'inactive';
    return String(status);
}

function normalizeClient(client) {
    if (!client) return client;
    return {
        ...client,
        // гарантируем ожидаемые поля
        name: client.name ?? client.companyName ?? client.title ?? client.fullName,
        email: client.email ?? null,
        phone: client.phone ?? null,
        createdAt: client.createdAt ?? null,
        status: normalizeClientStatus(client.status)
    };
}

function denormalizeClient(payload) {
    if (!payload) return payload;
    return {
        ...payload,
        status: denormalizeClientStatus(payload.status)
    };
}

// Глобальные переменные
let apiCache = {
    clients: { data: null, timestamp: 0 },
    deals: { data: null, timestamp: 0 },
    users: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 30000; // 30 секунд

// Основная функция запроса
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = endpoint.replace('/', '');
    
    // Проверка кэша (только для GET запросов)
    if (!options.method || options.method === 'GET') {
        const cached = apiCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Используем кэш для', endpoint);
            return cached.data;
        }
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API ошибка: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Кэшируем GET запросы
        if (!options.method || options.method === 'GET') {
            apiCache[cacheKey] = {
                data: data,
                timestamp: Date.now()
            };
        }
        
        return data;
        
    } catch (error) {
        console.error('API запрос не удался:', endpoint, error);
        showNotification('Ошибка подключения к серверу', 'error');
        throw error;
    }
}

// Специфичные методы
const api = {
    // Клиенты
    getClients: async () => {
        const rows = await apiRequest('/clients');
        return Array.isArray(rows) ? rows.map(normalizeClient) : rows;
    },
    getClient: async (id) => normalizeClient(await apiRequest(`/clients/${id}`)),
    createClient: (data) => apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(denormalizeClient(data))
    }),
    updateClient: (id, data) => apiRequest(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(denormalizeClient(data))
    }),
    deleteClient: (id) => apiRequest(`/clients/${id}`, {
        method: 'DELETE'
    }),
    
    // Сделки
    getDeals: () => apiRequest('/deals'),
    getDeal: (id) => apiRequest(`/deals/${id}`),
    createDeal: (data) => apiRequest('/deals', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateDeal: (id, data) => apiRequest(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteDeal: (id) => apiRequest(`/deals/${id}`, {
        method: 'DELETE'
    }),
    
    // Поиск
    searchClients: async (query) => {
        const rows = await apiRequest(`/clients?q=${encodeURIComponent(query)}`);
        return Array.isArray(rows) ? rows.map(normalizeClient) : rows;
    },
    searchDeals: (query) => apiRequest(`/deals?q=${encodeURIComponent(query)}`),
    
    // Статистика
    getStats: async () => {
        const [clients, deals] = await Promise.all([
            api.getClients(),
            api.getDeals()
        ]);
        
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        const recentDeals = deals.filter(d => {
            if (!d.createdAt) return false;
            return new Date(d.createdAt) > monthAgo;
        });
        
        return {
            totalClients: clients.length,
            // после normalizeClientStatus все статусы клиентов в UI русские
            activeClients: clients.filter(c => (c.status || '').toLowerCase() === 'активен').length,
            totalDeals: deals.length,
            monthlySales: recentDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
            monthlyProfit: recentDeals.reduce((sum, d) => sum + (d.amount || 0) * 0.3, 0),
            recentDeals: deals
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
        };
    },
    
    // Очистка кэша
    clearCache: (key) => {
        if (key) {
            apiCache[key] = { data: null, timestamp: 0 };
        } else {
            apiCache = {
                clients: { data: null, timestamp: 0 },
                deals: { data: null, timestamp: 0 },
                users: { data: null, timestamp: 0 }
            };
        }
    }
};

// Утилиты
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    notifications.appendChild(notification);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Кнопка закрытия
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Экспорт
window.api = api;
window.showNotification = showNotification;