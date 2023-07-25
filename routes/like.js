const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');

// 中间件
const auth = require('../config/auth');
const {body, query} = require("express-validator");
const validationHandler = require('../config/validationHandler');

// 模型
const CommentLike = require('../models/CommentLike');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const PostCommentLike = require('../models/PostCommentLike');
const PostLike = require('../models/PostLike');


/**
 * POST /comment/comment
 * Like a comment of comment by ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
router.post('/comment/comment',
    auth,
    body('commentId').isInt({min: 1}).withMessage('commentId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const {postCommentId} = req.body;
            const {userId} = req;

            const comment = await CommentLike.findByPk(postCommentId);
            if (!comment) {
                return res.status(404).send({errors: ['找不到评论'], code: 404});
            }
            if (comment.is_deleted) {
                return res.status(404).send({errors: ['评论已删除'], code: 404});
            }

            await CommentLike.findOrCreate({where: {user_id: userId, comment_id: postCommentId}});

            if (userId !== comment.user_id) {
                await Notification.findOrCreate({
                    where: {
                        user_id: userId,
                        action_message: '点赞了你的评论',
                        action_user_id: comment.user_id,
                        action_type: 'liked_a_comment',
                        action_type_id: postCommentId,
                    }
                });
            }

            res.status(200).send({code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);


/**
 * POST /post/comment
 * Like a post comment by ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/post/comment',
    auth,
    body('postCommentId').isInt({min: 1}).withMessage('postCommentId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            const {postCommentId} = req.body;
            const {userId} = req;

            const postComment = await PostComment.findByPk(postCommentId);
            if (!postComment) {
                return res.status(404).send({errors: ['找不到评论'], code: 404});
            }
            if (postComment.is_deleted) {
                return res.status(404).send({errors: ['评论已删除'], code: 404});
            }

            await PostCommentLike.findOrCreate({where: {user_id: userId, post_comment_id: postCommentId}});

            if (userId !== postComment.user_id) {
                await Notification.findOrCreate({
                    where: {
                        user_id: userId,
                        action_message: '点赞了你的评论',
                        action_user_id: postComment.user_id,
                        action_type: 'liked_a_post_comment',
                        action_type_id: postCommentId,
                    }
                });
            }

            res.status(200).send({code: 200});
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /post
 * Like a post by ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/post',
    auth,
    body('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            const {postId} = req.body;
            const {userId} = req;

            const post = await Post.findByPk(postId);
            if (!post) {
                return res.status(404).send({errors: ['找不到笔记'], code: 404});
            }

            await PostLike.findOrCreate({where: {user_id: userId, post_id: postId}});
            if (userId !== post.user_id) {
                await Notification.findOrCreate({
                    where: {
                        user_id: userId,
                        action_message: '点赞了你的笔记',
                        action_user_id: post.user_id,
                        action_type: 'liked_a_post',
                        action_type_id: postId,
                    }
                });
            }

            res.status(200).send({code: 200});
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /post
 * Cancel like a post
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.delete('/post',
    auth,
    body('postId').isInt({min: 1}).withMessage('postId必须是大于0的整数'),
    async (req, res, next) => {
        const {postId} = req.body;
        const {userId} = req;

        try {
            await PostLike.destroy({where: {user_id: userId, post_id: postId}});
            res.status(200).send({code: 200});
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /count
 * Get total like count of user has
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.get('/count',
    query('userId').isInt({min: 1}).withMessage('userId必须是大于0的整数'),
    async (req, res, next) => {
        try {
            const {userId} = req.query;

            // Count all likes from a specific user
            const count = await PostLike.count({ where: {user_id: userId}});
            res.status(200).send({data: count, code: 200});
        } catch (error) {
            next(error);
        }
    }
);

router.get('/me',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {page} = req.query;
            if (!page) page = 1;
            const limit = 10; // 每页10篇文章
            const offset = (page - 1) * limit || 0;

            // 获取当前用户点赞过的点赞从高到低的帖子
            const {count: total, rows: likedPosts} = await PostLike.findAndCountAll({
                where: {
                    user_id: req.userId
                },
                attributes: ['post_id', [sequelize.fn('COUNT', sequelize.col('post_id')), 'like_count']],
                include: [{
                    model: Post,
                    as: 'likePost',
                    required: true,
                    attributes: ['id']
                }],
                group: ['post_id'],
                order: [[sequelize.literal('like_count'), 'DESC']],
                limit: limit,
                offset: offset
            });

            const postIds = likedPosts.map(like => like.post_id);
            const posts = await Post.findByIds(postIds, req.userId);
            res.status(200).send({data: {total: total.length, page: page, posts: posts}, code: 200});
        } catch (error) {
            next(error);
        }
    }
);

router.get('/',
    auth,
    query('userId').isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {userId, page} = req.query;
            if (!page) page = 1;
            const limit = 10; // 每页10篇文章
            const offset = (page - 1) * limit || 0;

            // 获取当前登录用户或者请求的用户的所有点赞的帖子ID
            const {count: total, rows: likedPosts} = await PostLike.findAndCountAll({
                where: {
                    user_id: userId
                },
                attributes: ['post_id'],
                limit: limit,
                offset: offset
            });

            const postIds = likedPosts.map(like => like.post_id);

            // 根据这些帖子ID获取帖子的详细信息
            const posts = await Post.findByIds(postIds, req.userId);

            res.status(200).send({data: {total: total, page: page, posts: posts}, code: 200});

        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

module.exports = router;
