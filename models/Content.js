const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Content = sequelize.define('Content', {
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false,
		primaryKey: true,
		autoIncrement: true,
	},
	post_id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false,
	},
	content_type: {
		type: DataTypes.ENUM('image', 'video', 'voice'),
		allowNull: true,
	},
	content_value: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: true,
		defaultValue: DataTypes.NOW,
	},
	updated_at: {
		type: DataTypes.DATE,
		allowNull: true,
		defaultValue: DataTypes.NOW,
	},
}, {
	modelName: 'Content',
	tableName: 'contents',
	timestamps: true,
	createdAt: 'created_at',
	updatedAt: 'updated_at',
	underscored: true,
});

module.exports = Content;