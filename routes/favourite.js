const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const {body, query} = require('express-validator');
const validationHandler = require('../config/validationHandler');
const Favourite = require('../models/Favourite');
const Post = require('../models/Post');

// 添加收藏
router.post('/',
    auth,
    body('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const {postId} = req.body;

            const post = await Post.findByPk(postId);
            if (!post) {
                return res.status(404).json({errors: ['该笔记不存在'], code: 404});
            }

            await Favourite.findOrCreate({where: {user_id: req.userId, post_id: postId}});
            res.status(200).json({code: 200});
        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

// 删除收藏
router.delete('/',
    auth,
    body('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const {postId} = req.body;
            await Favourite.destroy({where: {user_id: req.userId, post_id: postId}});
            res.status(200).json({code: 200});
        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

// 统计收藏数量
router.get('/count',
    auth,
    validationHandler,
    async (req, res) => {
        try {
            const {userId} = req;
            const count = await Favourite.count({where: {user_id: userId}});
            res.status(200).json({count});
        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

// 获取收藏笔记
router.get('/',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            let {page} = req.query;
            if (!page) page = 1;

            const limit = 10;
            const offset = (page - 1) * limit;

            const {userId} = req;

            const favourites = await Favourite.findAll({
                where: {user_id: userId},
                attributes: ['post_id'],
                limit: limit,  // Limit the number of returned items
                offset: offset,  // Skip the items before the offset
            });

            // Get the ids of the favourite posts
            const postIds = favourites.map(fav => fav.post_id);

            // Use the ids as conditions to find the posts
            const {posts} = await Post.findByConditions({id: postIds}, page);

            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);


module.exports = router;
