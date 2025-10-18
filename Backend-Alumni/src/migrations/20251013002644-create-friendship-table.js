"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Friendship", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Graduate",
          key: "graduate_id",
        },
        onDelete: "CASCADE",
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Graduate",
          key: "graduate_id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("pending", "accepted"),
        defaultValue: "pending",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Friendship");
  },
};
