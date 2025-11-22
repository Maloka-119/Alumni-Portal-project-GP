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
const checkStaffPermission = require("../utils/permissionChecker");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");
const { normalizeCollegeName, getCollegeNameByCode } = require("../services/facultiesService");


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
      attributes: { exclude: ["faculty"] },
    });

    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
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

// Get active graduates (GraduatesInPortal) - Admin & Staff only
const getGraduatesInPortal = async (req, res) => {
  try {
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: [],
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "view"
      );
      if (!hasPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to view graduates.",
          data: [],
        });
      }
    }

    const lang = req.headers["accept-language"] || req.user.language || "ar";

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
      attributes: { exclude: ["faculty"] },
    });

    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
    });
  } catch (err) {
    console.error("Error fetching graduates:", err);
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
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: [],
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasGraduatePermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "view"
      );

      const hasRequestsPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "view"
      );

      if (!hasGraduatePermission && !hasRequestsPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to view requested graduates.",
          data: [],
        });
      }
    }

    const lang = req.headers["accept-language"] || req.user.language || "ar";

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
      attributes: { exclude: ["faculty"] },
    });

    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
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
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to reject graduates.",
        });
      }
    }

    const graduateId = req.params.id;
    const graduate = await Graduate.findByPk(graduateId, {
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate) {
      return res.status(404).json({
        status: "error",
        message: "Graduate not found",
      });
    }

    graduate["status-to-login"] = "rejected";
    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    return res.status(200).json({
      status: "success",
      message: "Graduate request rejected successfully",
      data: {
        ...graduate.toJSON(),
        faculty: facultyName
      },
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Not authorized or user not found",
        data: null,
      });
    }

    const userId = req.user.id;
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [{ model: require("../models/User") }],
      attributes: { exclude: ["faculty"] }
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

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const digitalID = {
      personalPicture: graduate["profile-picture-url"] || null,
      digitalID: graduate.graduate_id,
      fullName: `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim(),
      faculty: facultyName,
      nationalNumber: user["national-id"] || null,
      graduationYear: graduate["graduation-year"] || null,
    };

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
    const { id } = req.params; 
    const { faculty, graduationYear } = req.body;

    const allowedUserTypes = ["admin", "staff"];
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "edit"
      );
      if (!hasPermission) {
        return res.status(403).json({
          message: "Access denied. You don't have permission to approve graduates.",
        });
      }
    }

    if (!faculty || !graduationYear) {
      return res.status(400).json({ message: "Faculty and graduationYear are required." });
    }

    const facultyCode = normalizeCollegeName(faculty);
    if (!facultyCode) {
      return res.status(400).json({ message: "Invalid faculty name." });
    }

    const graduate = await Graduate.findOne({ 
      where: { graduate_id: id },
      attributes: { exclude: ["faculty"] }
    });
    if (!graduate) return res.status(404).json({ message: "Graduate not found." });

    graduate.faculty_code = facultyCode;
    graduate["graduation-year"] = graduationYear;
    graduate["status-to-login"] = "accepted";

    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(facultyCode, lang);

    return res.status(200).json({
      message: "Graduate approved successfully.",
      graduateId: id,
      facultyCode: facultyCode,
      facultyName: facultyName
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
      attributes: { exclude: ["faculty"] },
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;
    const isOwner = req.user && parseInt(req.user.id) === parseInt(graduate.graduate_id);

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: facultyName,
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
      attributes: { exclude: ["faculty"] },
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // تحديث بيانات User
    const userFields = ["firstName", "lastName", "phoneNumber"];
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "firstName") user["first-name"] = req.body[field];
        else if (field === "lastName") user["last-name"] = req.body[field];
        else if (field === "phoneNumber") user.phoneNumber = req.body[field];
      }
    });

    // تحديث بيانات Graduate مع تحويل اسم الكلية إلى كود
    const graduateFields = [
      { bodyKey: "bio", dbKey: "bio" },
      { bodyKey: "skills", dbKey: "skills" },
      { bodyKey: "currentJob", dbKey: "current-job" },
      { bodyKey: "graduationYear", dbKey: "graduation-year" },
      { bodyKey: "linkedlnLink", dbKey: "linkedln-link" },
    ];

    graduateFields.forEach(({ bodyKey, dbKey }) => {
      if (req.body[bodyKey] !== undefined) {
        graduate[dbKey] = req.body[bodyKey];
      }
    });

    // تحديث faculty_code إذا تم إرسال faculty
    if (req.body.faculty !== undefined) {
      const facultyCode = normalizeCollegeName(req.body.faculty);
      if (facultyCode) {
        graduate.faculty_code = facultyCode;
      }
    }

    // تحديث إعدادات الخصوصية
    if (req.body.showCV !== undefined) graduate.show_cv = req.body.showCV;
    if (req.body.showLinkedIn !== undefined)
      graduate.show_linkedin = req.body.showLinkedIn;
    if (req.body.showPhone !== undefined) user.show_phone = req.body.showPhone;

    // معالجة صورة البروفايل
    if (req.files?.profilePicture?.[0]) {
      const profilePic = req.files.profilePicture[0];
      graduate["profile-picture-url"] = profilePic.path || profilePic.url;
      graduate["profile-picture-public-id"] =
        profilePic.filename || profilePic.public_id;
    }

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

    // معالجة CV
    if (req.files?.cv?.[0]) {
      const cvFile = req.files.cv[0];
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

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: facultyName,
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
    const graduate = await Graduate.findByPk(graduateId, {
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate || !graduate["cv-url"]) {
      return res.status(404).json({
        status: "error",
        message: "CV not found",
        data: null,
      });
    }

    const signedUrl = cloudinary.url(graduate.cv_public_id, {
      resource_type: "auto",
      type: "authenticated",
      sign_url: true,
    });

    const response = await axios.get(signedUrl, { responseType: "stream" });
    
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${graduate["cv-url"].split("/").pop()}"`
    );
    res.setHeader("Content-Type", response.headers["content-type"]);

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
    const { id } = req.params;
    const { status } = req.body;

    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: null,
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to update graduate status.",
          data: null,
        });
      }
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Use 'active' or 'inactive'.",
        data: null,
      });
    }

    const graduate = await Graduate.findByPk(id, { 
      include: [User],
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    graduate.status = status;
    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Graduate status updated to ${status} successfully`,
      data: {
        graduateId: graduate.graduate_id,
        fullName: `${graduate.User["first-name"]} ${graduate.User["last-name"]}`,
        faculty: facultyName,
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
    
    // البحث باستخدام faculty_code بدلاً من faculty
    if (faculty) {
      const facultyCode = normalizeCollegeName(faculty);
      if (facultyCode) {
        whereClause.faculty_code = facultyCode;
      }
    }
    
    if (graduationYear) whereClause["graduation-year"] = graduationYear;

    const graduates = await Graduate.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
      attributes: { exclude: ["faculty"] },
    });

    const lang = req.headers["accept-language"] || req.user?.language || "ar";
    
    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    res.json({
      status: "success",
      data: graduatesWithFaculty,
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

    let graduate;

    // البحث عن الخريج بالإيدي
    if (!isNaN(identifier)) {
      graduate = await Graduate.findByPk(identifier, {
        include: [{ model: User }],
        attributes: { exclude: ["faculty"] },
      });
    } else {
      // البحث بالإيميل
      const userByEmail = await User.findOne({
        where: { email: identifier },
        include: [{ model: Graduate }],
      });

      if (userByEmail) {
        graduate = userByEmail.Graduate;
      } else {
        // البحث بالاسم
        const usersByName = await User.findAll({
          where: {
            [Op.or]: [
              { "first-name": { [Op.like]: `%${identifier}%` } },
              { "last-name": { [Op.like]: `%${identifier}%` } },
            ],
          },
          include: [{ model: Graduate }],
        });

        for (let user of usersByName) {
          if (user.Graduate) {
            graduate = user.Graduate;
            break;
          }
        }
      }
    }

    if (!graduate || !graduate.User) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

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

    // جلب بوستات الخريج
    const posts = await Post.findAll({
      where: {
        "author-id": graduate.graduate_id,
        "is-hidden": false,
        "group-id": null,
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "user-type"],
          include: [{ model: Graduate, attributes: ["profile-picture-url"] }],
        },
        { model: PostImage, attributes: ["image-url"] },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "user-type"],
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
              attributes: ["id", "first-name", "last-name", "user-type"],
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

    // تجهيز بيانات البوستات
    const postsData = posts.map((post) => {
      const authorUser = post.User;

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
          "user-type": authorUser?.["user-type"] || "unknown",
          image: authorUser?.Graduate
            ? authorUser.Graduate["profile-picture-url"]
            : null,
        },
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: like.User
                ? {
                    id: like.User.id,
                    "full-name": `${like.User["first-name"] || ""} ${
                      like.User["last-name"] || ""
                    }`.trim(),
                    "user-type": like.User["user-type"] || "unknown",
                    image: like.User.Graduate
                      ? like.User.Graduate["profile-picture-url"]
                      : null,
                  }
                : null,
            }))
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
                "user-type": comment.User?.["user-type"] || "unknown",
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

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const profile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${userData["first-name"]} ${userData["last-name"]}`,
      faculty: facultyName,
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