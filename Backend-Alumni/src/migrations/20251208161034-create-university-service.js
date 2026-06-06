'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('university_services', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      pref: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
      
    });

   
    await queryInterface.addIndex('university_services', ['pref'], {
      unique: true,
      name: 'uniq_university_services_pref'
    });


    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE university_services
        ADD CONSTRAINT check_title_not_empty CHECK (title <> '');
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE university_services
        ADD CONSTRAINT check_pref_not_empty CHECK (pref <> '');
      `);
    } catch (e) {
     
      console.log('CHECK constraints skipped (probably using SQLite)');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('university_services');
  }
};
