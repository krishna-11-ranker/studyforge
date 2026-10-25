
const db = require("./database");

const result = db.prepare(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
).get("tasks");

if (result) {
  console.log("StudyForge database connected!");
  console.log("Tasks table is ready.");
} else {
  console.log("Tasks table not found.");
}

db.close();
