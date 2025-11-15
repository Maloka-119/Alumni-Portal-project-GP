const Graduate = require("../models/Graduate");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const GroupMember = require("../models/GroupMember");
const { Op } = require("sequelize");
const HttpStatusHelper = require("../utils/HttpStatuHelper");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

//get all graduates
const getAllGraduates = async (req, res) => {
  try {
    const graduates = await Graduate.findAll({
      include: {
        model: User,
        attributes: [
          "id",
          "first-name",
          "last-name",
          "national-id",
          "email",
          "phone-number",
          "birth-date",
          "user-type",
        ],
      },
    });

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduates,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

// Get active graduates (GraduatesInPortal) - Admin only
const getGraduatesInPortal = async (req, res) => {
  try {
    // التحقق إن المستخدم Admin أو Staff
    if (
      req.user["user-type"] !== "admin" &&
      req.user["user-type"] !== "staff"
    ) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied. Admins or Staff only.",
        data: [],
      });
    }

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "accepted" },
      include: {
        model: User,
        attributes: [
          "id",
          ["first-name", "firstName"],
          ["last-name", "lastName"],
          ["national-id", "nationalId"],
          "email",
          ["phone-number", "phoneNumber"],
          ["birth-date", "birthDate"],
          ["user-type", "userType"],
        ],
      },
    });

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduates,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

// Get inactive graduates (requested to join) - Admin only
const getRequestedGraduates = async (req, res) => {
  try {
    // التحقق إن المستخدم Admin أو Staff
    if (
      req.user["user-type"] !== "admin" &&
      req.user["user-type"] !== "staff"
    ) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied. Admins and staff only.",
        data: [],
      });
    }

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "pending" },
      include: {
        model: User,
        attributes: [
          "id",
          ["first-name", "firstName"],
          ["last-name", "lastName"],
          ["national-id", "nationalId"],
          "email",
          ["phone-number", "phoneNumber"],
          ["birth-date", "birthDate"],
          ["user-type", "userType"],
        ],
      },
    });

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduates,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

//reject graduate by admin
const rejectGraduate = async (req, res) => {
  try {
    // تأكيد إن المستخدم Admin أو Staff
    if (
      req.user["user-type"] !== "admin" &&
      req.user["user-type"] !== "staff"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin and staff only",
      });
    }

    const graduateId = req.params.id;

    // جلب الخريج من قاعدة البيانات
    const graduate = await Graduate.findByPk(graduateId);

    if (!graduate) {
      return res.status(404).json({
        status: "error",
        message: "Graduate not found",
      });
    }

    // تحديث الحالة إلى "rejected"
    graduate["status-to-login"] = "rejected";
    await graduate.save();

    return res.status(200).json({
      status: "success",
      message: "Graduate request rejected successfully",
      data: graduate,
    });
  } catch (error) {
    console.error(" Error rejecting graduate:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to reject graduate request",
      error: error.message,
    });
  }
};

