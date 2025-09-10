const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    // هات الخريجين مع بيانات اليوزر الأساسية
    const graduates = await Graduate.findAll({
      include: {
        model: User,
        attributes: ["name", "national-id", "digital-id", "status"],
      },
      attributes: ["graduation-year"],
    });

    // هات الموظفين مع بيانات اليوزر الأساسية
    const staff = await Staff.findAll({
      include: {
        model: User,
        attributes: ["name", "status"],
      },
      attributes: ["staff-id", "role"],
    });

    return res.status(200).json({
      status: "success",
      message: "All users fetched successfully",
      data: {
        graduates,
        staff,
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
