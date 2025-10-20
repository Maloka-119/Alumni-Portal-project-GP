'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // إضافة العمود الجديد
    await queryInterface.addColumn('Graduate', 'status-to-login', {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: true,
    });

    // حذف الأعمدة القديمة
    await queryInterface.removeColumn('Graduate', 'linkedln-link');
    await queryInterface.removeColumn('Graduate', 'show_linkedin');
  },

  async down(queryInterface, Sequelize) {
    // في حالة rollback
    await queryInterface.removeColumn('Graduate', 'status-to-login');
    
    await queryInterface.addColumn('Graduate', 'linkedln-link', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Graduate', 'show_linkedin', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
  }
};
