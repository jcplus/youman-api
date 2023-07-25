const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class CommentComment extends Model {
}

CommentComment.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false
	},
	comment_id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false
	},
	content: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	status: {
		type: DataTypes.ENUM('published', 'draft', 'suspended', 'deleted'),
		defaultValue: 'draft'
	},
	is_deleted: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false,
		defaultValue: 0
	},
}, {
	sequelize,
	modelName: 'CommentComment',
	tableName: 'comment_comments',
	timestamps: true,
	underscored: true
});

CommentComment.getByIds = async function (ids, currentUserId) {
	const comments = await this.findAll({
		where: {
			id: ids,
			is_deleted: 0
		},
		include: [
			{
				model: User,
				attributes: ['id', 'name', 'avatar', 'is_vip'],
			}
		]
	});

	// Remap the array so each comment has a author property
	for (let comment of comments) {
		comment.dataValues.author = comment.User;
		delete comment.dataValues.User;
		comment.dataValues.author.is_followed = await comment.dataValues.author.isFollowedby(currentUserId);
	}

	return comments;
};

CommentComment.getCommentsRecursive = async function (commentId, page = 1, processed = new Set()) {
	if (processed.has(commentId)) {
		return [];
	}
	processed.add(commentId);

	const limit = 10;
	const offset = (page - 1) * limit;

	const comments = await this.findAll({
		where: {
			comment_id: commentId,
			is_deleted: 0,
		},
		attributes: ['id', 'content', 'created_at'],
		include: {
			model: User,
			attributes: ['id', 'avatar', 'name'],
		},
		limit: limit,
		offset: offset,
		order: [['created_at', 'DESC']],
	});

	for (const comment of comments) {
		comment.dataValues.comments = await this.getCommentsRecursive(comment.id, page, processed);
	}
	return comments;
};


module.exports = CommentComment;
