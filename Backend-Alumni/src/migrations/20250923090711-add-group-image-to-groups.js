"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable("Group");
    
    if (!tableDescription["group-image"]) {
      await queryInterface.addColumn("Group", "group-image", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Group", "group-image");
  },
};
