'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableDescription = await queryInterface.describeTable('Message').catch(() => null);
    
    if (tableDescription) {
      console.log('Message table already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('Message', {
      message_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      chat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Chat', key: 'chat_id' }
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' }
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text'
      },
      attachment_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attachment_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attachment_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attachment_mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'read'),
        defaultValue: 'sent'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reply_to_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Message', key: 'message_id' }
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
      await queryInterface.addIndex('Message', ['chat_id']);
    } catch (error) {
      console.log('Index on chat_id already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Message', ['sender_id']);
    } catch (error) {
      console.log('Index on sender_id already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Message', ['receiver_id']);
    } catch (error) {
      console.log('Index on receiver_id already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Message', ['status']);
    } catch (error) {
      console.log('Index on status already exists or error:', error.message);
    }
    
    try {
      await queryInterface.addIndex('Message', ['created-at']);
    } catch (error) {
      console.log('Index on created-at already exists or error:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Message');
  }
};
