const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const {body, param, query} = require('express-validator');
const validationHandler = require('../config/validationHandler');
const Post = require('../models/Post');
const PostCategory = require('../models/PostCategory');
const dotenv = require('dotenv');
dotenv.config();

router.get('/categories', async function (req, res, next) {
	try {
		let categories = await PostCategory.findAll({
			attributes: ['id', 'name']
		});
		res.status(200).json({data: categories, code: 200});
	} catch (err) {
		// 错误处理
		res.status(500).json({errors: ['服务器错误'], code: 500});
	}
});

router.post('/',
	auth,
	body('postId').optional().isInt({min: 1}).withMessage('postId必须是大于0的整数'),
	body('title').isLength({min: 8, max: 20}).withMessage('title最少需要8个字符或者最多20个字符'),
	body('type').isInt({min: 1}).withMessage('type必须是大于0的整数'),
	body('categories').isArray().withMessage('categories必须是一个数组'),
	body('categories.*').isInt({min: 1}).withMessage('categories数组中的每个项必须是大于0的整数'),
	validationHandler,
	async function (req, res) {
		try {
			const payload = req.body;
			payload.postId = req.body.postId;
			payload.userId = req.userId;
			const post = await Post.createOrUpdate(req.body);
			res.status(200).json({post, code: 200});
		} catch (err) {
			res.status(500).json({error: [err.message], code: 500});
		}
	}
);

/**
 * 获取指定ID的笔记
 */
router.get('/',
	auth,
	query('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数'),
	validationHandler,
	async function (req, res) {
		try {
			const {postId} = req.query;
			const posts = await Post.findByIds([postId], req.userId);

			// 如果找不到，返回404
			if (!posts || !posts.length) {
				return res.status(404).json({errors: ['找不到笔记'], code: 404});
			}
			return res.status(200).json({data: posts[0], code: 200});
		} catch (error) {
			// 如果在过程中有任何错误，返回500错误和错误信息
			return res.status(500).json({errors: [error.message], code: 500});
		}
	}
);

router.delete('/',
	auth,
	query('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数'),
	validationHandler,
	async function (req, res) {
		try {
			const {postId} = req.query;
			const post = await Post.findByPk(postId);

			// 如果找不到，返回404
			if (!post) {
				return res.status(404).json({errors: ['找不到该笔记'], code: 404});
			}

			// 执行删除操作
			await post.destroy();

			// 返回删除成功的消息
			return res.status(200).json({message: '删除成功', code: 200});
		} catch (error) {
			// 如果在过程中有任何错误，返回500错误和错误信息
			return res.status(500).json({errors: [error.message], code: 500});
		}
	}
);

module.exports = router;