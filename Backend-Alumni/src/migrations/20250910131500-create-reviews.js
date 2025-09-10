'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Review', {
      review_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        type: Sequelize.STRING
      },
      'user-id': {
        type: Sequelize.INTEGER,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      'in-landing': {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Review');
  }
};
