document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы DOM
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userBalance = document.getElementById('user-balance');
    const profileDropdown = document.getElementById('profile-dropdown');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginClose = document.getElementById('login-close');
    const registerClose = document.getElementById('register-close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutLink = document.querySelector('a[href="#logout"]');
    const themeToggle = document.getElementById('theme-toggle');
    const resultsContainer = document.getElementById('results-container');
    const resultsSearch = document.getElementById('results-search');
    const periodButtons = document.querySelectorAll('.quick-buttons .sidebar-btn');
    const sportLinks = document.querySelectorAll('.sports-nav a');

    // API URL
    const API_URL = 'http://localhost:3000/api';

    // Функция для выполнения API запросов
    async function fetchAPI(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
                body: options.body
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const error = JSON.parse(errorText);
                    throw new Error(error.message || 'Ошибка сервера');
                } catch (e) {
                    throw new Error(errorText || 'Ошибка сервера');
                }
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Инициализация темы
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = 'Светлая тема';
    }

    // Проверка авторизации при загрузке
    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userData = await fetchAPI('/user');
                updateUIAfterLogin(userData);
            } catch (error) {
                localStorage.removeItem('token');
                console.error('Auth check failed:', error);
            }
        }
    }

    checkAuth();

    // Обработчик переключения темы
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDark);
        themeToggle.textContent = isDark ? 'Светлая тема' : 'Темная тема';
    });

    // Открытие модальных окон
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    registerBtn.addEventListener('click', () => {
        registerModal.style.display = 'block';
    });

    // Закрытие модальных окон
    loginClose.addEventListener('click', () => {
        loginModal.style.display = 'none';
        loginForm.reset();
    });

    registerClose.addEventListener('click', () => {
        registerModal.style.display = 'none';
        registerForm.reset();
    });

    // Обработка регистрации
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const data = await fetchAPI('/register', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            localStorage.setItem('token', data.token);
            updateUIAfterLogin(data.user);
            registerModal.style.display = 'none';
            registerForm.reset();
            alert('Регистрация успешна!');
        } catch (error) {
            alert(error.message);
        }
    });

    // Обработка входа
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await fetchAPI('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            localStorage.setItem('token', data.token);
            updateUIAfterLogin(data.user);
            loginModal.style.display = 'none';
            loginForm.reset();
        } catch (error) {
            alert(error.message);
        }
    });

    // Обработка выхода
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        profileDropdown.style.display = 'none';
        userBalance.style.display = 'none';
    });

    // Закрытие модальных окон при клике вне их области
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            loginForm.reset();
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
            registerForm.reset();
        }
    });

    // Функция обновления UI после входа
    function updateUIAfterLogin(user) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        profileDropdown.style.display = 'block';
        userBalance.style.display = 'inline';
        userBalance.textContent = `Баланс: ${user.balance} ₽`;
    }

    // Функция загрузки результатов
    async function loadResults(period = 'today', sport = null) {
        try {
            const events = await fetchAPI('/events');
            const filteredEvents = events.filter(event => {
                const eventDate = new Date(event.datetime);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);

                const dateFilter = period === 'today' ? 
                    eventDate >= today :
                    period === 'week' ? 
                        eventDate >= weekAgo :
                        eventDate >= monthAgo;

                const sportFilter = !sport || event.sport === sport;

                return event.status === 'completed' && dateFilter && sportFilter;
            });

            displayResults(filteredEvents);
        } catch (error) {
            console.error('Load results error:', error);
            alert('Ошибка при загрузке результатов');
        }
    }

    // Функция отображения результатов
    function displayResults(events) {
        const sportIcons = {
            football: '⚽',
            basketball: '🏀',
            tennis: '🎾',
            hockey: '🏒',
            cybersport: '🎮',
            mma: '🥊',
            boxing: '🥊',
            biathlon: '🎿'
        };

        resultsContainer.innerHTML = events.map(event => {
            const date = new Date(event.datetime);
            const formattedDate = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="result-card">
                    <div class="result-header">
                        <div class="result-sport">
                            <span class="icon">${sportIcons[event.sport]}</span>
                            ${event.name}
                        </div>
                        <div class="result-date">${formattedDate}</div>
                    </div>
                    <div class="result-teams">
                        ${event.team1} vs ${event.team2}
                    </div>
                    <div class="result-info">
                        <div class="result-coefficients">
                            <span class="coefficient ${event.result === 'win1' ? 'active' : ''}">П1 ${event.coefficients.win1}</span>
                            ${event.coefficients.draw ? `<span class="coefficient ${event.result === 'draw' ? 'active' : ''}">X ${event.coefficients.draw}</span>` : ''}
                            <span class="coefficient ${event.result === 'win2' ? 'active' : ''}">П2 ${event.coefficients.win2}</span>
                        </div>
                        <div class="result-status ${event.result}">
                            ${event.result === 'win1' ? 'П1' : event.result === 'draw' ? 'X' : 'П2'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Обработчики фильтрации по периодам
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadResults(button.dataset.period);
        });
    });

    // Обработчики фильтрации по видам спорта
    sportLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sport = e.currentTarget.dataset.sport;
            loadResults(document.querySelector('.quick-buttons .active').dataset.period, sport);
        });
    });

    // Обработчик поиска
    resultsSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = resultsContainer.querySelectorAll('.result-card');
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Инициализация: загружаем результаты за сегодня
    loadResults('today');
}); 