'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Like', {
      like_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      'post-id': {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Post', key: 'post_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      'user-id': {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Like');
  }
};
