require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "online_pharmacy",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

const resources = {
  users: {
    table: "users",
    id: "user_id",
    columns: ["name", "email", "password", "phone", "role"],
    required: ["name", "email", "password"]
  },
  medicines: {
    table: "medicines",
    id: "medicine_id",
    columns: ["medicine_name", "category", "manufacturer", "price", "stock", "expiry_date"],
    required: ["medicine_name", "price", "stock"]
  },
  orders: {
    table: "orders",
    id: "order_id",
    columns: ["user_id", "order_date", "total_amount", "status"],
    required: ["user_id", "order_date", "total_amount"]
  },
  "order-items": {
    table: "order_items",
    id: "item_id",
    columns: ["order_id", "medicine_id", "quantity", "price"],
    required: ["order_id", "medicine_id", "quantity", "price"]
  }
};

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "Server and database connected." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed.", error: error.message });
  }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[medicines]] = await pool.query("SELECT COUNT(*) AS total FROM medicines");
    const [[orders]] = await pool.query("SELECT COUNT(*) AS total FROM orders");
    const [[items]] = await pool.query("SELECT COUNT(*) AS total FROM order_items");
    res.json({ success: true, users: users.total, medicines: medicines.total, orders: orders.total, items: items.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/:resource", async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: "Unknown resource." });

  try {
    let sql = `SELECT * FROM \`${config.table}\` ORDER BY \`${config.id}\` DESC`;
    if (req.params.resource === "orders") {
      sql = `SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id = u.user_id ORDER BY o.order_id DESC`;
    }
    if (req.params.resource === "order-items") {
      sql = `SELECT oi.*, m.medicine_name FROM order_items oi JOIN medicines m ON oi.medicine_id = m.medicine_id ORDER BY oi.item_id DESC`;
    }
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/:resource", async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: "Unknown resource." });

  try {
    const data = {};
    for (const column of config.columns) {
      if (req.body[column] !== undefined) data[column] = req.body[column];
    }
    for (const column of config.required) {
      if (data[column] === undefined || data[column] === "") {
        return res.status(400).json({ message: `${column} is required.` });
      }
    }
    if (req.params.resource === "users") {
      data.password = await bcrypt.hash(String(data.password), 10);
    }
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => data[column]);
    const sql = `INSERT INTO \`${config.table}\` (${columns.map(c => `\`${c}\``).join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    res.status(201).json({ success: true, id: result.insertId, message: "Record added successfully." });
  } catch (error) {
    res.status(400).json({ message: friendlyError(error) });
  }
});

app.put("/api/:resource/:id", async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: "Unknown resource." });

  try {
    const data = {};
    for (const column of config.columns) {
      if (req.body[column] !== undefined && !(column === "password" && req.body[column] === "")) {
        data[column] = req.body[column];
      }
    }
    if (req.params.resource === "users" && data.password) {
      data.password = await bcrypt.hash(String(data.password), 10);
    }
    const columns = Object.keys(data);
    if (!columns.length) return res.status(400).json({ message: "No changes were provided." });

    const setClause = columns.map(column => `\`${column}\` = ?`).join(", ");
    const values = columns.map(column => data[column]);
    values.push(req.params.id);
    const [result] = await pool.execute(
      `UPDATE \`${config.table}\` SET ${setClause} WHERE \`${config.id}\` = ?`,
      values
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Record not found." });
    res.json({ success: true, message: "Record updated successfully." });
  } catch (error) {
    res.status(400).json({ message: friendlyError(error) });
  }
});

app.delete("/api/:resource/:id", async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: "Unknown resource." });

  try {
    const [result] = await pool.execute(
      `DELETE FROM \`${config.table}\` WHERE \`${config.id}\` = ?`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Record not found." });
    res.json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: friendlyError(error) });
  }
});

function friendlyError(error) {
  if (error.code === "ER_DUP_ENTRY") return "This email already exists. Please use another email.";
  if (error.code === "ER_NO_REFERENCED_ROW_2") return "The selected user, order, or medicine ID does not exist. Check the related table first.";
  if (error.code === "ER_ROW_IS_REFERENCED_2") return "This record is used by another table and cannot be deleted yet.";
  return error.message;
}

app.listen(PORT, () => {
  console.log(`Online Pharmacy Management System running at http://localhost:${PORT}`);
});
