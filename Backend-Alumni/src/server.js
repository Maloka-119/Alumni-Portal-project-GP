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
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Session configuration for LinkedIn OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// WebSocket setup
const http = require("http");
const server = http.createServer(app);
const ChatSocketServer = require("./socket/chatSocket");
const chatSocket = new ChatSocketServer(server);

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

//  Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Error Handler
app.use(errorHandler);

// ==================================================
//  Clear old permissions and seed new ones
// ==================================================
// ==================================================
//  Reset and seed NEW permissions
// ==================================================
// ==================================================
//  Reset and seed NEW permissions (IDs start from 1)
// ==================================================
const ensurePermissionsSeeded = async () => {
  const newPermissions = [
    "Roles and Permissions Management",
    "Staff Management",
    "Graduates Management",
    "Graduates Join Requests Management",
    "Communities Management",
    "Posts Management",
    "Consultations Management",
    "Document Requests Management",
    "Reports Management",
    "FAQs Management",
  ];

  try {
    const count = await Permission.count();

    if (count > 0) {
      console.log("✅ Permissions already exist. Skipping seeding...");
      return; // متعملش أي تعديل لو البيانات موجودة
    }

    console.log("🆕 Permissions table empty — Seeding now...");

    // Reset the auto-increment IDs only once (أول مرة فقط)
    await sequelize.query('ALTER SEQUENCE "Permission_id_seq" RESTART WITH 1;');

    for (const permName of newPermissions) {
      await Permission.create({
        name: permName,
        "can-view": false,
        "can-edit": false,
        "can-delete": false,
      });
      console.log(`✅ Added permission: ${permName}`);
    }

    console.log("🎯 Permissions seeded successfully.");
  } catch (error) {
    console.error("❌ Error during permission seeding:", error);
  }
};

// ==================================================
// ✅ Sync Database and Seed Default Admin + Permissions
// ==================================================
sequelize.sync({ alter: true }).then(async () => {
  console.log("Database synced successfully with alter true.");

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
});

// ==================================================
// ✅ Start Server
// ==================================================
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
