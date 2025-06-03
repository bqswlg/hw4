var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 1. 直接在 app.js 使用 sqlite3 開啟資料庫
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功開啟資料庫 (app.js)');
  }
});

// 2. /api/value 路由，查詢所有農藥的歷年價格
app.get('/api/value', (req, res) => {
  const sql = `
    SELECT p.PesticideID, p.PesticideName, pr.Year, pr.Price, pr.Currency
    FROM Pesticides p
    JOIN PesticidePrices pr ON p.PesticideID = pr.PesticideID
    ORDER BY p.PesticideID, pr.Year DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 3. /api/one 路由，查詢指定 PesticideID 的所有資料
app.get('/api/one', (req, res) => {
  const { PesticideID } = req.query;
  if (!PesticideID) {
    return res.status(400).json({ error: '缺少 PesticideID 參數' });
  }
  const sql = `
    SELECT p.PesticideID, p.PesticideName, pr.Year, pr.Price, pr.Currency
    FROM Pesticides p
    JOIN PesticidePrices pr ON p.PesticideID = pr.PesticideID
    WHERE p.PesticideID = ?
    ORDER BY pr.Year DESC
  `;
  db.all(sql, [PesticideID], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 4. /api/year 路由，查詢指定 Year 的所有農藥資料
app.get('/api/year', (req, res) => {
  const { Year } = req.query;
  if (!Year) {
    return res.status(400).json({ error: '缺少 Year 參數' });
  }
  const sql = `
    SELECT p.PesticideID, p.PesticideName, pr.Year, pr.Price, pr.Currency
    FROM Pesticides p
    JOIN PesticidePrices pr ON p.PesticideID = pr.PesticideID
    WHERE pr.Year = ?
    ORDER BY p.PesticideID
  `;
  db.all(sql, [Year], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = app;
