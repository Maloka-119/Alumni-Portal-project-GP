const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Graduate = require("./Graduate");
const Staff = require("./Staff");
const { DOCUMENT_CODES } = require("../constants/documentTypes");

const DocumentRequest = sequelize.define(
  "DocumentRequest",
  {
    document_request_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

   
    request_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, 
    },

    graduate_id: {
      type: DataTypes.INTEGER,
      references: { model: Graduate, key: "graduate_id" },
      allowNull: false,
    },

    staff_id: {
      type: DataTypes.INTEGER,
      references: { model: Staff, key: "staff_id" },
      allowNull: true, 
    },

  
    "request-type": {
      type: DataTypes.ENUM(...DOCUMENT_CODES),
      allowNull: false,
      field: "request-type", 
    },

  
    language: {
      type: DataTypes.ENUM("ar", "en"),
      defaultValue: "ar",
      allowNull: false,
    },

   
    status: {
      type: DataTypes.ENUM(
        "pending", 
        "under_review", 
        "approved", 
        "ready_for_pickup", 
        "completed", 
        "cancelled" 
      ),
      defaultValue: "pending",
      allowNull: false,
    },

   
    attachments: {
      type: DataTypes.JSON,
      defaultValue: null,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("attachments");
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue("attachments", value ? JSON.stringify(value) : null);
      },
    },

    
    national_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

  
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

  
    expected_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    
    actual_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  
    "created-at": {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created-at",
    },

  
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "DocumentRequest",
    timestamps: false, 
    paranoid: false, 
  }
);


DocumentRequest.belongsTo(Graduate, { foreignKey: "graduate_id" });
DocumentRequest.belongsTo(Staff, { foreignKey: "staff_id" });
Graduate.hasMany(DocumentRequest, { foreignKey: "graduate_id" });
Staff.hasMany(DocumentRequest, { foreignKey: "staff_id" });


DocumentRequest.beforeCreate(async (documentRequest, options) => {
  if (!documentRequest.request_number) {
    const year = new Date().getFullYear();
    const prefix = "DR";

    
    const lastRequest = await DocumentRequest.findOne({
      order: [["document_request_id", "DESC"]],
      attributes: ["request_number"],
    });

    let nextNumber = 1;
    if (lastRequest && lastRequest.request_number) {
      const matches = lastRequest.request_number.match(/(\d+)$/);
      if (matches) {
        nextNumber = parseInt(matches[0]) + 1;
      }
    }

  
    documentRequest.request_number = `${prefix}-${year}-${nextNumber
      .toString()
      .padStart(3, "0")}`;
  }


  try {
    const documentType = require("../constants/documentTypes").getDocumentByCode(
      documentRequest["request-type"]
    );
    if (documentType && documentType.base_processing_days) {
      const expectedDate = new Date();
      expectedDate.setDate(
        expectedDate.getDate() + documentType.base_processing_days
      );
      documentRequest.expected_completion_date = expectedDate;
    }
  } catch (err) {
    console.error("Error in beforeCreate hook when getting document type:", err);
    
  }
});


DocumentRequest.beforeUpdate((documentRequest, options) => {
  documentRequest.updated_at = new Date();
});

module.exports = DocumentRequest;
