'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserBlock', {
      block_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blocker_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      blocked_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      'created-at': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique index
    await queryInterface.addIndex('UserBlock', ['blocker_id', 'blocked_id'], {
      unique: true,
      name: 'user_block_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserBlock');
  }
};