//get digital id
const getDigitalID = async (req, res) => {
  try {
    // تأكد إن req.user موجود
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Not authorized or user not found",
        data: null,
      });
    }

    const userId = req.user.id;

    // جلب بيانات الـ Graduate مع الـ User المرتبط
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [{ model: require("../models/User") }],
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    if (!user) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "User details not found for this graduate",
        data: null,
      });
    }

    //  تجهيز البيانات النهائية للـ Digital ID
    const digitalID = {
      personalPicture: graduate["profile-picture-url"] || null,
      digitalID: graduate.graduate_id,
      fullName: `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim(),
      faculty: graduate.faculty || null,
      nationalNumber: user["national-id"] || null,
      graduationYear: graduate["graduation-year"] || null,
    };

    //  إرجاع الاستجابة
    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Digital ID fetched successfully",
      data: digitalID,
    });
  } catch (err) {
    console.error("getDigitalID error:", err.message);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

// Approve Graduate by admin
const approveGraduate = async (req, res) => {
  try {
    const { id } = req.params; // graduate_id من URL
    const { faculty, graduationYear } = req.body; // من body

    // ✅ التحقق من أن اللي بينفذ هو admin أو staff
    if (
      !req.user ||
      (req.user["user-type"] !== "admin" && req.user["user-type"] !== "staff")
    ) {
      return res.status(403).json({
        message: "Access denied: Only admin and staff can approve graduates.",
      });
    }

    // ✅ التحقق إن الحقول المطلوبة موجودة
    if (!faculty || !graduationYear) {
      return res.status(400).json({
        message: "Faculty and graduationYear are required.",
      });
    }

    // 🔍 البحث عن الخريج في قاعدة البيانات
    const graduate = await Graduate.findOne({ where: { graduate_id: id } });

    if (!graduate) {
      return res.status(404).json({ message: "Graduate not found." });
    }

    // ✅ تحديث الحالة والبيانات
    graduate["status-to-login"] = "accepted";
    graduate["graduation-year"] = graduationYear;
    graduate.faculty = faculty;

    await graduate.save();

    // ✅ رد النجاح
    return res.status(200).json({
      message: "Graduate approved successfully.",
      graduateId: id,
      newStatus: graduate["status-to-login"],
    });
  } catch (error) {
    console.error("Error approving graduate:", error.message);
    return res.status(500).json({
      message: "Server error while approving graduate.",
      error: error.message,
    });
  }
};

// GET Graduate Profile for admin
const getGraduateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.params.id, {
      include: [{ model: User }],
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // ✅ نتحقق هل اللي طالب البروفايل هو صاحبه
    const isOwner =
      req.user && parseInt(req.user.id) === parseInt(graduate.graduate_id);

    // ✅ نبني نفس شكل البيانات اللي بترجع من updateProfile
    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],

      // إعدادات الخصوصية
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,

      // ✅ نرجّع القيم دايمًا (زي updateProfile)
      CV: graduate["cv-url"],
      linkedlnLink: graduate["linkedln-link"],
      phoneNumber: user.phoneNumber,
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: graduateProfile,
    });
  } catch (err) {
    console.error("Error in getGraduateProfile:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

//update profile
const updateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.user.id, {
      include: [{ model: User }],
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // 🔹 تحديث بيانات User
    const userFields = ["firstName", "lastName", "phoneNumber"];
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "firstName") user["first-name"] = req.body[field];
        else if (field === "lastName") user["last-name"] = req.body[field];
        else if (field === "phoneNumber") user.phoneNumber = req.body[field];
      }
    });

    // 🔹 تحديث بيانات Graduate
    const graduateFields = [
      { bodyKey: "bio", dbKey: "bio" },
      { bodyKey: "skills", dbKey: "skills" },
      { bodyKey: "currentJob", dbKey: "current-job" },
      { bodyKey: "faculty", dbKey: "faculty" },
      { bodyKey: "graduationYear", dbKey: "graduation-year" },
      { bodyKey: "linkedlnLink", dbKey: "linkedln-link" },
    ];

    graduateFields.forEach(({ bodyKey, dbKey }) => {
      if (req.body[bodyKey] !== undefined) {
        graduate[dbKey] = req.body[bodyKey];
      }
    });

    // 🔹 تحديث إعدادات الخصوصية
    if (req.body.showCV !== undefined) graduate.show_cv = req.body.showCV;
    if (req.body.showLinkedIn !== undefined)
      graduate.show_linkedin = req.body.showLinkedIn;
    if (req.body.showPhone !== undefined) user.show_phone = req.body.showPhone;

    // 🔹 رفع أو استبدال صورة البروفايل
    if (req.files?.profilePicture?.[0]) {
      const profilePic = req.files.profilePicture[0];
      graduate["profile-picture-url"] = profilePic.path || profilePic.url;
      graduate["profile-picture-public-id"] =
        profilePic.filename || profilePic.public_id;
    }

    // 🔹 مسح صورة البروفايل لو حابة
    if (req.body.removeProfilePicture) {
      if (graduate["profile-picture-public-id"]) {
        try {
          await cloudinary.uploader.destroy(
            graduate["profile-picture-public-id"]
          );
        } catch (err) {
          console.warn("Failed to delete profile picture:", err.message);
        }
      }
      graduate["profile-picture-url"] = null;
      graduate["profile-picture-public-id"] = null;
    }

    // 🔹 رفع أو استبدال CV
    if (req.files?.cv?.[0]) {
      const cvFile = req.files.cv[0];

      // حذف القديم لو موجود
      if (graduate.cv_public_id) {
        try {
          await cloudinary.uploader.destroy(graduate.cv_public_id, {
            resource_type: "raw",
          });
        } catch (deleteErr) {
          console.warn("Failed to delete old CV:", deleteErr.message);
        }
      }

      graduate["cv-url"] = cvFile.path || cvFile.url;
      graduate.cv_public_id = cvFile.filename || cvFile.public_id;
    }

    // 🔹 مسح CV لو حابة
    if (req.body.removeCV) {
      if (graduate.cv_public_id) {
        try {
          await cloudinary.uploader.destroy(graduate.cv_public_id, {
            resource_type: "raw",
          });
        } catch (err) {
          console.warn("Failed to delete CV:", err.message);
        }
      }
      graduate["cv-url"] = null;
      graduate.cv_public_id = null;
    }

    await user.save();
    await graduate.save();

    // ✅ صاحب البروفايل يشوف كل حاجة دايمًا
    const isOwner = true;

    // 🔹 تجهيز البيانات للرد زي getGraduateProfile
    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,
      CV: graduate["cv-url"],
      linkedlnLink: graduate["linkedln-link"],
      phoneNumber: user.phoneNumber,
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate profile updated successfully",
      data: graduateProfile,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

//download cv

const downloadCv = async (req, res) => {
  try {
    const graduateId = req.params.id;
    const graduate = await Graduate.findByPk(graduateId);

    if (!graduate || !graduate["cv-url"]) {
      return res.status(404).json({
        status: "error",
        message: "CV not found",
        data: null,
      });
    }

    // توليد signed URL
    const signedUrl = cloudinary.url(graduate.cv_public_id, {
      resource_type: "auto",
      type: "authenticated",
      sign_url: true,
    });

    // جلب الملف من Cloudinary
    const response = await axios.get(signedUrl, { responseType: "stream" });
    console.log("Graduate found:", graduate);
    console.log("cv_public_id:", graduate.cv_public_id);
    console.log("cv-url:", graduate["cv-url"]);

    // إعداد هيدر التحميل
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${graduate["cv-url"].split("/").pop()}"`
    );
    res.setHeader("Content-Type", response.headers["content-type"]);

    // إرسال الملف للفرونت إند
    response.data.pipe(res);
  } catch (err) {
    console.error("Error downloading CV:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      data: null,
    });
  }
};

