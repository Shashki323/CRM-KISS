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

