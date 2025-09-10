'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DocumentRequest', {
      document_request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      graduate_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Graduate', key: 'graduate_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      staff_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Staff', key: 'staff_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      'request-type': { type: Sequelize.STRING },
      sub_type: { type: Sequelize.STRING },
      'required-info': { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('completed','in prograss') },
      'created-at': { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DocumentRequest');
  }
};
