// staffApi.js
const express = require("express");
const app = express();
app.use(express.json());

// Mock Database
const staff = [
{ nationalId: "30003150102341", department: "Computer Science" }, // 2000-03-15
{ nationalId: "30104160104562", department: "Mathematics" },     // 2001-04-16
{ nationalId: "30005270107893", department: "Physics" },         // 2000-05-27
{ nationalId: "30106300101254", department: "Chemistry" },       // 2001-06-30
{ nationalId: "30007040105678", department: "Biology" },         // 2000-07-04
{ nationalId: "30108050108912", department: "English" },         // 2001-08-05
{ nationalId: "30009060102345", department: "History" },         // 2000-09-06
{ nationalId: "30110070104561", department: "Geography" },       // 2001-10-07
{ nationalId: "30011180107892", department: "Economics" },       // 2000-11-18
{ nationalId: "30112290101253", department: "Philosophy" },      // 2001-12-29

];



app.get("/api/staff", (req, res) => {
  const { nationalId } = req.query;
  const staffMember = staff.find(s => s.nationalId === nationalId);

  if (staffMember) {
    res.json(staffMember);
  } else {
    res.status(404).json({ message: "Staff member not found" });
  }
});

app.listen(5002, () => console.log("Staff API running on port 5002"));
