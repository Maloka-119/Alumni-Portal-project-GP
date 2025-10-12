'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserPresence', {
      presence_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'User', key: 'id' }
      },
      status: {
        type: Sequelize.ENUM('online', 'offline', 'away', 'busy'),
        defaultValue: 'offline'
      },
      last_seen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      socket_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      'created-at': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      'updated-at': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserPresence');
  }
};
