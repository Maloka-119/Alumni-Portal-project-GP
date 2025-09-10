'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Permission', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      'can-view': {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      'can-edit': {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      'can-delete': {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Permission');
  }
};
