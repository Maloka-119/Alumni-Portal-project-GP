const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const { errorHandler } = require("./middleware/errorMiddleware");
const bcrypt = require("bcryptjs");
const Permission = require("./models/Permission");
const User = require("./models/User");
const sequelize = require("./config/db");
const path = require("path"); // ضيفه فوق مع باقي الـ requires

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const userRoutes = require("./routes/user.route");
app.use("/alumni-portal", userRoutes);

const permissionRoutes = require("./routes/permission.route");
app.use("/alumni-portal/permissions", permissionRoutes);

const roleRoutes = require("./routes/role.route");
app.use("/alumni-portal/roles", roleRoutes);

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(errorHandler);

// ✅ Auto-seed default permissions (idempotent)
const ensurePermissionsSeeded = async () => {
  const permissions = [
    {
      name: "manage_users",
      "can-view": true,
      "can-edit": true,
      "can-delete": true,
    },
    {
      name: "manage_posts",
      "can-view": true,
      "can-edit": true,
      "can-delete": true,
    },
    {
      name: "view_reports",
      "can-view": true,
      "can-edit": false,
      "can-delete": false,
    },
    {
      name: "handle_complaints",
      "can-view": true,
      "can-edit": true,
      "can-delete": false,
    },
    {
      name: "approve_graduates",
      "can-view": true,
      "can-edit": true,
      "can-delete": false,
    },
  ];

  for (const p of permissions) {
    await Permission.findOrCreate({
      where: { name: p.name },
      defaults: p,
    });
  }
  console.log("✅ Permissions ensured/seeded (idempotent).");
};

// sync DB
sequelize.sync().then(async () => {
  console.log("Database synced");

  const existingAdmin = await User.findByPk(1);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      id: 1,
      email: "alumniportalhelwan@gmail.com",
      "hashed-password": hashedPassword,
      "user-type": "admin",
      "first-name": "Alumni Portal -",
      "last-name": " Helwan University",
    });

    console.log(
      "Default Admin created: email=alumniportalhelwan@gmail.com, password=admin123"
    );

    // ضبط الـ sequence بحيث أي User جديد يبدأ من ID = 2
    await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
    console.log("User sequence reset to start from 2");
  }

  // ✅ Seed permissions automatically after DB sync
  await ensurePermissionsSeeded();
});

// listen
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
