// middleware / authMiddleware.js;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// const authMiddleware = (req, res, next) => {
//   const token = req.headers["authorization"]?.split(" ")[1];
//   if (!token) {
// <<<<<<< HEAD
//     return res.status(401).json({ message: "Access denied. No token provided." });
// =======
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided." });
// >>>>>>> db8f7d0 (edit get all posts)
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(400).json({ message: "Invalid token" });
//   }
// };

// module.exports = authMiddleware;
