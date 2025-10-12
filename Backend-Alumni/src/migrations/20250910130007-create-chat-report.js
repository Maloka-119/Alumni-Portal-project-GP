'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ChatReport', {
      report_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      reported_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      chat_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Chat', key: 'chat_id' }
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Message', key: 'message_id' }
      },
      reason: {
        type: Sequelize.ENUM('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        defaultValue: 'pending'
      },
      admin_notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('ChatReport');
  }
};
