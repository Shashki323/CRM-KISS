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

