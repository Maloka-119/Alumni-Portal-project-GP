const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
require("dotenv").config();
const path = require("path");
const bcrypt = require("bcryptjs");
const { errorHandler } = require("./middleware/errorMiddleware");
const User = require("./models/User");
const Staff = require("./models/Staff");
const Role = require("./models/Role");
const Permission = require("./models/Permission");
const RolePermission = require("./models/RolePermission");
const StaffRole = require("./models/StaffRole");
const sequelize = require("./config/db");
require("./models/associations");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // Allow cookies to be sent
  })
);
app.use(helmet());
app.use(morgan("dev"));

// Session configuration for LinkedIn OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// WebSocket setup
const http = require("http");
const server = http.createServer(app);
const ChatSocketServer = require("./socket/chatSocket");
const chatSocket = new ChatSocketServer(server);

// Make chatSocket accessible globally for controllers
global.chatSocket = chatSocket;

//  Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
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

const friendshipRoutes = require("./routes/friendship.route");
app.use("/alumni-portal/friendships", friendshipRoutes);

const invitationRoutes = require("./routes/invitation.route");
app.use("/alumni-portal/invitations", invitationRoutes);

const faqRoutes = require("./routes/faq.route");
app.use("/alumni-portal/faqs", faqRoutes);

const adminFaqRoutes = require("./routes/admin-faq.route");
app.use("/alumni-portal/admin/faqs", adminFaqRoutes);

const chatRoutes = require("./routes/chat.route");
app.use("/alumni-portal/chat", chatRoutes);

const reportsRoutes = require("./routes/reports.route");
app.use("/alumni-portal", reportsRoutes);

const linkedinAuthRoutes = require("./routes/linkedinAuth.route");
app.use("/alumni-portal/auth/linkedin", linkedinAuthRoutes);

const notificationRoutes = require("./routes/notification.route");
app.use("/alumni-portal/notifications", notificationRoutes);

const feedbackRoutes = require("./routes/feedback.route.js");
app.use("/alumni-portal/feedbacks", feedbackRoutes);

const facultiesRoute = require("./routes/faculties.route.js");
app.use("/alumni-portal/faculties", facultiesRoute);

//  Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Error Handler
app.use(errorHandler);

// ==================================================
// ==================================================
//  Reset and seed NEW permissions (Updated List)
// ==================================================
const ensurePermissionsSeeded = async () => {
  const newPermissions = [
    "Graduate management",
    "Others Requests management",
    "Staff management",
    "Communities management",
    "Community Post's management",
    "Community Members management",
    "Portal posts management",
    "Graduates posts management",
    "Portal Reports",
    "Document Requests management",
    "Consultation management",
    "FAQ management",
    "Graduates Feedback",
    "Roles and Permissions Management",
  ];

  try {
    // 🧠 1. احسب عدد الموجود في الداتابيز
    const existingPermissions = await Permission.findAll();
    const existingNames = existingPermissions.map((p) => p.name);

    // 🔍 2. شيّك إذا كان كل الأسماء الجديدة موجودة فعلاً
    const missingPermissions = newPermissions.filter(
      (name) => !existingNames.includes(name)
    );

    // ✅ 3. لو كلهم موجودين → متعملش أي حاجة
    if (existingPermissions.length > 0 && missingPermissions.length === 0) {
      console.log("✅ All permissions already exist. Skipping seeding...");
      return;
    }

    // ⚠️ 4. لو الجدول فاضي أو فيه نقص → امسح القديم واعمل Reset
    console.log("🧹 Resetting and reseeding permissions...");
    await Permission.destroy({ where: {} });
    await sequelize.query('ALTER SEQUENCE "Permission_id_seq" RESTART WITH 1;');

    // 🆕 5. أضف القائمة الجديدة
    for (const permName of newPermissions) {
      await Permission.create({
        name: permName,
        "can-view": false,
        "can-edit": false,
        "can-delete": false,
        "can-add": false, // ✅ العمود الجديد
      });

      console.log(`✅ Added permission: ${permName}`);
    }

    console.log("🎯 Permissions reset and seeded successfully!");
  } catch (error) {
    console.error("❌ Error during permission seeding:", error);
  }
};

// ==================================================
// ✅ Sync Database and Seed Default Admin + Permissions
// ==================================================
sequelize
  .sync({ alter: false }) // Changed to false to prevent auto-alter conflicts
  .then(async () => {
    console.log("Database synced successfully.");

    // Ensure Notification table has correct structure
    const Notification = require("./models/Notification");
    try {
      // Check if table exists and has correct structure
      const tableDescription = await sequelize
        .getQueryInterface()
        .describeTable("Notification");

      // If table exists but missing new columns, add them
      if (
        !tableDescription["receiver-id"] ||
        !tableDescription["sender-id"] ||
        !tableDescription["type"] ||
        !tableDescription["message"]
      ) {
        console.log(
          "⚠️  Notification table structure needs update. Please run the migration or SQL script."
        );
      } else {
        console.log("✅ Notification table structure is correct.");
      }
    } catch (error) {
      // Table doesn't exist, create it
      console.log("📝 Creating Notification table...");
      await Notification.sync({ force: false, alter: true });
      console.log("✅ Notification table created successfully.");
    }

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

      await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
      console.log("User sequence reset to start from ID=2");
    }

    await ensurePermissionsSeeded();
  })
  .catch(async (err) => {
    // Handle ENUM creation errors gracefully
    if (
      err.name === "SequelizeUniqueConstraintError" &&
      ((err.message && err.message.includes("enum_User_auth_provider")) ||
        (err.fields && err.fields.typname === "enum_User_auth_provider"))
    ) {
      console.log("⚠️  ENUM type already exists, continuing with seeding...");

      // Continue with admin creation and permissions seeding
      try {
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
          await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
          console.log("User sequence reset to start from ID=2");
        }
        await ensurePermissionsSeeded();
      } catch (seedErr) {
        console.error("❌ Error during seeding:", seedErr);
      }
    } else {
      console.error("❌ Error syncing database:", err);
      process.exit(1);
    }
  });

// ==================================================
// ✅ Start Server
// ==================================================
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
