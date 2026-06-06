'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
   
    await queryInterface.changeColumn('User', 'national-id', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

   
    await queryInterface.sequelize.query(`
      UPDATE "User"
      SET "national-id" = NULL
      WHERE "national-id" = '[null]'
         OR "national-id" = '["null"]'
         OR "national-id" = '[]'
         OR "national-id" = '[""]'
         OR "national-id" IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
  
    await queryInterface.changeColumn('User', 'national-id', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true
    });
  }
};
