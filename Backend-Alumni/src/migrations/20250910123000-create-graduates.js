'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Graduate', {
      graduate_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'User', // اسم جدول اليوزر
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bio: {
        type: Sequelize.STRING,
        allowNull: true
      },
      'linkedln-link': {
        type: Sequelize.STRING,
        allowNull: true
      },
      'current-job': {
        type: Sequelize.STRING,
        allowNull: true
      },
      'cv-url': {
        type: Sequelize.STRING,
        allowNull: true
      },
      faculty: {
        type: Sequelize.STRING,
        allowNull: true
      },
      'profile-picture-url': {
        type: Sequelize.STRING,
        allowNull: true
      },
      'graduation-year': {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      skills: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Graduate');
  }
};
