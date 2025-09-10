'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Comment', {
      comment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      content: { type: Sequelize.STRING },
      'post-id': {
        type: Sequelize.INTEGER,
        references: { model: 'Post', key: 'post_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      'author-id': {
        type: Sequelize.INTEGER,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      'created-at': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Comment');
  }
};
