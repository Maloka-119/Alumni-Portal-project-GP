const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FAQ = sequelize.define('FAQ', {
  faq_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  question: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  answer: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  order: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    defaultValue: 0
  },
  category: { 
    type: DataTypes.STRING, 
    allowNull: true,
    defaultValue: 'General'
  },
  is_active: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false,
    defaultValue: true
  },
  created_by: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'User', key: 'id' }
  },
  updated_by: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: { model: 'User', key: 'id' }
  },
  'created-at': { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  'updated-at': { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, { 
  tableName: 'FAQ', 
  timestamps: false 
});

// Define associations
FAQ.associate = function(models) {
  FAQ.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  FAQ.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
};

module.exports = FAQ;
