// api.js - Работа с API сервером

const API_BASE_URL = 'http://localhost:3000';

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
    getClients: () => apiRequest('/clients'),
    getClient: (id) => apiRequest(`/clients/${id}`),
    createClient: (data) => apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateClient: (id, data) => apiRequest(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
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
    searchClients: (query) => apiRequest(`/clients?q=${encodeURIComponent(query)}`),
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
            activeClients: clients.filter(c => c.status === 'активен').length,
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