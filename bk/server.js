// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true
}));

// Middleware
app.use(bodyParser.json());

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const betRoutes = require('./routes/bets');
const eventRoutes = require('./routes/events');

// API маршруты
app.use('/api', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/events', eventRoutes);

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Обработка всех остальных маршрутов для SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

