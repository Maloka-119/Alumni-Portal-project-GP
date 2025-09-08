const Graduate = require('../models/Graduate');
const User = require('../models/User');
const HttpStatusHelper = require('../utils/HttpStatuHelper');

exports.getDigitalID = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.params.id, {
      include: [{ model: User }]
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null
      });
    }

    const user = graduate.User; 

    const digitalID = {
      digitalID: graduate.graduate_id,
      fullName: `${user['first-name']} ${user['last-name']}`,
      faculty: graduate.faculty,
      nationalNumber: user['national-id'],
      graduationYear: graduate['graduation-year']
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Digital ID fetched successfully",
      data: digitalID
    });

  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null
    });
  }
};
exports.getGraduateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.params.id, {
      include: [{ model: User }]
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null
      });
    }

    const user = graduate.User; 

    const graduatePfrofile = {
      profilePicture: graduate['profile-picture-url'],
      fullName: `${user['first-name']} ${user['last-name']}`,
      faculty: graduate.faculty,
      graduationYear: graduate['graduation-year'],
      bio:graduate.bio,
      CV:graduate['cv-url'],
      skills:graduate.skills,
      currentJob:graduate['current-job']
    
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: graduatePfrofile
    });

  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null
    });
  }
};
