const Graduate = require('../models/Graduate');
const User = require('../models/User');
const HttpStatusHelper = require('../utils/HttpStatuHelper');

//with token 
const getDigitalID = async (req, res) => {
  try {
    const userId = req.user.id;  

    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
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
      personalPicture: graduate['profile-picture-url'],
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

// //with id without token 
// const getDigitalID = async (req, res) => {
//   try {
//     const graduate = await Graduate.findByPk(req.params.id, {
//       include: [{ model: User }]
//     });

//     if (!graduate) {
//       return res.status(404).json({
//         status: HttpStatusHelper.FAIL,
//         message: "Graduate not found",
//         data: null
//       });
//     }

//     const user = graduate.User; 

//     const digitalID = {
//       personalPicture:graduate['profile-picture-url'],
//       digitalID: graduate.graduate_id,
//       fullName: `${user['first-name']} ${user['last-name']}`,
//       faculty: graduate.faculty,
//       nationalNumber: user['national-id'],
//       graduationYear: graduate['graduation-year']
//     };

//     return res.json({
//       status: HttpStatusHelper.SUCCESS,
//       message: "Graduate Digital ID fetched successfully",
//       data: digitalID
//     });

//   } catch (err) {
//     return res.status(500).json({
//       status: HttpStatusHelper.ERROR || "error",
//       message: err.message,
//       data: null
//     });
//   }
// };
const getGraduateProfile = async (req, res) => {
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
      currentJob:graduate['current-job'],
      linkedlnLink:graduate["linkedln-link"]
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

//middleware for security
const updateProfile = async (req, res) => {
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
    const {
      firstName,
      lastName,
      bio,
      skills,
      currentJob,
      cvUrl,
      faculty,
      graduationYear,
      linkedlnLink,
    } = req.body;

    if (firstName !== undefined) user["first-name"] = firstName;
    if (lastName !== undefined) user["last-name"] = lastName;
    if (bio !== undefined) graduate.bio = bio;
    if (skills !== undefined) graduate.skills = skills;
    if (currentJob !== undefined) graduate["current-job"] = currentJob;
    if (cvUrl !== undefined) graduate["cv-url"] = cvUrl;
    if (faculty !== undefined) graduate.faculty = faculty;
    if (graduationYear !== undefined) graduate["graduation-year"] = graduationYear;
    if (linkedlnLink !== undefined) graduate["linkedln-link"] = linkedlnLink;

    //  لو فيه ملف صورة مرفوع
    if (req.file) {
      graduate["profile-picture-url"] = req.file.location; // location من S3
    }

    await user.save();
    await graduate.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate profile updated successfully",
      data: { graduate, user },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

// //نسخه بالid 
// const updateProfile = async (req, res) => {
//   try {
//     const graduate = await Graduate.findByPk(req.params.id, {
//       include: [{ model: User }],
//     });

//     if (!graduate) {
//       return res.status(404).json({
//         status: HttpStatusHelper.FAIL,
//         message: "Graduate not found",
//         data: null,
//       });
//     }

//     const user = graduate.User;

//     //  الداتا من الريكوست
//     const {
//       firstName,
//       lastName,
//       bio,
//       skills,
//       currentJob,
//       cvUrl,
//       faculty,
//       graduationYear,
//       profilePicture,
//       linkedlnLink,
//     } = req.body;

//     if (firstName !== undefined) user["first-name"] = firstName;
//     if (lastName !== undefined) user["last-name"] = lastName;
//     if (bio !== undefined) graduate.bio = bio;
//     if (skills !== undefined) graduate.skills = skills;
//     if (currentJob !== undefined) graduate["current-job"] = currentJob;
//     if (cvUrl !== undefined) graduate["cv-url"] = cvUrl;
//     if (faculty !== undefined) graduate.faculty = faculty;
//     if (graduationYear !== undefined) graduate["graduation-year"] = graduationYear;
//     if (profilePicture !== undefined) graduate["profile-picture-url"] = profilePicture;
//     if (linkedlnLink !== undefined) graduate["linkedln-link"] = linkedlnLink;

    
//     await user.save();
//     await graduate.save();

//     return res.json({
//       status: HttpStatusHelper.SUCCESS,
//       message: "Graduate profile updated successfully",
//       data: {
//         graduate,
//         user,
//       },
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: HttpStatusHelper.ERROR || "error",
//       message: err.message,
//       data: null,
//     });
//   }
// };

 module.exports={
  getDigitalID,
  getGraduateProfile,
  updateProfile
 
 }