const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Импортируем базу данных

const betsFilePath = path.join(__dirname, '../bets.json');
const eventsFilePath = path.join(__dirname, '../events.json');

// Middleware для проверки авторизации
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Недействительный токен' });
    }
};

// Создание ставки
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('Received bet request:', req.body);
        console.log('User  from token:', req.user);

        const { eventId, amount, type, coefficient } = req.body;
        const { userId } = req.user;

        // Проверяем существование события
        const events = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));
        const event = events.find(e => e.id === eventId);
        if (!event || event.status !== 'active') {
            return res.status(400).json({ message: 'Событие недоступно для ставок' });
        }

        // Проверяем баланс пользователя в базе данных
        const userQuery = 'SELECT * FROM users WHERE username = ?';
        const [userResults] = await db.promise().query(userQuery, [userId]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = userResults[0];
        const currentBalance = user.balance;

        if (currentBalance < amount) {
            return res.status(400).json({ message: 'Недостаточно средств' });
        }

        // Создаем ставку
        const newBet = {
            userId: user.id, // Используем id пользователя из базы данных
            eventId,
            amount,
            type,
            coefficient,
            potential_win: amount * coefficient,
            status: 'active',
            datetime: new Date().toISOString().slice(0, 19).replace('T', ' ') // Преобразуем дату
        };

        // Вставка ставки в базу данных
        const betQuery = 'INSERT INTO bets (userId, eventId, amount, type, coefficient, potential_win, status, datetime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await db.promise().query(betQuery, [newBet.userId, newBet.eventId, newBet.amount, newBet.type, newBet.coefficient, newBet.potential_win, newBet.status, newBet.datetime]);

        // Обновляем баланс пользователя в базе данных
        const updateBalanceQuery = 'UPDATE users SET balance = ? WHERE id = ?';
        await db.promise().query(updateBalanceQuery, [currentBalance - amount, user.id]);

        // Сохраняем ставку в bets.json
        const bets = JSON.parse(fs.readFileSync(betsFilePath, 'utf8') || '[]');
        bets.push(newBet);
        fs.writeFileSync(betsFilePath, JSON.stringify(bets, null, 2));

        console.log('Bet created:', newBet);
        console.log('User  balance updated:', currentBalance - amount);

        res.status(201).json({
            bet: newBet,
            user: {
                username: user.username,
                balance: currentBalance - amount,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Bet error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение истории ставок пользователя
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.user;
        const bets = JSON.parse(fs.readFileSync(betsFilePath, 'utf8') || '[]');
        const events = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));

        // Получаем все ставки пользователя
        const userBets = bets.filter(bet => bet.userId === userId);

        // Добавляем информацию о событиях к каждой ставке
        const betsWithEvents = userBets.map(bet => {
            const event = events.find(e => e.id === bet.eventId);
            return {
                ...bet,
                event: event ? {
                    name: event.name,
                    team1: event.team1,
                    team2: event.team2,
                    sport: event.sport
                } : null
            };
        });

        // Сортируем ставки по дате (новые сверху)
        betsWithEvents.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        res.json(betsWithEvents);
    } catch (error) {
        console.error('Get bets history error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;