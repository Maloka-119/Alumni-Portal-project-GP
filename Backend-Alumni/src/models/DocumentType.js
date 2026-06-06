const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { DOCUMENT_CODES } = require("../constants/documentTypes");

const DocumentType = sequelize.define(
  "DocumentType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

   
    document_code: {
      type: DataTypes.ENUM(...DOCUMENT_CODES),
      unique: true,
      allowNull: false,
    },

   
    fee_amount: {
      type: DataTypes.DECIMAL(10, 2), 
      defaultValue: 0.0,
      allowNull: false,
    },

   
    processing_days: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      allowNull: false,
      validate: {
        min: 1,
        max: 60,
      },
    },

   
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

   
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "DocumentType",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["document_code"],
      },
    ],
  }
);


DocumentType.beforeUpdate((documentType, options) => {
  documentType.updated_at = new Date();
});

module.exports = DocumentType;
