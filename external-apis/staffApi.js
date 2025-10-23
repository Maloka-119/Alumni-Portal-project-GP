// staffApi.js
const express = require("express");
const app = express();
app.use(express.json());

// Mock Database
const staff = [
  { nationalId: "30003151234577", department: "Computer Science" }, // 2000-03-15
  { nationalId: "30104161234578", department: "Mathematics" },     // 2001-04-16
  { nationalId: "30005271234579", department: "Physics" },         // 2000-05-27
  { nationalId: "30106301234580", department: "Chemistry" },       // 2001-06-30
  { nationalId: "30007411234581", department: "Biology" },         // 2000-07-04
  { nationalId: "30108521234582", department: "English" },         // 2001-08-05
  { nationalId: "30009631234583", department: "History" },         // 2000-09-06
  { nationalId: "30110741234584", department: "Geography" },       // 2001-10-07
  { nationalId: "30011821234585", department: "Economics" },       // 2000-11-18
  { nationalId: "30112911234586", department: "Philosophy" },      // 2001-12-29
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
