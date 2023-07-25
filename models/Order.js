const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

class Order extends Model {}

// 定义Order模型
Order.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false
	},
	status: {
		type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
		defaultValue: 'pending',
		comment: '订单状态'
	},
	points: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		comment: '购买的点数'
	},
	total_fee: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		comment: '订单总金额，单位为分'
	},
	cash_fee: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		comment: '实际支付金额，单位为分'
	},
	is_subscribe: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: 0,
		comment: '用户是否关注公众号'
	},
	trade_type: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '交易类型，JSAPI表示公众号支付或小程序支付'
	},
	transaction_id: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '微信支付订单号'
	},
	bank_type: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '付款银行类型'
	},
	fee_type: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '货币类型，默认为人民币（CNY）'
	},
	wechat_timestamp: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: '微信的支付完成时间'
	},
}, {
	sequelize,
	modelName: 'Order',
	tableName: 'orders',
	timestamps: true,
	underscored: true,
});


const User = require('./User');
Order.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Order;
