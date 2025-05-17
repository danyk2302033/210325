const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const eventsFilePath = path.join(__dirname, '../events.json');
const betsFilePath = path.join(__dirname, '../bets.json');
const usersFilePath = path.join(__dirname, '../users.json');

// Чтение данных из файлов
const readFromFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return [];
    }
};

// Запись данных в файл
const writeToFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw new Error('Ошибка при сохранении данных');
    }
};

// Middleware для проверки админа
const adminMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Нет прав администратора' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Недействительный токен' });
    }
};

// Получение всех событий
router.get('/', async (req, res) => {
    try {
        const events = readFromFile(eventsFilePath);
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание события
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const events = readFromFile(eventsFilePath);
        const newEvent = {
            id: Date.now(),
            ...req.body,
            status: 'active'
        };

        events.push(newEvent);
        writeToFile(eventsFilePath, events);
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление события (завершение или отмена)
router.patch('/:id', adminMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { status, result } = req.body;

        // Получаем данные
        const events = readFromFile(eventsFilePath);
        const bets = readFromFile(betsFilePath);
        const users = readFromFile(usersFilePath);

        // Находим событие
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ message: 'Событие не найдено' });
        }

        // Обновляем статус события
        events[eventIndex].status = status;
        if (result) {
            events[eventIndex].result = result;
        }

        // Если событие завершено, обрабатываем ставки
        if (status === 'completed') {
            console.log(`Расчет ставок для события ${eventId} с результатом ${result}`);
            
            // Находим все активные ставки на это событие
            const eventBets = bets.filter(bet => bet.eventId === eventId && bet.status === 'active');
            
            console.log(`Найдено ${eventBets.length} активных ставок`);

            // Обрабатываем каждую ставку
            eventBets.forEach(bet => {
                // Находим пользователя
                const userIndex = users.findIndex(u => u.username === bet.userId);
                if (userIndex === -1) return;

                // Проверяем, выиграла ли ставка
                if (bet.type === result) {
                    console.log(`Ставка ${bet.id} выиграла. Выплата ${bet.potential_win}`);
                    users[userIndex].balance += bet.potential_win;
                    bet.status = 'win';
                } else {
                    console.log(`Ставка ${bet.id} проиграла`);
                    bet.status = 'lose';
                }
            });

            // Обновляем статусы ставок
            writeToFile(betsFilePath, bets);
            // Обновляем балансы пользователей
            writeToFile(usersFilePath, users);
        } else if (status === 'cancelled') {
            // Если событие отменено, возвращаем деньги за ставки
            console.log(`Возврат ставок для отмененного события ${eventId}`);
            
            const eventBets = bets.filter(bet => bet.eventId === eventId && bet.status === 'active');
            
            eventBets.forEach(bet => {
                const userIndex = users.findIndex(u => u.username === bet.userId);
                if (userIndex === -1) return;

                console.log(`Возврат ${bet.amount} пользователю ${bet.userId}`);
                users[userIndex].balance += bet.amount;
                bet.status = 'cancelled';
            });

            // Обновляем статусы ставок и балансы
            writeToFile(betsFilePath, bets);
            writeToFile(usersFilePath, users);
        }

        // Сохраняем обновленное событие
        writeToFile(eventsFilePath, events);

        res.json(events[eventIndex]);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Очистка всех событий
router.delete('/clear', adminMiddleware, async (req, res) => {
    try {
        writeToFile(eventsFilePath, []);
        res.json({ message: 'Все события успешно удалены' });
    } catch (error) {
        console.error('Error clearing events:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 