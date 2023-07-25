const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

class ErrorLog extends Model {
}

ErrorLog.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		primaryKey: true,
		autoIncrement: true
	},
	message: {
		type: DataTypes.TEXT,
		allowNull: false,
		defaultValue: ''
	},
	stack: {
		type: DataTypes.TEXT,
		allowNull: true
	}
}, {
	sequelize,
	modelName: 'ErrorLog',
	tableName: 'error_logs',
	timestamps: true,
	underscored: true,
});

module.exports = ErrorLog;
