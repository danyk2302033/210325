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
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminClose = document.getElementById('admin-close');
    const adminForm = document.getElementById('admin-form');
    const betModal = document.getElementById('bet-modal');
    const betClose = document.getElementById('bet-close');
    const betForm = document.getElementById('bet-form');
    const eventsContainer = document.getElementById('events-container');
    const adminEventsContainer = document.getElementById('admin-events-container');
    const betsHistoryModal = document.getElementById('bets-history-modal');
    const betsHistoryClose = document.getElementById('bets-history-close');
    const betsHistoryContainer = document.getElementById('bets-history-container');

    // API URL
    const API_URL = 'http://127.0.0.1:3000/api';

    // Функция для выполнения API запросов
    async function fetchAPI(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            console.log(`Sending request to ${API_URL}${endpoint}`, { ...options, headers });
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
                body: options.body
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                try {
                    const error = JSON.parse(errorText);
                    throw new Error(error.message || 'Ошибка сервера');
                } catch (e) {
                    throw new Error(errorText || 'Ошибка сервера');
                }
            }

            const data = await response.json();
            console.log(`Response from ${endpoint}:`, data);
            return data;
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
                if (userData.isAdmin) {
                    adminPanelBtn.style.display = 'inline-block';
                }
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

    adminPanelBtn?.addEventListener('click', () => {
        adminModal.style.display = 'block';
        loadAdminEvents();
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

    adminClose?.addEventListener('click', () => {
        adminModal.style.display = 'none';
        adminForm.reset();
    });

    betClose?.addEventListener('click', () => {
        betModal.style.display = 'none';
        betForm.reset();
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

            if (data.user.isAdmin) {
                adminPanelBtn.style.display = 'inline-block';
            }

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

            if (data.user.isAdmin) {
                adminPanelBtn.style.display = 'inline-block';
            }

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
        adminPanelBtn.style.display = 'none';
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
        if (event.target === adminModal) {
            adminModal.style.display = 'none';
            adminForm.reset();
        }
        if (event.target === betModal) {
            betModal.style.display = 'none';
            betForm.reset();
        }
        if (event.target === betsHistoryModal) {
            betsHistoryModal.style.display = 'none';
        }
    });

    // Обработка добавления события админом
    adminForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hasDraw = document.getElementById('hasDraw').checked;
        const eventData = {
            sport: document.getElementById('eventSport').value,
            name: document.getElementById('eventName').value,
            datetime: document.getElementById('eventDateTime').value,
            team1: document.getElementById('team1').value,
            team2: document.getElementById('team2').value,
            coefficients: {
                win1: parseFloat(document.getElementById('coef1').value),
                win2: parseFloat(document.getElementById('coef2').value)
            }
        };

        // Добавляем коэффициент ничьей только если включен
        if (hasDraw) {
            eventData.coefficients.draw = parseFloat(document.getElementById('coefX').value);
        }

        try {
            await fetchAPI('/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });

            adminForm.reset();
            loadAdminEvents();
            loadEvents();
            alert('Событие добавлено!');
        } catch (error) {
            alert(error.message);
        }
    });

    // Обработчик переключения исхода "ничья"
    document.getElementById('hasDraw')?.addEventListener('change', function () {
        const coefXInput = document.getElementById('coefX');
        coefXInput.disabled = !this.checked;
        coefXInput.required = this.checked;
        if (!this.checked) {
            coefXInput.value = '';
        }
    });

    // Обработка ставок
    betForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('bet-amount').value);
        const betInfo = JSON.parse(betForm.dataset.betInfo);

        try {
            const response = await fetchAPI('/bets', {
                method: 'POST',
                body: JSON.stringify({
                    eventId: betInfo.eventId,
                    amount,
                    type: betInfo.type,
                    coefficient: betInfo.coefficient
                })
            });

            if (response && response.user) {
                // Обновляем баланс на странице
                userBalance.textContent = `Баланс: ${response.user.balance} ₽`;
                betModal.style.display = 'none';
                betForm.reset();
                alert('Ставка принята!');
            } else {
                throw new Error('Неверный формат ответа от сервера');
            }
        } catch (error) {
            alert(error.message);
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

    // Функция загрузки событий
    async function loadEvents(sport = null) {
        try {
            const events = await fetchAPI('/events');
            const filteredEvents = sport ? events.filter(e => e.sport === sport) : events;

            eventsContainer.innerHTML = filteredEvents
                .filter(event => event.status === 'active')
                .map(event => createEventCard(event))
                .join('');

            // Добавляем обработчики для кнопок коэффициентов
            document.querySelectorAll('.coefficient-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        alert('Пожалуйста, войдите в систему');
                        loginModal.style.display = 'block';
                        return;
                    }
                    const betInfo = {
                        eventId: parseInt(btn.dataset.eventId),
                        type: btn.dataset.type,
                        coefficient: parseFloat(btn.dataset.coefficient)
                    };
                    openBetModal(betInfo);
                });
            });
        } catch (error) {
            console.error('Load events error:', error);
            alert('Ошибка при загрузке событий');
        }
    }

    // Функция создания карточки события
    function createEventCard(event) {
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

        const date = new Date(event.datetime);
        const formattedDate = date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="event-card">
                <div class="event-header">
                    <div class="event-sport">
                        <span class="icon">${sportIcons[event.sport]}</span>
                        ${event.name}
                    </div>
                    <div class="event-date">${formattedDate}</div>
                </div>
                <div class="event-teams">
                    ${event.team1} vs ${event.team2}
                </div>
                <div class="event-coefficients">
                    <button class="coefficient-btn" data-event-id="${event.id}" data-type="win1" data-coefficient="${event.coefficients.win1}">
                        <span class="coefficient-label">П1</span>
                        <span class="coefficient-value">${event.coefficients.win1}</span>
                    </button>
                    ${event.coefficients.draw ? `
                        <button class="coefficient-btn" data-event-id="${event.id}" data-type="draw" data-coefficient="${event.coefficients.draw}">
                            <span class="coefficient-label">X</span>
                            <span class="coefficient-value">${event.coefficients.draw}</span>
                        </button>
                    ` : ''}
                    <button class="coefficient-btn" data-event-id="${event.id}" data-type="win2" data-coefficient="${event.coefficients.win2}">
                        <span class="coefficient-label">П2</span>
                        <span class="coefficient-value">${event.coefficients.win2}</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Функция загрузки событий в админ-панель
    async function loadAdminEvents() {
        try {
            const events = await fetchAPI('/events');
            adminEventsContainer.innerHTML = `
                <div class="admin-events-header">
                    <h3>Текущие события</h3>
                    <button id="clear-events-btn" class="danger-btn">Очистить все события</button>
                </div>
                ${events.map(event => `
                    <div class="admin-event-item">
                        <div class="admin-event-info">
                            ${event.name} - ${event.team1} vs ${event.team2}
                        </div>
                        <div class="admin-event-actions">
                            <button onclick="completeEvent(${event.id}, 'win1')">П1</button>
                            <button onclick="completeEvent(${event.id}, 'draw')">X</button>
                            <button onclick="completeEvent(${event.id}, 'win2')">П2</button>
                            <button onclick="cancelEvent(${event.id})">Отмена</button>
                        </div>
                    </div>
                `).join('')}
            `;

            // Добавляем обработчик для кнопки очистки
            const clearEventsBtn = document.getElementById('clear-events-btn');
            if (clearEventsBtn) {
                clearEventsBtn.addEventListener('click', async () => {
                    if (confirm('Вы уверены, что хотите удалить все события? Это действие нельзя отменить.')) {
                        try {
                            await fetchAPI('/events/clear', {
                                method: 'DELETE'
                            });
                            loadAdminEvents();
                            loadEvents();
                            alert('Все события успешно удалены');
                        } catch (error) {
                            alert(error.message);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Load admin events error:', error);
            alert('Ошибка при загрузке событий');
        }
    }

    // Функция открытия модального окна для ставки
    async function openBetModal(betInfo) {
        try {
            const events = await fetchAPI('/events');
            const event = events.find(e => e.id === betInfo.eventId);

            if (!event) {
                alert('Событие не найдено');
                return;
            }

            document.getElementById('bet-info').innerHTML = `
                <p><strong>${event.team1} vs ${event.team2}</strong></p>
                <p>Тип ставки: ${betInfo.type === 'win1' ? 'П1' : betInfo.type === 'draw' ? 'X' : 'П2'}</p>
                <p>Коэффициент: ${betInfo.coefficient}</p>
            `;

            betForm.dataset.betInfo = JSON.stringify(betInfo);
            betModal.style.display = 'block';
        } catch (error) {
            alert('Ошибка при получении информации о событии');
            console.error(error);
        }
    }

    // Функция завершения события
    window.completeEvent = async function (eventId, result) {
        try {
            await fetchAPI(`/events/${eventId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed', result })
            });

            // Обновляем баланс пользователя
            const userData = await fetchAPI('/user');
            userBalance.textContent = `Баланс: ${userData.balance} ₽`;

            loadAdminEvents();
            loadEvents();
            alert('Событие рассчитано!');
        } catch (error) {
            alert(error.message);
        }
    };

    // Функция отмены события
    window.cancelEvent = async function (eventId) {
        try {
            await fetchAPI(`/events/${eventId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'cancelled' })
            });

            // Обновляем баланс пользователя
            const userData = await fetchAPI('/user');
            userBalance.textContent = `Баланс: ${userData.balance} ₽`;

            loadAdminEvents();
            loadEvents();
            alert('Событие отменено!');
        } catch (error) {
            alert(error.message);
        }
    };

    // Обработчики фильтрации по видам спорта
    document.querySelectorAll('.sports-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sport = e.currentTarget.dataset.sport;
            loadEvents(sport);
        });
    });

    // Обработчик клика по ссылке "История пари"
    document.querySelector('a[href="#history"]').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const bets = await fetchAPI('/bets/history');
            displayBetsHistory(bets);
            betsHistoryModal.style.display = 'block';
        } catch (error) {
            alert('Ошибка при загрузке истории ставок');
        }
    });

    // Функция отображения истории ставок
    function displayBetsHistory(bets) {
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

        betsHistoryContainer.innerHTML = bets.map(bet => {
            const date = new Date(bet.datetime);
            const formattedDate = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusText = {
                active: 'Активная',
                win: 'Выигрыш',
                lose: 'Проигрыш',
                cancelled: 'Отменена'
            };

            const statusClass = {
                active: 'active',
                win: 'win',
                lose: 'lose',
                cancelled: 'cancelled'
            };

            return `
                <div class="bet-history-item ${statusClass[bet.status]}">
                    <div class="bet-history-header">
                        <span>${formattedDate}</span>
                        <span class="bet-history-status ${statusClass[bet.status]}">${statusText[bet.status]}</span>
                    </div>
                    <div class="bet-history-event">
                        ${sportIcons[bet.event?.sport] || ''} ${bet.event?.name || 'Событие удалено'}
                    </div>
                    <div class="bet-history-teams">
                        ${bet.event?.team1 || 'Команда 1'} vs ${bet.event?.team2 || 'Команда 2'}
                    </div>
                    <div class="bet-history-details">
                        <div>
                            <span>Ставка: ${bet.type === 'win1' ? 'П1' : bet.type === 'draw' ? 'X' : 'П2'}</span>
                            <span class="bet-history-amount">${bet.amount} ₽</span>
                        </div>
                        ${bet.status === 'win' ? `<span class="bet-history-amount">+${bet.potential_win} ₽</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Добавляем обработчик для кнопки закрытия истории ставок
    betsHistoryClose.addEventListener('click', () => {
        betsHistoryModal.style.display = 'none';
    });

    // Инициализация: загружаем все события
    loadEvents();
});