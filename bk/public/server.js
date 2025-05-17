require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/dodepbet', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Схема пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 1000 },
    isAdmin: { type: Boolean, default: false }
});

// Создание модели пользователя
const User = mongoose.model('User', userSchema);

// Регистрация
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверка существования пользователя
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        // Проверка, является ли пользователь первым (админом)
        const isFirstUser = (await User.countDocuments({})) === 0;

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const user = new User({
            username,
            password: hashedPassword,
            isAdmin: isFirstUser
        });

        await user.save();

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                username: user.username,
                balance: user.balance,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Авторизация
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение информации о пользователе
app.get('/api/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
            username: user.username,
            balance: user.balance,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Недействительный токен' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 