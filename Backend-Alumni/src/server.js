const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const sequelize = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// // test route
// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

// sync db
sequelize.sync()
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Error syncing database:", err));

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
