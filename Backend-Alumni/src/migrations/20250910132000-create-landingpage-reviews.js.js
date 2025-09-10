'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LandingPageReview', {
      landing_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'LandingPage', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      review_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Review', key: 'review_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LandingPageReview');
  }
};
