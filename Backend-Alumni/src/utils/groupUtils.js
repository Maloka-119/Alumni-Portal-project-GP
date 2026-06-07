const { Group } = require("../models");
const { Op } = require("sequelize"); 

const findMatchingGroup = async (faculty_code, graduation_year) => {
  try {

  


    const allGroups = await Group.findAll({
      attributes: ["id", "group-name", "faculty_code", "graduation_year"],
    });

    if (allGroups.length === 0) {
    
    } else {
  
      allGroups.forEach((group, index) => {

      });
    }

  


    const exactMatch = await Group.findOne({
      where: {
        faculty_code: faculty_code,
        graduation_year: graduation_year,
      },
    });

    if (exactMatch) {

      return exactMatch;
    }



    const sameFaculty = await Group.findOne({
      where: { faculty_code: faculty_code },
    });

    if (sameFaculty) {

      return sameFaculty;
    }


    
 
    const facultyNamePatterns = {
      'COMP_AI': ['Computers', 'Artificial Intelligence', 'حاسبات', 'كمبيوتر'],
      'ENG_MAT': ['Engineering', 'Mataria', 'هندسة', 'مطرية'],
      'SPEC_EDU': ['Specific Education', 'تربية', 'نوعية'],
      'NURS': ['Nursing', 'تمريض'],
    };
    
  
    const patterns = facultyNamePatterns[faculty_code] || [faculty_code];

    
    for (const pattern of patterns) {
      const groupByName = await Group.findOne({
        where: {
          [Op.or]: [
            { "group-name": { [Op.like]: `%${pattern}%` } },
          ],
        },
      });
      
      if (groupByName) {

        
      
        if (!groupByName.faculty_code) {
        
          groupByName.faculty_code = faculty_code;
          await groupByName.save();
 
        } else if (groupByName.faculty_code !== faculty_code) {
       
        
        }
        
        return groupByName;
      }
    }
    


    return null;
  } catch (error) {
    console.error("❌ Error in findMatchingGroup:", error);
    return null;
  }
};

module.exports = { findMatchingGroup };