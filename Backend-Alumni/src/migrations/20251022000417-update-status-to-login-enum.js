module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Graduate", "status-to-login", {
      type: Sequelize.ENUM("accepted", "pending", "rejected"),
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Graduate", "status-to-login", {
      type: Sequelize.ENUM("active", "inactive", "rejected"),
      allowNull: false,
     
    });
  },
};
