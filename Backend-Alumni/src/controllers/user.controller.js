const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Post = require("../models/Post");
const GroupMember = require("../models/GroupMember");
const { Op } = require("sequelize");

// const searchUsers = async (req, res) => {
//   try {
//     const query = req.query.q || "";

//     // 🔹 هات الخريجين
//     const graduates = await Graduate.findAll({
//       include: [
//         {
//           model: User,
//           attributes: ["id", "first-name", "last-name", "email", "user-type"],
//           where: {
//             "user-type": "graduate", // ✅ نتأكد إنهم خريجين
//             [Op.or]: [
//               { "first-name": { [Op.iLike]: `%${query}%` } },
//               { "last-name": { [Op.iLike]: `%${query}%` } },
//               { email: { [Op.iLike]: `%${query}%` } },
//             ],
//           },
//         },
//       ],
//       attributes: ["faculty", "graduation-year", "profile-picture-url"],
//     });

//     // 🔹 هات الاستاف
//     const staff = await Staff.findAll({
//       include: [
//         {
//           model: User,
//           attributes: ["id", "first-name", "last-name", "email", "user-type"],
//           where: {
//             "user-type": "staff", // ✅ نتأكد إنهم استاف
//             [Op.or]: [
//               { "first-name": { [Op.iLike]: `%${query}%` } },
//               { "last-name": { [Op.iLike]: `%${query}%` } },
//               { email: { [Op.iLike]: `%${query}%` } },
//             ],
//           },
//         },
//       ],
//       attributes: ["status-to-login"],
//     });

//     // 🔹 نسوّق الداتا بشكل موحّد
//     const graduateResults = graduates.map((grad) => ({
//       id: grad.User.id,
//       fullName: `${grad.User["first-name"]} ${grad.User["last-name"]}`,
//       email: grad.User.email,
//       faculty: grad.faculty,
//       graduationYear: grad["graduation-year"],
//       profilePicture: grad["profile-picture-url"],
//       type: "graduate",
//     }));

//     const staffResults = staff.map((s) => ({
//       id: s.User.id,
//       fullName: `${s.User["first-name"]} ${s.User["last-name"]}`,
//       email: s.User.email,
//       faculty: null,
//       graduationYear: null,
//       profilePicture: null,
//       type: "staff",
//     }));

//     // 🔹 نجمعهم
//     const result = [...graduateResults, ...staffResults];

//     return res.status(200).json({
//       status: "success",
//       message: "Users fetched successfully",
//       data: result,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       status: "error",
//       message: err.message,
//       data: [],
//     });
//   }
// };
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";

    // لو الكويري رقم (ID) ولا نص
    const isNumeric = !isNaN(query);

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

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const addUsersToGroup = async (req, res) => {
  try {
    const { groupId, userIds } = req.body;

    if (!groupId || !userIds) {
      return res.status(400).json({
        status: "fail",
        message: "groupId and userIds are required",
      });
    }

    // نتأكد إنها Array حتى لو اليوزر بعت ID واحد
    const usersArray = Array.isArray(userIds) ? userIds : [userIds];

    const added = [];
    const skipped = [];

    for (let userId of usersArray) {
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
        added.push({
          id: user.id,
          fullName: `${user["first-name"]} ${user["last-name"]}`,
          email: user.email,
          type: user["user-type"],
        });
      } else {
        // ⚠️ موجود قبل كده → نحطه في skipped
        skipped.push(userId);
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Users processed successfully",
      data: { added, skipped },
    });
  } catch (err) {
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
