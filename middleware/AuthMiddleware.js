const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "ExpressIntegration",
});
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateUser = (req, res, next) => {
  const token = req.headers["authorization"].split(" ")[1]; 
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No token provided",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email } = decoded; 
    const query = "SELECT email FROM users WHERE email = ?";
    connection.query(query, [email], (error, results) => {
      if (results.length === 0) {
        return res.status(400).json({
          success: false,message: "Unauthorized",log: `No user found for email: ${email}`,
        });
      }
      req.user = results[0];
      next(); 
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(400).json({success: false,message: "Invalid or expired token",log: err.message,
    });
  }
};
module.exports = { authenticateUser };
