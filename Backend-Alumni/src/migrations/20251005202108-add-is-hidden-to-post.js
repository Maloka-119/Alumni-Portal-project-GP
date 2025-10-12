"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Post");
    
    if (!tableDescription["is-hidden"]) {
      await queryInterface.addColumn("Post", "is-hidden", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Post", "is-hidden");
  },
};
