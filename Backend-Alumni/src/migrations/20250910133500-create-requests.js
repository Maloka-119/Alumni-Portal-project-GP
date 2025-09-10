'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Request', {
      request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      'request-type': {
        type: Sequelize.STRING
      },
      sub_type: {
        type: Sequelize.STRING
      },
      'required-info': {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('completed', 'in prograss')
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
      'created-at': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Request');
  }
};
