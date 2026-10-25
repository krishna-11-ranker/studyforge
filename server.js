

const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve the existing StudyForge frontend
app.use(express.static(path.join(__dirname, "..")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "StudyForge backend is running!"
  });
});

// GET: Fetch all tasks
app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare(`
    SELECT * FROM tasks
    ORDER BY completed ASC, id DESC
  `).all();

  res.json(tasks);
});

// POST: Create a new task
app.post("/api/tasks", (req, res) => {
  const { subject, title, deadline = null, priority = "medium" } = req.body;

  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return res.status(400).json({
      error: "Subject and title are required."
    });
  }

  if (
    !["low", "medium", "high"].includes(priority) ||
    (deadline !== null &&
      (typeof deadline !== "string" || !deadline.trim()))
  ) {
    return res.status(400).json({
      error: "Invalid deadline or priority."
    });
  }

  const result = db.prepare(`
    INSERT INTO tasks (subject, title, deadline, priority)
    VALUES (?, ?, ?, ?)
  `).run(
    subject.trim(),
    title.trim(),
    deadline,
    priority
  );

  const task = db.prepare(
    "SELECT * FROM tasks WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// PATCH: Update a task
app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  const task = db.prepare(
    "SELECT * FROM tasks WHERE id = ?"
  ).get(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  const { subject, title, deadline, priority, completed } = req.body;

  if (
    subject !== undefined &&
    (typeof subject !== "string" || !subject.trim())
  ) {
    return res.status(400).json({ error: "Invalid subject." });
  }

  if (
    title !== undefined &&
    (typeof title !== "string" || !title.trim())
  ) {
    return res.status(400).json({ error: "Invalid title." });
  }

  if (
    priority !== undefined &&
    !["low", "medium", "high"].includes(priority)
  ) {
    return res.status(400).json({ error: "Invalid priority." });
  }

  if (
    deadline !== undefined &&
    deadline !== null &&
    (typeof deadline !== "string" || !deadline.trim())
  ) {
    return res.status(400).json({ error: "Invalid deadline." });
  }

  if (
    completed !== undefined &&
    typeof completed !== "boolean" &&
    completed !== 0 &&
    completed !== 1
  ) {
    return res.status(400).json({ error: "Invalid completed status." });
  }

  db.prepare(`
    UPDATE tasks
    SET subject = ?, title = ?, deadline = ?,
        priority = ?, completed = ?
    WHERE id = ?
  `).run(
    subject === undefined ? task.subject : subject.trim(),
    title === undefined ? task.title : title.trim(),
    deadline === undefined ? task.deadline : deadline,
    priority === undefined ? task.priority : priority,
    completed === undefined ? task.completed : Number(completed),
    id
  );

  const updatedTask = db.prepare(
    "SELECT * FROM tasks WHERE id = ?"
  ).get(id);

  res.json(updatedTask);
});

// DELETE: Remove a task
app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  const result = db.prepare(
    "DELETE FROM tasks WHERE id = ?"
  ).run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found." });
  }

  res.json({
    message: "Task deleted successfully."
  });
});

app.listen(PORT, () => {
  console.log(`StudyForge running at http://localhost:${PORT}`);
});
