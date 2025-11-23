"use strict";

const { QueryTypes } = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. أولاً اضيف الحقول بـ allowNull: true
    await queryInterface.addColumn("Group", "faculty_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Group", "graduation_year", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 2. املأ البيانات الفارغة
    await queryInterface.sequelize.query(
      `
      UPDATE "Group" 
      SET 
        faculty_code = 'GENERAL',
        graduation_year = EXTRACT(YEAR FROM COALESCE("created-date", NOW()))
      WHERE faculty_code IS NULL OR graduation_year IS NULL;
    `,
      { type: QueryTypes.UPDATE }
    );

    // 3. غير الحقول لـ allowNull: false
    await queryInterface.changeColumn("Group", "faculty_code", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "GENERAL",
    });

    await queryInterface.changeColumn("Group", "graduation_year", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2023,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Group", "faculty_code");
    await queryInterface.removeColumn("Group", "graduation_year");
  },
};
