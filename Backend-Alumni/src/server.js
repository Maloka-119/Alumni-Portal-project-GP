const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
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

// WebSocket setup
const http = require('http');
const server = http.createServer(app);
const ChatSocketServer = require('./sockte/chatSocket');
const chatSocket = new ChatSocketServer(server);


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

//  Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Error Handler
app.use(errorHandler);

// ==================================================
//  Clear old permissions and seed new ones
// ==================================================
const ensurePermissionsSeeded = async () => {
  const permissions = [
    "Graduates Management",
    "Staff Management",
    "Communities Management",
    "Posts Management",
    "Reports",
    "Verification Graduates Management",
    "Document's Requests Management",
    "Consultation Management",
    "FAQs Management",
  ];

  try {
    console.log("Checking existing permissions...");

    for (const permName of permissions) {
      // نشوف هل البيرميشن موجود قبل كده ولا لأ
      const existing = await Permission.findOne({ where: { name: permName } });

      if (!existing) {
        let canView = false;
        let canEdit = false;
        let canDelete = false;

        // 🚨 قاعدة خاصة بـ Reports
        if (permName === "Reports") {
          canView = false; // البداية false لكن يمكن تغييره بعدين
          canEdit = false; // ممنوع تغييره أبداً
          canDelete = false; // ممنوع تغييره أبداً
        }

        await Permission.create({
          name: permName,
          "can-view": canView,
          "can-edit": canEdit,
          "can-delete": canDelete,
        });

        console.log(`Added missing permission: ${permName}`);
      } else {
        console.log(`Permission already exists: ${permName}`);
      }
    }

    console.log("Permission seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding permissions:", error);
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
