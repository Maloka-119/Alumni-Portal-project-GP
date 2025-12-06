const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const generateToken = require("../utils/generateToken");
const aes = require("../utils/aes");
const axios = require("axios");
const { logger, securityLogger } = require("../utils/logger");
const { normalizeCollegeName } = require("../services/facultiesService");

// =====================
// Helper functions
// =====================
function validateNationalId(nationalId) {
  return /^\d{14}$/.test(nationalId);
}

function extractDOBFromEgyptianNID(nationalId) {
  const id = String(nationalId).trim();
  if (!validateNationalId(nationalId)) {
    throw new Error("Invalid national ID format (must be 14 digits).");
  }

  const centuryDigit = id[0];
  let century;
  if (centuryDigit === "2") century = 1900;
  else if (centuryDigit === "3") century = 2000;
  else if (centuryDigit === "4") century = 2100;
  else throw new Error("Unsupported century digit in national ID.");

  const yy = parseInt(id.substr(1, 2), 10);
  const mm = parseInt(id.substr(3, 2), 10);
  const dd = parseInt(id.substr(5, 2), 10);

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    throw new Error("Invalid birth date in national ID.");
  }

  const year = century + yy;
  return `${year.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

// =====================
// Passport Google Strategy
// =====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { google_id: profile.id } });

        if (!user) {
          const existingUser = await User.findOne({ where: { email: profile.emails[0].value } });
          if (existingUser) {
            existingUser.google_id = profile.id;
            existingUser.auth_provider = "google";
            await existingUser.save();
            return done(null, existingUser);
          }

          user = await User.create({
            google_id: profile.id,
            email: profile.emails[0].value,
            "first-name": profile.name.givenName,
            "last-name": profile.name.familyName,
            "user-type": "graduate", // سيتم تعديل النوع لاحقًا بعد APIs
            auth_provider: "google",
            profile_picture_url: profile.photos?.[0]?.value || null,
          });
        } else {
          if (profile.photos?.[0]?.value && !user.profile_picture_url) {
            user.profile_picture_url = profile.photos[0].value;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// =====================
// Serialize / Deserialize
// =====================
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// =====================
// Controller Functions
// =====================

// 1) Start Google login (store nationalId in session if new user)
exports.loginWithGoogle = (req, res, next) => {
  const { nationalId } = req.query;
  if (nationalId && !validateNationalId(nationalId)) {
    return res.redirect(
      `http://localhost:3000/helwan-alumni-portal/login?error=Invalid National ID`
    );
  }
  req.session.nationalId = nationalId; // ممكن يكون undefined لو المستخدم موجود
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

// 2) Google OAuth callback
exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, googleUser) => {
    const ip = req.ip || req.connection.remoteAddress;

    if (err || !googleUser) {
      return res.redirect(
        `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
          err?.message || "Google authentication failed"
        )}`
      );
    }

    try {
      // ===== تحقق هل المستخدم موجود بالإيميل + Google ID =====
      const existingUser = await User.findOne({
        where: { email: googleUser.email, google_id: googleUser.google_id },
      });

      if (existingUser) {
        // يدخل مباشرة بدون أي لوجيك آخر
        const token = generateToken(existingUser.id);
        const redirectUrl = new URL("http://localhost:3000/helwan-alumni-portal/login");
        redirectUrl.searchParams.set("token", token);
        redirectUrl.searchParams.set("id", existingUser.id);
        redirectUrl.searchParams.set("email", existingUser.email);
        redirectUrl.searchParams.set("userType", existingUser["user-type"]);

        return res.redirect(redirectUrl.toString());
      }

      // ===== إذا المستخدم غير موجود، تابع باقي اللوجيك =====
      const nationalIdFromFront = req.session.nationalId;
      if (!nationalIdFromFront || !validateNationalId(nationalIdFromFront)) {
        return res.redirect(
          `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
            "National ID required for new users"
          )}`
        );
      }

      const encryptedNationalId = aes.encryptNationalId(nationalIdFromFront);
      const birthDateFromNid = extractDOBFromEgyptianNID(nationalIdFromFront);

      googleUser["national-id"] = encryptedNationalId;
      googleUser["birth-date"] = birthDateFromNid;

      // ===== التحقق من APIs خارجية وتحديد نوع المستخدم =====
      let userType = "graduate";
      let externalData = null;
      let statusToLogin = "accepted";

      // Staff API
      try {
        const { data } = await axios.get(
          `${process.env.STAFF_API_URL}?nationalId=${encodeURIComponent(nationalIdFromFront)}`
        );
        if (data?.department || data?.Department) {
          externalData = data;
          userType = "staff";
          statusToLogin = "inactive";
        }
      } catch (e) {}

      // Graduate API
      if (userType === "graduate") {
        try {
          const { data } = await axios.get(
            `${process.env.GRADUATE_API_URL}?nationalId=${encodeURIComponent(nationalIdFromFront)}`
          );
          externalData = data;
          const facultyField = data?.faculty || data?.Faculty || data?.FACULTY || data?.facultyName;
          if (facultyField) {
            statusToLogin = "accepted";
          } else {
            statusToLogin = "pending";
          }
        } catch (err) {
          statusToLogin = "pending";
        }
      }

      googleUser["user-type"] = userType;
      await googleUser.save();
      securityLogger.registration(ip, googleUser.email, userType, statusToLogin);

      // إنشاء Graduate / Staff records
      if (userType === "graduate") {
        const facultyName = externalData?.faculty || externalData?.Faculty || externalData?.FACULTY || externalData?.facultyName || null;
        const facultyCode = facultyName ? normalizeCollegeName(facultyName) : null;

        await Graduate.create({
          graduate_id: googleUser.id,
          faculty_code: facultyCode,
          "graduation-year": externalData?.["graduation-year"] || externalData?.graduationYear || externalData?.GraduationYear || null,
          "status-to-login": statusToLogin,
        });
      }

      if (userType === "staff") {
        await Staff.create({
          staff_id: googleUser.id,
          "status-to-login": statusToLogin,
        });
      }

      // توليد JWT
      const token = generateToken(googleUser.id);
      const redirectUrl = new URL("http://localhost:3000/helwan-alumni-portal/login");
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("id", googleUser.id);
      redirectUrl.searchParams.set("email", googleUser.email);
      redirectUrl.searchParams.set("userType", userType);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      return res.redirect(
        `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
          error.message || "Authentication error"
        )}`
      );
    }
  })(req, res, next);
};

// Logout
exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("http://localhost:3000/");
  });
};

// Login failed (optional)
exports.loginFailed = (req, res) => res.send("Login failed");
