'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'linkedin_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('User', 'linkedin_access_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'linkedin_refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'linkedin_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'profile_picture_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'linkedin_profile_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'linkedin_headline', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'linkedin_location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('User', 'auth_provider', {
      type: Sequelize.ENUM('local', 'linkedin'),
      defaultValue: 'local'
    });

    await queryInterface.addColumn('User', 'is_linkedin_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('User', 'linkedin_id');
    await queryInterface.removeColumn('User', 'linkedin_access_token');
    await queryInterface.removeColumn('User', 'linkedin_refresh_token');
    await queryInterface.removeColumn('User', 'linkedin_token_expires_at');
    await queryInterface.removeColumn('User', 'profile_picture_url');
    await queryInterface.removeColumn('User', 'linkedin_profile_url');
    await queryInterface.removeColumn('User', 'linkedin_headline');
    await queryInterface.removeColumn('User', 'linkedin_location');
    await queryInterface.removeColumn('User', 'auth_provider');
    await queryInterface.removeColumn('User', 'is_linkedin_verified');
  }
};
