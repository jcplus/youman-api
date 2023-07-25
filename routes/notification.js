const express = require('express');
const router = express.Router();

// 中间件
const auth = require('../config/auth');
const {query} = require('express-validator');
const validationHandler = require('../config/validationHandler');

// 模型
const CommentComment = require('../models/CommentComment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// 移动常数变量到文件的开头
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10);


/**
 * GET /
 * Get unread notifications
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.get('/',
	auth,
	query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
	validationHandler,
	async (req, res, next) => {
		const {userId} = req;
		let {page} = req.query;
		if (!page) page = 1;
		const offset = (page - 1) * ITEMS_PER_PAGE;

		try {
			const results = await Notification.findAll({
				where: {
					user_id: userId,
					is_read: 0,
				},
				offset: offset,
				order: [['created_at', 'DESC']],
			});

			const notifications = results.map(async result => {
				const notification = {
					id: result.id,
					message: result.action_message,
					timestamp: result.createdAt,
				};

				switch (result.action_type) {
					case 'comment_a_comment':
						const comment = await CommentComment.getByIds([result.action_type_id], userId);
						notification.comment = comment;
						break;
					case 'liked_a_post':
						const posts = await Post.findByIds([result.action_type_id], userId);
						if (posts.length) notification.post = posts[0];
						break;
				}

				return notification;
			});
			res.status(200).send({data: notifications, code: 200});
		} catch (error) {
			next(error);
		}
	}
);

module.exports = router;
