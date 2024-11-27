const express = require("express");
const {
  validateTokenAndEmail,
  FetchUsers,
  insertUser,
  loginUser,
  deleteUser,
  logoutUser,
} = require("../controllers/userController"); 
const { authenticateUser } = require("../middleware/AuthMiddleware");
const router = express.Router();
router.get("/", FetchUsers);
router.post("/insertUser", insertUser); 
router.post("/loginUser", loginUser); 
router.get("/deleteUser",authenticateUser,  deleteUser); 
router.get("/ValidateToken", validateTokenAndEmail,authenticateUser,  FetchUsers); 
router.post("/logoutUser", authenticateUser, logoutUser); 
module.exports = router;
