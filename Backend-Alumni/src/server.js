const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const { errorHandler } = require("./middleware/errorMiddleware");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const sequelize = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const graduateRoutes = require("./routes/graduates.route");
app.use("/alumni-portal/graduates", graduateRoutes);

const postRoutes = require("./routes/post.route");
app.use("/alumni-portal/posts", postRoutes);

const staffRoutes = require("./routes/staff.route");
app.use("/alumni-portal/staff", staffRoutes);

const authRoutes = require("./routes/auth.route");
app.use("/alumni-portal", authRoutes);

const groupRoutes = require("./routes/group.route");
app.use("/alumni-portal", groupRoutes);

app.use(errorHandler);

// sync DB
sequelize.sync().then(async () => {
  console.log("Database synced");

  const existingAdmin = await User.findByPk(1);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      id: 1,
      // <<<<<<< HEAD
      email: "alumniportalhelwan@gmail.com",
      "hashed-password": hashedPassword,
      "user-type": "admin",
      "first-name": "Alumni Portal -",
      "last-name": " Helwan university",
      // =======
      //       email: 'alumniportalhelwan@gmail.com',
      //       'hashed-password': hashedPassword,
      //       'user-type': 'admin',
      //       'first-name': 'Alumni Portal -',
      //       'last-name': ' Helwan University',
      // >>>>>>> 87aa552bd646488b539d7ebdda30e6fd16f6a966
    });

    console.log(
      "Default Admin created: email=alumniportalhelwan@gmail.com, password=admin123"
    );

    // ضبط الـ sequence بحيث أي User جديد يبدأ من ID = 2
    await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
    console.log("User sequence reset to start from 2");
  }
});

// listen
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
