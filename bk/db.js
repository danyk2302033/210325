// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '127.0.0.1', 
  user: 'root',
  password: '31545',
  database: 'BK'
});

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных: ' + err.stack);
    return;
  }
  console.log('Подключено к базе данных как id ' + connection.threadId);
});

module.exports = connection;

const fs = require('fs').promises;

// Функция для вставки пользователей в базу данных
const insertUsers = async (users) => {
  const query = 'INSERT INTO users (username, password, balance, isAdmin) VALUES (?, ?, ?, ?)';
  const checkUserQuery = 'SELECT id FROM users WHERE username = ?';

  for (const user of users) {
    // Проверка существования пользователя
    const [existingUser ] = await connection.promise().query(checkUserQuery, [user.username]);
    
    if (existingUser .length > 0) {
      console.log(`Пользователь ${user.username} уже существует с ID: ${existingUser [0].id}`);
      continue; // Пропустить, если пользователь уже существует
    }

    // Вставка нового пользователя
    connection.query(query, [user.username, user.password, user.balance, user.isAdmin], (err, results) => {
      if (err) {
        console.error('Ошибка при добавлении пользователя: ' + err.stack);
        return;
      }
      console.log('Пользователь добавлен с ID: ' + results.insertId);
    });
  }
};

// Функция для вставки ставок в базу данных
const insertBets = async (bets) => {
  const query = 'INSERT INTO bets (id, userId, eventId, amount, type, coefficient, potential_win, status, datetime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const checkBetQuery = 'SELECT id FROM bets WHERE id = ?';
  
  for (const bet of bets) {
    // Преобразование даты
    const datetime = new Date(bet.datetime).toISOString().slice(0, 19).replace('T', ' ');

    // Получение userId из username
    const userIdQuery = 'SELECT id FROM users WHERE username = ?';
    const [userIdResults] = await connection.promise().query(userIdQuery, [bet.userId]);

    if (userIdResults.length === 0) {
      console.error(`Пользователь с username ${bet.userId} не найден.`);
      continue; // Пропустить эту ставку, если пользователь не найден
    }

    const userId = userIdResults[0].id; // Получаем id пользователя

    // Проверка существования ставки
    const [existingBet] = await connection.promise().query(checkBetQuery, [bet.id]);
    
    if (existingBet.length > 0) {
      console.log(`Ставка с ID ${bet.id} уже существует.`);
      continue; // Пропустить, если ставка уже существует
    }

    // Вставка ставки
    connection.query(query, [bet.id, userId, bet.eventId, bet.amount, bet.type, bet.coefficient, bet.potential_win, bet.status, datetime], (err, results) => {
      if (err) {
        console.error('Ошибка при добавлении ставки: ' + err.stack);
        return;
      }
      console.log('Ставка добавлена с ID: ' + results.insertId);
    });
  }
};

// Чтение файлов users.json и bets.json параллельно
Promise.all([
  fs.readFile('users.json', 'utf8'),
  fs.readFile('bets.json', 'utf8')
])
.then(async ([usersData, betsData]) => {
  // Парсинг данных из JSON
  const users = JSON.parse(usersData);
  const bets = JSON.parse(betsData);

  // Вызов функций для вставки пользователей и ставок
  await insertUsers(users);
  await insertBets(bets);
})
.catch(err => {
  console.error('Ошибка при чтении файла: ' + err);
});