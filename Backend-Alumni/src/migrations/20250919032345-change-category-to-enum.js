"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // نحذف العمود القديم
    await queryInterface.removeColumn("Post", "category");

    // نضيف العمود الجديد كـ ENUM
    await queryInterface.addColumn("Post", "category", {
      type: Sequelize.ENUM(
        "event",
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
    // لو رجعنا في الميجريشن هنحذف العمود ENUM
    await queryInterface.removeColumn("Post", "category");

    // نرجعه كـ string عادي
    await queryInterface.addColumn("Post", "category", {
      type: Sequelize.STRING,
    });
  },
};
