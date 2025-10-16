// graduateApi.js
const express = require("express");
const app = express();
app.use(express.json());

// Mock Database
const graduates = [
  {
    nationalId: "12345678901234",
    "birth-date": "2000-01-01",
    faculty: "Engineering",
    "graduation-year": 2022
  },
  {
    nationalId: "23456789012345",
    "birth-date": "1999-05-15",
    faculty: "Commerce",
    "graduation-year": 2021
  },
  {
    nationalId: "30278371927389",
    "birth-date": "2002-09-10",
    faculty: "CS",
    "graduation-year": 2026
  },
    {
    nationalId: "40278371927389",
    "birth-date": "2002-09-10",
    faculty: "CS",
    "graduation-year": 2026
  },
];


// GET graduate by nationalId and birthDate
app.get("/api/graduate", (req, res) => {
  const { nationalId } = req.query;
  const graduate = graduates.find(
    g => g.nationalId === nationalId 
  );

  if (graduate) {
    res.json(graduate);
  } else {
    res.status(404).json({ message: "Graduate not found" });
  }
});

app.listen(5001, () => console.log("Graduate API running on port 5001"));
