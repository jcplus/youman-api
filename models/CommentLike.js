const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

class CommentLike extends Model {
}

CommentLike.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
		comment_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'CommentLike',
		tableName: 'comment_likes',
		timestamps: true,
		underscored: true,
	}
);

module.exports = CommentLike;
