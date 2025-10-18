'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // إزالة العمود linkedln-link من جدول Graduate
    await queryInterface.removeColumn('Graduate', 'linkedln-link');
  },

  down: async (queryInterface, Sequelize) => {
    // لو حبيت ترجعي العمود تاني
    await queryInterface.addColumn('Graduate', 'linkedln-link', {
      type: Sequelize.STRING,
      allowNull: true, // أو false حسب الإعداد السابق
    });
  }
};
