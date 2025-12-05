const User = require("../models/User");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const generateToken = require("../utils/generateToken"); // تأكدي إن عندك دالة توليد التوكن

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
        // البحث بالمستخدم حسب google_id في قاعدة البيانات
        let user = await User.findOne({ where: { google_id: profile.id } });

        if (!user) {
          // تحقق لو فيه مستخدم بنفس الإيميل
          const existingUser = await User.findOne({
            where: { email: profile.emails[0].value },
          });

          if (existingUser) {
            existingUser.google_id = profile.id;
            existingUser.auth_provider = "google";
            await existingUser.save();
            return done(null, existingUser);
          }

          // إنشاء مستخدم جديد
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
          // تحديث صورة الملف الشخصي إذا موجودة
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
exports.loginWithGoogle = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleCallback = async (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(
        `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
          err?.message || "Google authentication failed"
        )}`
      );
    }

    try {
      // توليد JWT
      const token = generateToken(user.id);

      // إنشاء رابط إعادة التوجيه للفرونت
      const redirectUrl = new URL(
        "http://localhost:3000/helwan-alumni-portal/login"
      );
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("id", user.id);
      redirectUrl.searchParams.set("email", user.email);
      redirectUrl.searchParams.set("userType", user["user-type"]);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Google callback error:", error);
      return res.redirect(
        `http://localhost:3000/helwan-alumni-portal/login?error=${encodeURIComponent(
          "Authentication error"
        )}`
      );
    }
  })(req, res, next);
};

// غير مستخدمة بعد التعديل
exports.redirectAfterLogin = (req, res) => {
  res.redirect("http://localhost:3000/profile");
};

exports.loginFailed = (req, res) => res.send("Login failed 😢");

exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("http://localhost:3000/");
  });
};