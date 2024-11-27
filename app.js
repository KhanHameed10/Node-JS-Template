const express = require('express');
const userRoutes = require('./routes/userRoutes');
const rateLimiter = require("./middleware/RateLimiter");
const app = express();
const PORT = 3000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.get('/', function(req, res){
  res.send("hello this is our node app");
});
app.use('/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
