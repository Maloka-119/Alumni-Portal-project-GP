const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Post = require("../models/Post");
const GroupMember = require("../models/GroupMember");
const { Op } = require("sequelize");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

const searchUsers = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [searchUsers] START -----", {
    timestamp: new Date().toISOString(),
    query: req.query.q,
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });
  // 🔴 END OF LOGGING

  try {
    const query = req.query.q || "";

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Search users request details", {
      query,
      queryLength: query.length,
      isNumeric: !isNaN(query),
      userIp: req.ip,
    });
    // 🔴 END OF LOGGING

    // لو الكويري رقم (ID) ولا نص
    const isNumeric = !isNaN(query);

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Searching for graduates", { query, isNumeric });
    // 🔴 END OF LOGGING

    // 🔹 هات الخريجين
    const graduates = await Graduate.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: {
            "user-type": "graduate",
            ...(query
              ? isNumeric
                ? { id: query } // لو رقم → سيرش بالـ id
                : {
                    [Op.or]: [
                      { "first-name": { [Op.iLike]: `%${query}%` } },
                      { "last-name": { [Op.iLike]: `%${query}%` } },
                      { email: { [Op.iLike]: `%${query}%` } },
                    ],
                  }
              : {}), // لو مفيش query → رجّع الكل
          },
        },
      ],
      attributes: ["faculty", "graduation-year", "profile-picture-url"],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Searching for staff", { query, isNumeric });
    // 🔴 END OF LOGGING

    // 🔹 هات الاستاف
    const staff = await Staff.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: {
            "user-type": "staff",
            ...(query
              ? isNumeric
                ? { id: query }
                : {
                    [Op.or]: [
                      { "first-name": { [Op.iLike]: `%${query}%` } },
                      { "last-name": { [Op.iLike]: `%${query}%` } },
                      { email: { [Op.iLike]: `%${query}%` } },
                    ],
                  }
              : {}),
          },
        },
      ],
      attributes: ["status-to-login"],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Search results found", {
      graduatesCount: graduates.length,
      staffCount: staff.length,
      totalResults: graduates.length + staff.length,
    });
    // 🔴 END OF LOGGING

    // 🔹 نسوّق الداتا بشكل موحّد
    const graduateResults = graduates.map((grad) => ({
      id: grad.User.id,
      fullName: `${grad.User["first-name"]} ${grad.User["last-name"]}`,
      email: grad.User.email,
      faculty: grad.faculty,
      graduationYear: grad["graduation-year"],
      profilePicture: grad["profile-picture-url"],
      type: "graduate",
    }));

    const staffResults = staff.map((s) => ({
      id: s.User.id,
      fullName: `${s.User["first-name"]} ${s.User["last-name"]}`,
      email: s.User.email,
      faculty: null,
      graduationYear: null,
      profilePicture: null,
      type: "staff",
    }));

    // 🔹 نجمعهم
    const result = [...graduateResults, ...staffResults];

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Formatted search results", {
      formattedResultsCount: result.length,
      queryTime: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [searchUsers] END SUCCESS -----", {
      resultsCount: result.length,
      query,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: result,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [searchUsers] Unexpected Error", {
      query: req.query.q,
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const addUsersToGroup = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [addUsersToGroup] START -----", {
    timestamp: new Date().toISOString(),
    groupId: req.body.groupId,
    userIds: req.body.userIds,
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });
  // 🔴 END OF LOGGING

  try {
    const { groupId, userIds } = req.body;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Add users to group request details", {
      groupId,
      userIds,
      userIdsCount: Array.isArray(userIds) ? userIds.length : 1,
      userIp: req.ip,
    });
    // 🔴 END OF LOGGING

    if (!groupId || !userIds) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Missing parameters in addUsersToGroup", {
        hasGroupId: !!groupId,
        hasUserIds: !!userIds,
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "fail",
        message: "groupId and userIds are required",
      });
    }

    // نتأكد إنها Array حتى لو اليوزر بعت ID واحد
    const usersArray = Array.isArray(userIds) ? userIds : [userIds];

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Processing users for group", {
      groupId,
      usersCount: usersArray.length,
      usersArray,
    });
    // 🔴 END OF LOGGING

    const added = [];
    const skipped = [];

    for (let userId of usersArray) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Processing user for group membership", {
        groupId,
        userId,
        iteration: usersArray.indexOf(userId) + 1,
      });
      // 🔴 END OF LOGGING

      // نحاول نضيفه لو مش موجود
      const [member, created] = await GroupMember.findOrCreate({
        where: { "group-id": groupId, "user-id": userId },
        defaults: { "group-id": groupId, "user-id": userId },
      });

      if (created) {
        // ✅ اتضاف جديد → هاته بتفاصيله
        const user = await User.findByPk(userId, {
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
        });

        // 🔴 START OF LOGGING - ADDED THIS
        logger.info("User added to group", {
          groupId,
          userId,
          userName: user
            ? `${user["first-name"]} ${user["last-name"]}`
            : "Unknown",
        });
        // 🔴 END OF LOGGING

        added.push({
          id: user.id,
          fullName: `${user["first-name"]} ${user["last-name"]}`,
          email: user.email,
          type: user["user-type"],
        });
      } else {
        // ⚠️ موجود قبل كده → نحطه في skipped
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("User already in group, skipping", { groupId, userId });
        // 🔴 END OF LOGGING
        skipped.push(userId);
      }
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Users to group operation completed", {
      groupId,
      addedCount: added.length,
      skippedCount: skipped.length,
      addedUsers: added.map((u) => u.fullName),
      skippedUserIds: skipped,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [addUsersToGroup] END SUCCESS -----", {
      groupId,
      addedCount: added.length,
      skippedCount: skipped.length,
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: "success",
      message: "Users processed successfully",
      data: { added, skipped },
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [addUsersToGroup] Unexpected Error", {
      groupId: req.body.groupId,
      userIds: req.body.userIds,
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

module.exports = {
  searchUsers,
  addUsersToGroup,
};
