const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Graduate = require('./Graduate');
const Staff = require('./Staff');

const DocumentRequest = sequelize.define('DocumentRequest', {
  document_request_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  graduate_id: { type: DataTypes.INTEGER, references: { model: Graduate, key: 'graduate_id' } },
  staff_id: { type: DataTypes.INTEGER, references: { model: Staff, key: 'staff_id' } },
  'request-type': { type: DataTypes.STRING },
  sub_type: { type: DataTypes.STRING },
  'required-info': { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('completed','in prograss') },
  'created-at': { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'DocumentRequest', timestamps: false });

DocumentRequest.belongsTo(Graduate, { foreignKey: 'graduate_id' });
DocumentRequest.belongsTo(Staff, { foreignKey: 'staff_id' });
module.exports = DocumentRequest;
