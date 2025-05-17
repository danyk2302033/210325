const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

const usersFilePath = path.join(__dirname, '../users.json');

// Функция для чтения пользователей из файла
const readUsersFromFile = () => {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
};

// Функция для записи пользователей в файл
const writeUsersToFile = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Эндпоинт для регистрации пользователя
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const checkUserQuery = 'SELECT id FROM users WHERE username = ?';
    const insertUserQuery = 'INSERT INTO users (username, password, balance, isAdmin) VALUES (?, ?, ?, ?)';

    try {
        // Проверка существования пользователя в базе данных
        const [existingUser ] = await db.promise().query(checkUserQuery, [username]);
        if (existingUser .length > 0) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        const isFirstUser  = (await db.promise().query('SELECT COUNT(*) as count FROM users'))[0][0].count === 0;

        // Вставка нового пользователя в базу данных
        await db.promise().query(insertUserQuery, [username, hashedPassword, 1000, isFirstUser ]);

        // Запись нового пользователя в файл
        const users = readUsersFromFile();
        const newUser  = {
            username,
            password: hashedPassword,
            balance: 1000,
            isAdmin: isFirstUser 
        };
        users.push(newUser );
        writeUsersToFile(users);

        // Создание JWT токена
        const token = jwt.sign(
            { userId: username, isAdmin: isFirstUser  },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                username,
                balance: 1000,
                isAdmin: isFirstUser 
            }
        });
    } catch (err) {
        console.error('Ошибка при регистрации пользователя: ', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Эндпоинт для входа пользователя
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';

    try {
        const [users] = await db.promise().query(query, [username]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const token = jwt.sign(
                { userId: username, isAdmin: user.isAdmin },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    username: user.username,
                    balance: user.balance,
                    isAdmin: user.isAdmin
                }
            });
        } else {
            res.status(401).json({ message: 'Неверный логин или пароль' });
        }
    } catch (err) {
        console.error('Ошибка при входе пользователя: ', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Эндпоинт для получения информации о пользователе
router.get('/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        const query = 'SELECT * FROM users WHERE username = ?';
        const [users] = await db.promise().query(query, [decoded.userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
            username: user.username,
            balance: user.balance,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        res.status(401).json({ message: 'Недействительный токен' });
    }
});

module.exports = router;