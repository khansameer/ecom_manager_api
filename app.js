import express from "express";
import dotenv from "dotenv";
import connection from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Node.js API connected with Railway MySQL!");
});

// Example route to fetch data
app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
