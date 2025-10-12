'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableDescription = await queryInterface.describeTable('Chat').catch(() => null);
    
    if (tableDescription) {
      console.log('Chat table already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('Chat', {
      chat_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user1_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      user2_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      last_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Message', key: 'message_id' }
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      user1_unread_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      user2_unread_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('Chat', ['user1_id', 'user2_id'], {
        unique: true,
        name: 'chat_users_unique'
      });
    } catch (error) {
      console.log('Index chat_users_unique already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Chat', ['user1_id']);
    } catch (error) {
      console.log('Index on user1_id already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Chat', ['user2_id']);
    } catch (error) {
      console.log('Index on user2_id already exists or error:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Chat');
  }
};
