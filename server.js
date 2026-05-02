const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());


app.use(express.static(path.join(__dirname)));


app.get("/", (req, res) => {
  res.send("Server is running");
});

// Connect DB 
const db = new sqlite3.Database(process.env.DB_PATH || "./database.db");

db.on("error", (err) => {
  console.error("Database error:", err);
});

// Create Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT,
      project_id INTEGER
    )
  `);
});

// Signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users(username, password) VALUES (?, ?)",
    [username, password],
    function (err) {
      if (err) return res.send(err);
      res.json({ message: "User created" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (!user) {
        return res.json({ success: false, message: "Invalid credentials" });
      }

      res.json({ success: true, user });
    }
  );
});

// Create Project
app.post("/projects", (req, res) => {
  const { name } = req.body;

  db.run(
    "INSERT INTO projects(name) VALUES (?)",
    [name],
    function (err) {
      if (err) return res.send(err);
      res.json({ id: this.lastID });
    }
  );
});

// Get Projects
app.get("/projects", (req, res) => {
  db.all("SELECT * FROM projects", [], (err, rows) => {
    if (err) return res.send(err);
    res.json(rows);
  });
});

// Create Task
app.post("/tasks", (req, res) => {
  const { title, project_id } = req.body;

  db.run(
    "INSERT INTO tasks(title, status, project_id) VALUES (?, 'pending', ?)",
    [title, project_id],
    function (err) {
      if (err) return res.send(err);
      res.json({ id: this.lastID });
    }
  );
});

// Get Tasks
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) return res.send(err);
    res.json(rows);
  });
});

// Update Task
app.put("/tasks/:id", (req, res) => {
  const { status } = req.body;

  db.run(
    "UPDATE tasks SET status = ? WHERE id = ?",
    [status, req.params.id],
    function (err) {
      if (err) return res.send(err);
      res.json({ message: "Task updated" });
    }
  );
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});