'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Notification');
    
    // Add navigation column if it doesn't exist
    if (!tableDescription['navigation']) {
      await queryInterface.addColumn('Notification', 'navigation', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Notification');
    
    // Remove navigation column if it exists
    if (tableDescription['navigation']) {
      await queryInterface.removeColumn('Notification', 'navigation');
    }
  }
};

