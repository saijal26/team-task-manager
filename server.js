const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());


app.use(express.static(path.join(__dirname)));


app.get("/", (req, res) => {
  res.send("Server is running");
});


const db = new Database("database.db");

// Create Tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    status TEXT,
    project_id INTEGER
  )
`).run();

// Signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  const stmt = db.prepare(
    "INSERT INTO users(username, password) VALUES (?, ?)"
  );
  stmt.run(username, password);

  res.json({ message: "User created" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ? AND password = ?")
    .get(username, password);

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, user });
});

// Create Project
app.post("/projects", (req, res) => {
  const { name } = req.body;

  const result = db
    .prepare("INSERT INTO projects(name) VALUES (?)")
    .run(name);

  res.json({ id: result.lastInsertRowid });
});

// Get Projects
app.get("/projects", (req, res) => {
  const rows = db.prepare("SELECT * FROM projects").all();
  res.json(rows);
});

// Create Task
app.post("/tasks", (req, res) => {
  const { title, project_id } = req.body;

  const result = db
    .prepare(
      "INSERT INTO tasks(title, status, project_id) VALUES (?, 'pending', ?)"
    )
    .run(title, project_id);

  res.json({ id: result.lastInsertRowid });
});

// Get Tasks
app.get("/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks").all();
  res.json(rows);
});

// Update Task
app.put("/tasks/:id", (req, res) => {
  const { status } = req.body;

  db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(
    status,
    req.params.id
  );

  res.json({ message: "Task updated" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});