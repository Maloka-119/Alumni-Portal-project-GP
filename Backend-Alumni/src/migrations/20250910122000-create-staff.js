'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Staff', {
      staff_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      'status-to-login': {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Staff');
  }
};
