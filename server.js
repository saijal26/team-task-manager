const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(cors());


app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Database
const db = new Database("database.db");



db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
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


app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare("INSERT INTO users(username, password) VALUES (?, ?)")
      .run(username, hashedPassword);

    res.json({ message: "User created" });

  } catch (err) {
    res.status(500).json({ error: "User already exists or error occurred" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, user });
});



// CREATE PROJECT
app.post("/projects", (req, res) => {
  const { name } = req.body;

  const result = db
    .prepare("INSERT INTO projects(name) VALUES (?)")
    .run(name);

  res.json({ id: result.lastInsertRowid });
});

// GET PROJECTS
app.get("/projects", (req, res) => {
  const rows = db.prepare("SELECT * FROM projects").all();
  res.json(rows);
});


app.delete("/projects/:id", (req, res) => {
  const id = req.params.id;

  db.prepare("DELETE FROM tasks WHERE project_id = ?").run(id);
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  res.json({ message: "Project and related tasks deleted" });
});



// CREATE TASK
app.post("/tasks", (req, res) => {
  const { title, project_id } = req.body;

  const result = db
    .prepare(
      "INSERT INTO tasks(title, status, project_id) VALUES (?, 'pending', ?)"
    )
    .run(title, project_id);

  res.json({ id: result.lastInsertRowid });
});

// GET TASKS
app.get("/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks").all();
  res.json(rows);
});


app.put("/tasks/:id", (req, res) => {
  const { status } = req.body;

  db.prepare("UPDATE tasks SET status = ? WHERE id = ?")
    .run(status, req.params.id);

  res.json({ message: "Task updated" });
});

// DELETE TASK
app.delete("/tasks/:id", (req, res) => {
  db.prepare("DELETE FROM tasks WHERE id = ?")
    .run(req.params.id);

  res.json({ message: "Task deleted" });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});