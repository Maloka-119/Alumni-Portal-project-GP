const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Post = require("../models/Post");

const getAllUsers = async (req, res) => {
  try {
    // هات الخريجين مع بيانات اليوزر الأساسية
    const graduates = await Graduate.findAll({
      include: {
        model: User,
        attributes: ["first-name", "last-name", "national-id"],
      },
      attributes: ["graduation-year"],
    });

    // هات الموظفين مع بيانات اليوزر الأساسية
    const staff = await Staff.findAll({
      include: {
        model: User,
        attributes: ["first-name", "last-name"],
      },
      attributes: ["staff_id", "status-to-login"],
    });

    // تنسيق بيانات الخريجين
    const formattedGraduates = graduates.map((g) => ({
      ...g.dataValues,
      name: `${g.User["first-name"]} ${g.User["last-name"]}`,
      "national-id": g.User["national-id"],
      "graduation-year": g["graduation-year"],
      // إزالة كائن User إذا لم تكن بحاجة إليه
    }));

    // تنسيق بيانات الموظفين
    const formattedStaff = staff.map((s) => ({
      ...s.dataValues,
      name: `${s.User["first-name"]} ${s.User["last-name"]}`,
      staff_id: s["staff_id"],
      "status-to-login": s["status-to-login"],
      // إزالة كائن User إذا لم تكن بحاجة إليه
    }));

    return res.status(200).json({
      status: "success",
      message: "All users fetched successfully",
      data: {
        graduates: formattedGraduates,
        staff: formattedStaff,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Error fetching users",
      data: [],
    });
  }
};

module.exports = {
  getAllUsers,
};
