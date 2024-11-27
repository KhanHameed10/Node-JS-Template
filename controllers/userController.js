require("dotenv").config();
const bcrypt = require("bcrypt");
const { query } = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "ExpressIntegration",
});
connection.connect((err) => {
  if (err) {
    console.log("hree");
    console.error("Error connecting to the database:", err);
    throw err;
  }
});
const insertUser = async (req, res) => {
  try {
    const { name, email, password, id } = req.body;
    connection.query("SELECT * FROM users WHERE email = ?",[email],async (error, results) => {
        if (error) {
          throw error;
        }
        if (results.length > 0 && !id) {
          return res.status(400).json({ success: false, message: "Email already exists" });
        }
        let hashedPassword = password;
        if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
        }
        const cond = [name, email];
        let query;
        if (id) {
          if (password) {
            query =
              "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
            cond.push(hashedPassword, id);
          } else {
            query = "UPDATE users SET name = ?, email = ? WHERE id = ?";
            cond.push(id);
          }
        } else {
          query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
          cond.push(hashedPassword);
        }
        connection.query(query, cond, (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(400).json({ success: false, message: "Email already exists" });
            }
            throw err;
          }
          res.status(200).json({success: true,message: id? "User updated successfully": "User inserted successfully",
          });
        });
      }
    );
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const FetchUsers = (req, res) => {
  connection.query("SELECT * FROM users", (error, results) => {
    if (error) {
      return res.status(400).json({ error: "Database query error" });
    }
    return res.json(results); // sending the results back
  });
};

const deleteUser = (req, res) => {
  const query = "DELETE FROM users WHERE id = ?";
  connection.query(query, [req.body.id], (error, results) => {
    if (error) {
      return res.status(400).json({ error: "Database query error" });
    }
    if (results.affectedRows === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User successfully deleted" });
  });
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    connection.query(
      "SELECT email, password FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          throw error;
        }
        if (!results.length) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid credentials" });
        }
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid password" });
        }
        const token = jwt.sign({ email: user.email }, JWT_SECRET, {
          expiresIn: "1hr",
        });
        res.json({ success: true, message: "Login successful", token });
      }
    );
  } catch (err) {
    console.error("Unexpected error in loginUser:", err);
    res.status(400).json({ success: false, message: "Internal server error" });
  }
};
const validateTokenAndEmail = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No token provided",
      log: "Authorization header is missing or malformed",
    });
  }
  const isBlacklisted = invalidatedTokens[token];
  if (isBlacklisted) {
    return res
      .status(400)
      .json({ success: false, message: "Token is invalidated" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email } = decoded;
    const query = "SELECT email FROM users WHERE email = ?";
    connection.query(query, [email], (error, results) => {
      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Unauthorized",
          log: `No user found for email: ${email}`,
        });
      }
      req.user = results[0];
      res.json({
        success: true,
        message: "User Authorized",
        log: { "Decoded Token Email": email, "User Details": req.user },
      });
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired token",
      log: err.message,
    });
  }
};
const invalidatedTokens = {};
const logoutUser = (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiry = decoded.exp * 1000;
    invalidatedTokens[token] = expiry;
    res.status(200).json({
      success: true,
      message: "Logout successful. Token invalidated.",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
};
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of Object.entries(invalidatedTokens)) {
    if (expiry < now) {
      delete invalidatedTokens[token]; // Remove expired tokens
    }
  }
}, 60000);
module.exports = {
  insertUser,
  FetchUsers,
  // updateUser,
  deleteUser,
  loginUser,
  validateTokenAndEmail,
  logoutUser,
};
