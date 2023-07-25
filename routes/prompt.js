const express = require('express');
const router = express.Router();
const {Op} = require('sequelize');

const auth = require('../config/auth');
const {query} = require('express-validator');
const validationHandler = require('../config/validationHandler');

const Post = require('../models/Post');
const PostCategory = require('../models/PostCategory');
const PostCategoryRelation = require('../models/PostCategoryRelation');

router.get('/list',
    auth,
    query('categoryId').isInt({min: 1}).withMessage('categoryId必须是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            let {categoryId, page} = req.query;
            if (!page) page = 1;
            const offset = (page - 1) * 10;

            const {count: total, rows: postCategories} = await PostCategoryRelation.findAndCountAll({
                where: {post_category_id: categoryId},
                include: [{
                    model: Post,
                    as: 'categoryPostRelationsRelations',
                    required: true,
                    where: {
                        prompt: {
                            [Op.ne]: null,
                            [Op.ne]: ''
                        }
                    }
                }],
                offset,
                limit: 10,
            });

            const postIds = postCategories.map(postCategory => postCategory.post_id);
            const posts = await Post.findByIds(postIds, req.userId);

            res.status(200).json({data: {total: total, page: page, posts: posts}, code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

router.get('/',
    auth,
    query('postId').optional().isInt({min: 1}).withMessage('postId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const {postId} = req.query;
            const posts = await Post.findByIds([postId], req.userId);
            if (!posts || !posts.length) {
                return res.status(404).json({errors: ['找不到指令'], code: 404});
            }

            res.status(200).json({data: posts[0], code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

module.exports = router;
