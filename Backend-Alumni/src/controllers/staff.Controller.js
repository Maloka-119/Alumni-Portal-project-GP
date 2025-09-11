// src/controllers/staff.controller.js
const Staff = require("../models/Staff");
const User = require("../models/User");
const HttpStatusHelper = require("../utils/HttpStatuHelper");

// suspend/activate staff
const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: "active" or "inactive"

    // validate
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Must be 'active' or 'inactive'.",
        data: null,
      });
    }

    // find staff
    const staff = await Staff.findByPk(id, { include: [{ model: User }] });

    if (!staff) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Staff not found",
        data: null,
      });
    }

    // update status
    staff["status-to-login"] = status;
    await staff.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Staff status updated to ${status} successfully`,
      data: {
        staffId: staff.staff_id,
        fullName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
        status: staff["status-to-login"],
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

module.exports = { updateStaffStatus };
