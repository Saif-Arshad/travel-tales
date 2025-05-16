const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(cors());
const DB_NAME = 'TravelTales.db';
const db = new sqlite3.Database(DB_NAME);

function initDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        profile_picture TEXT,
        banner_picture TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        followerId INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(userId, followerId)
      )
    `);
    

    db.run(`
      CREATE TABLE IF NOT EXISTS followings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        followingId INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(userId, followingId)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        country_name TEXT NOT NULL,
        main_image TEXT,
        visit_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS blog_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        blog_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
        UNIQUE(user_id, blog_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS blog_dislikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        blog_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
        UNIQUE(user_id, blog_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.all("PRAGMA table_info(blogs)", (err, rows) => {
      if (err) {
        console.error("Error checking table info:", err);
        return;
      }
      
      const hasDescription = rows && Array.isArray(rows) && rows.some(row => row.name === 'description');
      console.log("Table columns:", rows);
      
      if (!hasDescription) {
        console.log("Adding description column...");
        db.run(`ALTER TABLE blogs ADD COLUMN description TEXT`, (err) => {
          if (err) {
            console.error("Error adding description column:", err);
          } else {
            console.log("Added description column to blogs table");
          }
        });
      } else {
        console.log("Description column already exists");
      }
    });

    console.log("Database initialized!");
  });
}

function arrayToString(arr) {
  return Array.isArray(arr) ? arr.join(',') : '';
}

function stringToArray(str) {
  return str ? str.split(',').filter(Boolean) : [];
}

initDB();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/blogs', blogRoutes);
app.use('/comments', commentRoutes);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
