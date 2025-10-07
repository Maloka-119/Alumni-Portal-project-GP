'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PostCategory', {
      category_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Insert default categories
    await queryInterface.bulkInsert('PostCategory', [
      {
        name: 'General',
        description: 'General posts and announcements',
        is_default: true,
        'created-at': new Date(),
        'updated-at': new Date()
      },
      {
        name: 'Event',
        description: 'Events and activities',
        is_default: false,
        'created-at': new Date(),
        'updated-at': new Date()
      },
      {
        name: 'Job opportunity',
        description: 'Job opportunities and career updates',
        is_default: false,
        'created-at': new Date(),
        'updated-at': new Date()
      },
      {
        name: 'News',
        description: 'News and updates',
        is_default: false,
        'created-at': new Date(),
        'updated-at': new Date()
      },
      {
        name: 'Internship',
        description: 'Internship opportunities',
        is_default: false,
        'created-at': new Date(),
        'updated-at': new Date()
      },
      {
        name: 'Success story',
        description: 'Success stories and achievements',
        is_default: false,
        'created-at': new Date(),
        'updated-at': new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PostCategory');
  }
};
