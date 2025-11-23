"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // تحقق إذا الحقل موجود أصلاً
    const tableInfo = await queryInterface.describeTable("Graduate");

    if (!tableInfo.faculty_code) {
      await queryInterface.addColumn("Graduate", "faculty_code", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } else {
      console.log("✅ faculty_code موجود بالفعل - تم تخطي الإضافة");
    }
  },

  async down(queryInterface, Sequelize) {
    // لا تعمل شيء - احتفظ بالبيانات
  },
};
