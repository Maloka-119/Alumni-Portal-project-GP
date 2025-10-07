'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add the new category_id column
    await queryInterface.addColumn('Post', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'PostCategory',
        key: 'category_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Update existing posts to use the default category (General)
    await queryInterface.sequelize.query(`
      UPDATE Post 
      SET category_id = (
        SELECT category_id 
        FROM PostCategory 
        WHERE name = 'General' 
        LIMIT 1
      )
      WHERE category_id IS NULL
    `);

    // Make category_id NOT NULL after updating existing records
    await queryInterface.changeColumn('Post', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'PostCategory',
        key: 'category_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Remove the old category ENUM column
    await queryInterface.removeColumn('Post', 'category');
  },

  async down(queryInterface, Sequelize) {
    // Add back the category ENUM column
    await queryInterface.addColumn('Post', 'category', {
      type: Sequelize.ENUM(
        "Event",
        "Job opportunity",
        "News",
        "Internship",
        "Success story",
        "General"
      ),
      allowNull: false,
      defaultValue: "General"
    });

    // Update posts to use the category name from PostCategory
    await queryInterface.sequelize.query(`
      UPDATE Post 
      SET category = (
        SELECT name 
        FROM PostCategory 
        WHERE PostCategory.category_id = Post.category_id
      )
    `);

    // Remove the category_id foreign key column
    await queryInterface.removeColumn('Post', 'category_id');
  }
};
