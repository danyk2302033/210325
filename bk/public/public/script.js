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
                body: options.body ? JSON.stringify(JSON.parse(options.body)) : undefined
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка сервера');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ... rest of the code ...
}); 