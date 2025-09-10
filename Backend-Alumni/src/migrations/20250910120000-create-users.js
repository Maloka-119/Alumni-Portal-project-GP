'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('User', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      'first-name': { type: Sequelize.STRING },
      'last-name': { type: Sequelize.STRING },
      'national-id': { type: Sequelize.STRING, unique: true },
      email: { type: Sequelize.STRING, unique: true },
      'phone-number': { type: Sequelize.STRING },
      'hashed-password': { type: Sequelize.STRING },
      'birth-date': { type: Sequelize.DATE },
      'user-type': { type: Sequelize.ENUM('graduate', 'staff', 'admin') }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('User');
  }
};
