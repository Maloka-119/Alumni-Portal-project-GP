const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const generateToken = require("../utils/generateToken");
const aes = require("../utils/aes");
const axios = require("axios");
const { logger, securityLogger } = require("../utils/logger");
const {
  normalizeCollegeName,
  getCollegeNameByCode,
} = require("../services/facultiesService");


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
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    throw new Error("Invalid birth date extracted from national ID.");
  }

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
            "user-type": "graduate",
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

// 1) Start Google login (store nationalId in session)
exports.loginWithGoogle = (req, res, next) => {
  const { nationalId } = req.query;
  if (!nationalId || !validateNationalId(nationalId)) {
    return res.redirect(
      `http://localhost:3000/helwan-alumni-portal/login?error=Invalid National ID`
    );
  }
  req.session.nationalId = nationalId;
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

// 2) Google OAuth callback
exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, googleUser) => {
    const ip = req.ip || req.connection.remoteAddress;

    if (err || !googleUser) {
      securityLogger.failedLogin(ip, req.body?.email || "unknown", err?.message || "Google authentication failed");
      return res.redirect(
        `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
          err?.message || "Google authentication failed"
        )}`
      );
    }

    try {
      const nationalId = req.session.nationalId;
      if (!nationalId || !validateNationalId(nationalId)) {
        logger.error("Invalid National ID provided", { ip, nationalId });
        return res.redirect(
          `http://localhost:3000/helwan-alumni-portal/login?error=Invalid National ID`
        );
      }

      // Extract DOB
      let birthDateFromNid;
      try {
        birthDateFromNid = extractDOBFromEgyptianNID(nationalId);
        logger.info("Birth date extracted from NID", { ip, nationalId, birthDateFromNid });
      } catch (error) {
        logger.error("Failed to extract DOB from National ID", { ip, nationalId, error: error.message });
        return res.redirect(
          `http://localhost:3000/helwan-alumni-portal/login?error=Invalid National ID`
        );
      }

      const encryptedNationalId = aes.encryptNationalId(nationalId);

      // Check duplicate
      const allUsers = await User.findAll({ attributes: ["id", "national-id"] });
      for (const u of allUsers) {
        const decrypted = aes.decryptNationalId(u["national-id"]);
        if (decrypted === nationalId && u.id !== googleUser.id) {
          logger.warn("Duplicate National ID detected", { ip, nationalId, existingUserId: u.id });
          return res.redirect(
            `http://localhost:3000/helwan-alumni-portal/login?error=National ID already registered`
          );
        }
      }

      // Detect user type via external APIs
      let externalData = null;
      let userType = null;
      let statusToLogin = "accepted";

      // STAFF API
      try {
        const { data } = await axios.get(
          `${process.env.STAFF_API_URL}?nationalId=${encodeURIComponent(nationalId)}`
        );
        if (data?.department || data?.Department) {
          externalData = data;
          userType = "staff";
          statusToLogin = "inactive";
          logger.info("User detected as staff", { ip, nationalId });
        }
      } catch (e) {
        logger.info("No staff record found", { ip, nationalId });
      }

      // GRADUATE API
      if (!userType) {
        try {
          const { data } = await axios.get(
            `${process.env.GRADUATE_API_URL}?nationalId=${encodeURIComponent(nationalId)}`
          );
          externalData = data;

          const facultyField =
            data?.faculty || data?.Faculty || data?.FACULTY || data?.facultyName;

          if (facultyField) {
            userType = "graduate";
            statusToLogin = "accepted";
          } else {
            userType = "graduate";
            statusToLogin = "pending";
          }
          logger.info("User detected as graduate", { ip, nationalId, statusToLogin });
        } catch (err) {
          userType = "graduate";
          statusToLogin = "pending";
          logger.warn("Graduate API failed, setting status to pending", { ip, nationalId, error: err.message });
        }
      }

      if (!userType) {
        logger.error("National ID not found in records", { ip, nationalId });
        return res.redirect(
          `http://localhost:3000/helwan-alumni-portal/login?error=National ID not found in records`
        );
      }

      // Update user
      googleUser["national-id"] = encryptedNationalId;
      googleUser["birth-date"] = birthDateFromNid;
      googleUser["user-type"] = userType;
      await googleUser.save();
      securityLogger.registration(ip, googleUser.email, userType, statusToLogin);

      // Create Graduate / Staff
      if (userType === "graduate") {
        const facultyName =
          externalData?.faculty || externalData?.Faculty || externalData?.FACULTY || externalData?.facultyName || null;
        const facultyCode = facultyName ? normalizeCollegeName(facultyName) : null;

        await Graduate.create({
          graduate_id: googleUser.id,
          faculty_code: facultyCode,
          "graduation-year":
            externalData?.["graduation-year"] || externalData?.graduationYear || externalData?.GraduationYear || null,
          "status-to-login": statusToLogin,
        });
        logger.info("Graduate record created", { ip, userId: googleUser.id });

        // Auto group invitation
        try {
          const { sendAutoGroupInvitation } = require("./invitation.controller");
          await sendAutoGroupInvitation(googleUser.id);
          logger.info("Auto group invitation sent", { ip, userId: googleUser.id });
        } catch (error) {
          logger.warn("Failed to send auto group invitation", { ip, userId: googleUser.id, error: error.message });
        }
      }

      if (userType === "staff") {
        await Staff.create({
          staff_id: googleUser.id,
          "status-to-login": statusToLogin,
        });
        logger.info("Staff record created", { ip, userId: googleUser.id });
      }

      // Generate JWT
      const token = generateToken(googleUser.id);
      logger.info("JWT generated for user", { ip, userId: googleUser.id });

      const redirectUrl = new URL("http://localhost:3000/helwan-alumni-portal/login");
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("id", googleUser.id);
      redirectUrl.searchParams.set("email", googleUser.email);
      redirectUrl.searchParams.set("userType", userType);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error("Google callback error", { ip, error: error.message });
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
exports.loginFailed = (req, res) => res.send("Login failed ");
