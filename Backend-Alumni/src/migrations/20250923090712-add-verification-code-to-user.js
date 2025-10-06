'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('User', 'verification-code', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('User', 'verification-code-expires', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('User', 'verification-code');
    await queryInterface.removeColumn('User', 'verification-code-expires');
  }
};
