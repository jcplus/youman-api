const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db.js');

class Transaction extends Model {
}

Transaction.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	type: {
		type: DataTypes.ENUM('cashout', 'recharge'),
		allowNull: false
	},
	amount: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false
	},
	status: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: 'pending'
	}
}, {
	sequelize,
	modelName: 'Transaction',
	timestamps: true,
	underscored: true
});

module.exports = Transaction;