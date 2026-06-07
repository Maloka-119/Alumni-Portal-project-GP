/**
 * Script to create missing Graduate records for existing LinkedIn users
 * Run this once to fix existing users: node fix-linkedin-graduates.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const sequelize = require("./src/config/db");
const { User, Graduate } = require("./src/models");

async function fixLinkedInGraduates() {
  try {
   

    // Find all users who:
    // 1. Are graduates
    // 2. Have LinkedIn authentication
    // 3. Don't have a Graduate record
    const usersWithoutGraduate = await User.findAll({
      where: {
        "user-type": "graduate",
        auth_provider: "linkedin",
      },
      include: [
        {
          model: Graduate,
          required: false, // LEFT JOIN
        },
      ],
    });

    // Filter users who don't have a Graduate record
    const usersToFix = usersWithoutGraduate.filter((user) => !user.Graduate);



    if (usersToFix.length === 0) {
  
      await sequelize.close();
      return;
    }

    // Create Graduate records for each user
    let created = 0;
    for (const user of usersToFix) {
      try {
        await Graduate.create({
          graduate_id: user.id,
          "status-to-login": "pending", // Requires admin approval
          bio: user.linkedin_headline || null,
          "profile-picture-url": user.profile_picture_url || null,
        });
        created++;
      
      } catch (error) {
        console.error(`❌ Error creating Graduate record for user ID ${user.id}:`, error.message);
      }
    }



    await sequelize.close();
  } catch (error) {
    console.error("❌ Error fixing LinkedIn graduates:", error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
fixLinkedInGraduates();

