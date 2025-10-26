'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comment', 'parent-comment-id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Comment',
        key: 'comment_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Don't delete replies when parent is deleted
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Comment', 'parent-comment-id');
  }
};
