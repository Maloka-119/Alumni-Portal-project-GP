'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // إضافة العمود مباشرة كـ ENUM، مع تجنب حذف العمود القديم
    await queryInterface.addColumn('"Post"', '"category"', {
      type: Sequelize.ENUM(
        "Event",
        "Job opportunity",
        "News",
        "Internship",
        "Success story",
        "General"
      ),
      allowNull: false,
      defaultValue: "General",
    });
  },

  async down(queryInterface, Sequelize) {
    // إزالة العمود عند التراجع
    await queryInterface.removeColumn('"Post"', '"category"');
  },
};
