'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check existing columns
    const tableDescription = await queryInterface.describeTable('FAQ');
    
    // Add new columns to FAQ table if they don't exist
    if (!tableDescription.order) {
      await queryInterface.addColumn('FAQ', 'order', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    if (!tableDescription.category) {
      await queryInterface.addColumn('FAQ', 'category', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'General'
      });
    }

    if (!tableDescription.is_active) {
      await queryInterface.addColumn('FAQ', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    if (!tableDescription.created_by) {
      await queryInterface.addColumn('FAQ', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    }

    if (!tableDescription.updated_by) {
      await queryInterface.addColumn('FAQ', 'updated_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    // Update existing FAQs to have default values
    await queryInterface.sequelize.query(`
      UPDATE "FAQ" 
      SET 
        "order" = 0,
        "category" = 'General',
        "is_active" = true,
        "created_by" = 1
      WHERE "created_by" IS NULL
    `);

    // Change question and answer to TEXT type for longer content
    await queryInterface.changeColumn('FAQ', 'question', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('FAQ', 'answer', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('FAQ', 'order');
    await queryInterface.removeColumn('FAQ', 'category');
    await queryInterface.removeColumn('FAQ', 'is_active');
    await queryInterface.removeColumn('FAQ', 'created_by');
    await queryInterface.removeColumn('FAQ', 'updated_by');

    // Revert question and answer to STRING
    await queryInterface.changeColumn('FAQ', 'question', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('FAQ', 'answer', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
