'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StaffRole', {
      staff_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Staff',
          key: 'staff_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Role',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addConstraint('StaffRole', {
      fields: ['staff_id', 'role_id'],
      type: 'primary key'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StaffRole');
  }
};