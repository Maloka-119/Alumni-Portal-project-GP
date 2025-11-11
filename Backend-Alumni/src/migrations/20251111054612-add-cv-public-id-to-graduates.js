module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Graduate', 'cv_public_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Graduate', 'cv_public_id');
  },
};
