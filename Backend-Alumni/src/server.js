const express = require("express");
const cors = require("cors");
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

const {
  authLimiter,
  generalLimiter,
  helmetConfig,
  hppProtection,
  sanitizeInput,
  xssProtection,
  detectDoS,
  validateContentType,
} = require("./middleware/security");
const app = express();

// ==================================================
//  تطبيق إعدادات الحماية بالترتيب الصحيح
// ==================================================

// 1. helmet
app.use(helmetConfig);

// 2. rate limiter
app.use(generalLimiter);

// 3. Prevent HTTP Param Pollution
app.use(hppProtection);

// 4. XSS protection على مستوى request
app.use(xssProtection);

// 5. Body parser (يجب هنا)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 6. Sanitize HTML inputs
app.use(sanitizeInput);
// إضافة endpoints للتحقق من صحة النظام
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db.authenticate() ? "connected" : "disconnected",
  });
});

app.get("/health/detailed", async (req, res) => {
  const dbStatus = await checkDatabaseHealth();
  const redisStatus = await checkRedisHealth();

  res.json({
    status: dbStatus && redisStatus ? "healthy" : "unhealthy",
    database: dbStatus,
    cache: redisStatus,
    memory: process.memoryUsage(),
    load: os.loadavg(),
  });
});

// ==================================================
// ⚙️ الإعدادات الأساسية للتطبيق
// ==================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(morgan("dev"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ==================================================
// 🌐 WebSocket setup
// ==================================================

const http = require("http");
const server = http.createServer(app);
const ChatSocketServer = require("./socket/chatSocket");
const chatSocket = new ChatSocketServer(server);

global.chatSocket = chatSocket;

// ==================================================
// 🛣️ Routes
// ==================================================

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes العامة
const graduateRoutes = require("./routes/graduates.route");
app.use("/alumni-portal/graduates", graduateRoutes);

const postRoutes = require("./routes/post.route");
app.use("/alumni-portal/posts", postRoutes);

const staffRoutes = require("./routes/staff.route");
app.use("/alumni-portal/staff", staffRoutes);

// 🔒 تطبيق rate limiting على routes المصادقة
const authRoutes = require("./routes/auth.route");
app.use("/alumni-portal", authLimiter, authRoutes);

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
app.use("/alumni-portal/auth/linkedin", authLimiter, linkedinAuthRoutes);

const notificationRoutes = require("./routes/notification.route");
app.use("/alumni-portal/notifications", notificationRoutes);

const feedbackRoutes = require("./routes/feedback.route.js");
app.use("/alumni-portal/feedbacks", feedbackRoutes);

const facultiesRoute = require("./routes/faculties.route.js");
app.use("/alumni-portal/faculties", facultiesRoute);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error Handler
app.use(errorHandler);

// ==================================================
// 🔧 Reset and seed NEW permissions
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
    const existingPermissions = await Permission.findAll();
    const existingNames = existingPermissions.map((p) => p.name);

    const missingPermissions = newPermissions.filter(
      (name) => !existingNames.includes(name)
    );

    if (existingPermissions.length > 0 && missingPermissions.length === 0) {
      console.log("✅ All permissions already exist. Skipping seeding...");
      return;
    }

    console.log("🧹 Resetting and reseeding permissions...");
    await Permission.destroy({ where: {} });
    await sequelize.query('ALTER SEQUENCE "Permission_id_seq" RESTART WITH 1;');

    for (const permName of newPermissions) {
      await Permission.create({
        name: permName,
        "can-view": false,
        "can-edit": false,
        "can-delete": false,
        "can-add": false,
      });

      console.log(` Added permission: ${permName}`);
    }

    console.log(" Permissions reset and seeded successfully!");
  } catch (error) {
    console.error(" Error during permission seeding:", error);
  }
};

// ==================================================
//  Sync Database and Seed Default Admin + Permissions
// ==================================================

// ==================================================
// ✅Connect Database and Seed Default Admin + Permissions
// ==================================================

sequelize
  .authenticate()
  .then(async () => {
    console.log("Database connected successfully.");

    // Ensure Notification table has correct structure
    const Notification = require("./models/Notification");
    try {
      // Check if navigation column exists without sync
      const tableExists = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'Notification'
        )
      `);

      if (tableExists[0][0].exists) {
        // Table exists, check for navigation column
        const columnExists = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'Notification' 
              AND column_name = 'navigation'
          )
        `);

        if (!columnExists[0][0].exists) {
          console.log("📝 Adding navigation column to Notification table...");
          await sequelize.query(`
            ALTER TABLE "Notification" 
            ADD COLUMN navigation JSON
          `);
          console.log("✅ Navigation column added successfully.");
        }
      } else {
        // Table doesn't exist - create it
        console.log("📝 Creating Notification table...");
        await Notification.sync({ force: false, alter: false });
        console.log("✅ Notification table created successfully.");
      }
    } catch (error) {
      console.error("❌ Error checking Notification table:", error);
    }

    // Check and create admin user if needed
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
      console.log("Default Admin created");
      await sequelize.query('ALTER SEQUENCE "User_id_seq" RESTART WITH 2;');
    }

    // Seed permissions
    await ensurePermissionsSeeded();

    console.log("✅ Database initialization completed successfully.");
  })
  .catch(async (err) => {
    console.error("❌ Error connecting to database:", err);
    process.exit(1);
  });

// ==================================================
// ✅ Start Server
// ==================================================

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
