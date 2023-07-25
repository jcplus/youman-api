const express = require('express');
const router = express.Router();

// 中间件
const auth = require('../config/auth');
const {query} = require("express-validator");
const validationHandler = require('../config/validationHandler');

// 模型
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');

/**
 * 获取某个分类点赞由高到低的帖子
 */
router.get('/',
    auth,
    query('categoryId').isInt({min: 1}).withMessage('categoryId必须是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {categoryId, page} = req.query;
            if (!page) page = 1;

            const {total, postIds} = await PostLike.getLikedPostsByCategoryId(categoryId, page);
            const posts = await Post.findByIds(postIds, req.userId);
            res.status(200).send({data: {total: total, page: page, posts: posts}, code: 200});
        } catch (error) {
            console.log(error);
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

module.exports = router;
