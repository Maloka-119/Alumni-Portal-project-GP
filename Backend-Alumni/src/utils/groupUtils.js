// utils/groupUtils.js
const { Group } = require("../models"); // ⬅️ المسار الصح

const findMatchingGroup = async (faculty_code, graduation_year) => {
  try {
    console.log(
      `🔍 البحث عن جروب للكلية: ${faculty_code} وسنة: ${graduation_year}`
    );

    // أولاً: بحث دقيق
    const exactMatch = await Group.findOne({
      where: {
        faculty_code: faculty_code,
        graduation_year: graduation_year,
      },
    });

    if (exactMatch) {
      console.log(`✅ وجد تطابق دقيق: ${exactMatch["group-name"]}`);
      return exactMatch;
    }

    console.log(`❌ مفيش تطابق دقيق، ببحث عن بدائل...`);

    // ثانياً: بحث عن جروب عام لنفس الكلية
    const sameFaculty = await Group.findOne({
      where: { faculty_code: faculty_code },
    });

    if (sameFaculty) {
      console.log(`✅ وجد جروب عام للكلية: ${sameFaculty["group-name"]}`);
      return sameFaculty;
    }

    // ثالثاً: بحث عن جروب GENERAL
    const generalGroup = await Group.findOne({
      where: { faculty_code: "GENERAL" },
    });

    if (generalGroup) {
      console.log(`✅ وجد جروب عام: ${generalGroup["group-name"]}`);
      return generalGroup;
    }

    console.log(`❌ مفيش أي جروب مناسبة`);
    return null;
  } catch (error) {
    console.error("❌ Error in findMatchingGroup:", error);
    return null;
  }
};

module.exports = { findMatchingGroup };
