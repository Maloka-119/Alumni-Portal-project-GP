// staffApi.js
const express = require("express");
const app = express();
app.use(express.json());

// Mock Database
const staff = [
  { nationalId: "98765432109876", department: "Computer Science" },
  { nationalId: "87654321098765", department: "Mathematics" },
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
