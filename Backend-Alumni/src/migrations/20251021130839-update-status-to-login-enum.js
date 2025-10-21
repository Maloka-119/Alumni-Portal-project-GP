module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Graduate", "status-to-login", {
      type: Sequelize.ENUM("active", "inactive", "rejected"),
      allowNull: false,
      defaultValue: "inactive",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Graduate", "status-to-login", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    });
  },
};
