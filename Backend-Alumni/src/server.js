const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const path = require("path");
const bcrypt = require("bcryptjs");
const { errorHandler } = require("./middleware/errorMiddleware");
const Permission = require("./models/Permission");
const User = require("./models/User");
const sequelize = require("./config/db");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
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

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Error Handler
app.use(errorHandler);

// ==================================================
// ✅ Clear old permissions and seed new ones
// ==================================================
const ensurePermissionsSeeded = async () => {
  const permissions = [
    "Graduates Management",
    "Staff Management",
    "Communities Management",
    "Posts Management",
    "Reports",
    "Document's Requests Management",
    "Consultation Management",
    "FAQs Management",
  ];

  try {
    console.log("🧹 Deleting old permissions...");

    // ✅ حذف كل القديم مع cascade وإعادة العدّاد يبدأ من 1
    await Permission.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });

    console.log("🪄 Seeding new permissions...");

    for (const permName of permissions) {
      let canView = false;
      let canEdit = false;
      let canDelete = false;

      // ⚙️ قاعدة خاصة بـ Reports
      if (permName === "Reports") {
        canView = false; // ممكن تتغير لاحقًا
        canEdit = false; // ثابت
        canDelete = false; // ثابت
      }

      await Permission.create({
        name: permName,
        "can-view": canView,
        "can-edit": canEdit,
        "can-delete": canDelete,
      });

      console.log(`✅ Added permission: ${permName}`);
    }

    console.log(
      "✅ All new permissions inserted successfully (IDs start from 1)."
    );
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
  }
};

// ==================================================
// ✅ Sync Database and Seed Default Admin + Permissions
// ==================================================
sequelize.sync().then(async () => {
  console.log("Database synced successfully.");

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
      "✅ Default Admin created: email=alumniportalhelwan@gmail.com, password=admin123"
    );

    await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
    console.log("User sequence reset to start from ID=2");
  }

  await ensurePermissionsSeeded();
});

// ==================================================
// ✅ Start Server
// ==================================================
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
