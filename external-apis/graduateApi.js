// graduateApi.js
const express = require("express");
const app = express();
app.use(express.json());

// Mock Database
const graduates = [
  {
    nationalId: "30001011234567",
    "birth-date": "2000-01-01",
    faculty: "كلية الهندسة بحلوان", // Arabic
    "graduation-year": 2022,
  },
  {
    nationalId: "29905151234568",
    "birth-date": "1999-05-15",
    faculty: "Faculty of Commerce & Business Administration", // English
    "graduation-year": 2021,
  },
  {
    nationalId: "30209101234569",
    "birth-date": "2002-09-10",
    faculty: "كلية الحاسبات والذكاء الاصطناعي", // Arabic
    "graduation-year": 2026,
  },
  {
    nationalId: "30212051234570",
    "birth-date": "2002-12-05",
    faculty: "Faculty of Arts", // English
    "graduation-year": 2024,
  },
  {
    nationalId: "30107081234571",
    "birth-date": "2001-07-08",
    faculty: "كلية الحقوق", // Arabic
    "graduation-year": 2023,
  },
  {
    nationalId: "30003231234572",
    "birth-date": "2000-03-23",
    faculty: "Faculty of Medicine", // English
    "graduation-year": 2025,
  },
  {
    nationalId: "30204151234573",
    "birth-date": "2002-04-15",
    faculty: "كلية العلوم", // Arabic
    "graduation-year": 2024,
  },
  {
    nationalId: "29911251234574",
    "birth-date": "1999-11-25",
    faculty: "Faculty of Education", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30106021234575",
    "birth-date": "2001-06-02",
    faculty: "كلية التجارة وإدارة الأعمال", // Arabic
    "graduation-year": 2022,
  },
  {
    nationalId: "30208281234576",
    "birth-date": "2002-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2026,
  },
  {
    nationalId: "30208281234578",
    "birth-date": "2002-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234579",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234580",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234581",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234582",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234583",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234593",
    "birth-date": "2003-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2020,
  },
  {
    nationalId: "30208281234594",
    "birth-date": "2004-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2022,
  },
  {
    nationalId: "30208281234595",
    "birth-date": "2004-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2022,
  },
  {
    nationalId: "30208281234596",
    "birth-date": "2004-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2022,
  },
  {
    nationalId: "30208281234597",
    "birth-date": "2004-08-28",
    faculty: "Faculty of Engineering (Helwan)", // English
    "graduation-year": 2022,
  },
];

// GET graduate by nationalId
app.get("/api/graduate", (req, res) => {
  const { nationalId } = req.query;
  const graduate = graduates.find((g) => g.nationalId === nationalId);

  if (graduate) {
    res.json(graduate);
  } else {
    res.status(404).json({ message: "Graduate not found" });
  }
});

app.listen(5001, () => console.log("Graduate API running on port 5001"));
