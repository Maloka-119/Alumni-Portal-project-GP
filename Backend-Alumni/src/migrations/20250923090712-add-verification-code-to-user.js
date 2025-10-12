'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('User');
    
    if (!tableDescription['verification-code']) {
      await queryInterface.addColumn('User', 'verification-code', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription['verification-code-expires']) {
      await queryInterface.addColumn('User', 'verification-code-expires', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('User', 'verification-code');
    await queryInterface.removeColumn('User', 'verification-code-expires');
  }
};
