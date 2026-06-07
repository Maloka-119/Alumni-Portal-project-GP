"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
  
    const tableInfo = await queryInterface.describeTable("DocumentRequest");

    if (!tableInfo.request_number) {
      await queryInterface.addColumn("DocumentRequest", "request_number", {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
        defaultValue: null,
      });

      
      await queryInterface.addIndex("DocumentRequest", ["request_number"], {
        name: "document_request_request_number_idx",
        unique: true,
      });

    
    } else {
    
    }
  },

  down: async (queryInterface, Sequelize) => {
   
    await queryInterface.removeColumn("DocumentRequest", "request_number");
  
  },
};
