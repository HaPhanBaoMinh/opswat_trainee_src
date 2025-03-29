require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const methodOverride = require("method-override");

const app = express();
const port = process.env.PORT || 3000;

// App version
const APP_VERSION = "1.0.0";

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Create table if it does not exist
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'todos' is ready");
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
  }
})();

// Set view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", version: APP_VERSION });
});

// Routes
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY created_at DESC");
    res.render("index", { todos: result.rows, version: APP_VERSION });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/todos", async (req, res) => {
  try {
    const { task } = req.body;
    await pool.query("INSERT INTO todos (task) VALUES ($1)", [task]);
    res.redirect("/");
  } catch (err) {
    console.error(err.message);
    res.redirect("/");
  }
});

app.get("/todos/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM todos WHERE id = $1", [id]);

    if (!result.rows[0]) return res.redirect("/");
    
    res.render("edit", { todo: result.rows[0], version: APP_VERSION })
  } catch (err) {
    console.error(err.message);
    res.redirect("/");
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { task, status } = req.body;
    await pool.query("UPDATE todos SET task = $1, status = $2 WHERE id = $3", [
      task,
      status === "on",
      id,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error(err.message);
    res.redirect("/");
  }
});

app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.error(err.message);
    res.redirect("/");
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📌 App version: ${APP_VERSION}`);
});