// Activate / Inactivate Graduate
const updateGraduateStatus = async (req, res) => {
  try {
    const { id } = req.params; // graduate_id
    const { status } = req.body; // "active" or "inactive"

    // ⬇️⬇️⬇️ التحقق من صلاحيات Admin أو Staff ⬇️⬇️⬇️
    if (
      req.user["user-type"] !== "admin" &&
      req.user["user-type"] !== "staff"
    ) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied. Admins and staff only.",
        data: null,
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Use 'active' or 'inactive'.",
        data: null,
      });
    }

    const graduate = await Graduate.findByPk(id, { include: [User] });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    graduate.status = status;
    await graduate.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Graduate status updated to ${status} successfully`,
      data: {
        graduateId: graduate.graduate_id,
        fullName: `${graduate.User["first-name"]} ${graduate.User["last-name"]}`,
        status: graduate.status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

const searchGraduates = async (req, res) => {
  try {
    const { faculty, "graduation-year": graduationYear } = req.query;

    const whereClause = {};
    if (faculty) whereClause.faculty = faculty;
    if (graduationYear) whereClause["graduation-year"] = graduationYear; // 👈 لازم بنفس الاسم اللي في المودل

    const graduates = await Graduate.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    res.json({
      status: "success",
      data: graduates,
    });
  } catch (error) {
    console.error("Error searching graduates:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to search graduates",
      error: error.message,
    });
  }
};
// get graduate profile for user
const getGraduateProfileForUser = async (req, res) => {
  try {
    const { identifier } = req.params;
    const currentUserId = req.user.id;

    console.log("🔍 البحث عن الخريج:", { identifier, currentUserId });

    let graduate;

    // البحث عن الخريج بالإيدي
    if (!isNaN(identifier)) {
      console.log("🔍 البحث بالإيدي:", identifier);
      graduate = await Graduate.findByPk(identifier, {
        include: [{ model: User }],
      });
      console.log("✅ نتيجة البحث بالإيدي:", graduate ? "موجود" : "غير موجود");
    } else {
      // البحث بالإيميل
      console.log("🔍 البحث بالإيميل:", identifier);
      const userByEmail = await User.findOne({
        where: { email: identifier },
        include: [{ model: Graduate }],
      });

      if (userByEmail) {
        graduate = userByEmail.Graduate;
        console.log("✅ وجد بالإيميل:", userByEmail.email);
      } else {
        // البحث بالاسم
        console.log("🔍 البحث بالاسم:", identifier);
        const usersByName = await User.findAll({
          where: {
            [Op.or]: [
              { "first-name": { [Op.like]: `%${identifier}%` } },
              { "last-name": { [Op.like]: `%${identifier}%` } },
            ],
          },
          include: [{ model: Graduate }],
        });

        console.log("🔍 عدد النتائج بالاسم:", usersByName.length);

        for (let user of usersByName) {
          if (user.Graduate) {
            graduate = user.Graduate;
            console.log(
              "✅ وجد بالاسم:",
              user["first-name"],
              user["last-name"]
            );
            break;
          }
        }
      }
    }

    if (!graduate || !graduate.User) {
      console.log("❌ الخريج غير موجود");
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    console.log(
      "✅ تم العثور على الخريج:",
      graduate.graduate_id,
      graduate.User["first-name"]
    );

    // تحديد حالة الصداقة
    let friendshipStatus = "no_relation";

    const existingFriendshipRequest = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: graduate.graduate_id },
          { sender_id: graduate.graduate_id, receiver_id: currentUserId },
        ],
        status: "pending",
      },
    });

    if (existingFriendshipRequest) {
      friendshipStatus =
        existingFriendshipRequest.sender_id === currentUserId
          ? "i_sent_request"
          : "he_sent_request";
    }

    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: graduate.graduate_id },
          { sender_id: graduate.graduate_id, receiver_id: currentUserId },
        ],
        status: "accepted",
      },
    });

    if (friendship) friendshipStatus = "friends";

    console.log("🔍 حالة الصداقة:", friendshipStatus);

    // جلب بوستات الخريج
    console.log("🔍 جلب البوستات للخريج:", graduate.graduate_id);

    const posts = await Post.findAll({
      where: {
        "author-id": graduate.graduate_id,
        "is-hidden": false,
        "group-id": null,
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name"],
          include: [{ model: Graduate, attributes: ["profile-picture-url"] }],
        },
        { model: PostImage, attributes: ["image-url"] },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
              include: [
                { model: Graduate, attributes: ["profile-picture-url"] },
              ],
            },
          ],
        },
        {
          model: Comment,
          attributes: ["comment_id", "content", "created-at", "edited"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
              include: [
                { model: Graduate, attributes: ["profile-picture-url"] },
              ],
            },
          ],
          order: [["created-at", "ASC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    console.log("🔍 عدد البوستات التي تم جلبها:", posts.length);

    // لوج مفصل لكل بوست واللايكات
    posts.forEach((post, index) => {
      console.log(`\n📝 البوست ${index + 1}:`, post.post_id);
      console.log(
        "🔍 عدد اللايكات في البوست:",
        post.Likes ? post.Likes.length : 0
      );

      if (post.Likes && post.Likes.length > 0) {
        post.Likes.forEach((like, likeIndex) => {
          console.log(`   ❤️  لايك ${likeIndex + 1}:`, {
            like_id: like.like_id,
            user_id: like["user-id"],
            user_data: like.User ? `موجود (${like.User.id})` : "NULL",
          });
        });
      } else {
        console.log("   ❌ لا توجد لايكات في هذا البوست");
      }
    });

    // تجهيز بيانات البوستات
    const postsData = posts.map((post) => {
      const authorUser = post.User;

      console.log(`🔍 تجهيز البوست ${post.post_id}:`, {
        likes_count: post.Likes ? post.Likes.length : 0,
        user_in_likes: post.Likes
          ? post.Likes.map((like) => (like.User ? like.User.id : "NULL"))
          : [],
      });

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        "created-at": post["created-at"],
        author: {
          id: authorUser?.id || "unknown",
          "full-name": `${authorUser?.["first-name"] || ""} ${
            authorUser?.["last-name"] || ""
          }`.trim(),
          image: authorUser?.Graduate
            ? authorUser.Graduate["profile-picture-url"]
            : null,
        },
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likes: post.Likes
          ? post.Likes.map((like) => {
              console.log("🔍 تجهيز لايك:", {
                like_id: like.like_id,
                user_id: like["user-id"],
                user_data: like.User,
              });

              return {
                like_id: like.like_id,
                user: like.User
                  ? {
                      id: like.User.id,
                      "full-name": `${like.User["first-name"] || ""} ${
                        like.User["last-name"] || ""
                      }`.trim(),
                      image: like.User.Graduate
                        ? like.User.Graduate["profile-picture-url"]
                        : null,
                    }
                  : null,
              };
            })
          : [],
        likes_count: post.Likes ? post.Likes.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
      };
    });

    const userData = graduate.User;
    const isOwner = +currentUserId === +graduate.graduate_id;

    const profile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${userData["first-name"]} ${userData["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: userData.show_phone,
      friendshipStatus: isOwner ? "owner" : friendshipStatus,
      posts: postsData,
    };

    if (graduate.show_cv) profile.CV = graduate["cv-url"];
    if (graduate.show_linkedin)
      profile.linkedlnLink = graduate["linkedln-link"];
    if (userData.show_phone) profile.phoneNumber = userData.phoneNumber;

    console.log("✅ تم تجهيز البروفايل بنجاح");

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: profile,
    });
  } catch (err) {
    console.error("❌ خطأ في الفانكشن:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

module.exports = {
  getAllGraduates,
  getGraduatesInPortal,
  getRequestedGraduates,
  getDigitalID,
  getGraduateProfile,
  updateProfile,
  updateGraduateStatus,
  searchGraduates,
  approveGraduate,
  rejectGraduate,
  getGraduateProfileForUser,
  downloadCv,
};
