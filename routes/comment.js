const express = require('express');
const router = express.Router();
const auth = require('../config/auth');

// Middleware
const {body, query} = require('express-validator');
const validationHandler = require('../config/validationHandler');

// Models
const CommentComment = require('../models/CommentComment');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const User = require("../models/User");


/**
 * POST /post
 * Create a new post comment
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/post',
    auth,
    body('postId').isInt({min: 1}).withMessage('笔记ID必须是大于0的整数').toInt(),
    body('content').isLength({min: 3, max: 200}).withMessage('评论内容不能少于3个字，也不能多于200个字'),
    validationHandler,
    async (req, res, next) => {
        const userId = req.userId;
        const {content, postId} = req.body;

        try {
            // Check if the post exists
            const post = await Post.findByPk(postId);
            if (!post) {
                return res.status(404).json({errors: ['找不到笔记'], code: 404});
            }

            // Create the new comment
            const comment = await PostComment.create({
                user_id: userId,
                post_id: postId,
                content: content,
                status: 'published'
            });

            if (userId !== post.user_id) {
                await Notification.findOrCreate({
                    where: {
                        user_id: post.user_id,
                        action_message: '点赞了你的笔记',
                        action_user_id: userId,
                        action_type: 'comment_a_post',
                        action_type_id: post.id,
                    }
                });
            }

            res.status(200).json({data: comment.id, code: 200});
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /post
 * Delete a post comment by ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.delete('/post',
    auth,
    body('commentId').isInt({min: 1}).withMessage('评论ID必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            const {commentId} = req.body;
            const {userId} = req;

            const comment = await PostComment.findOne({where: {
                    id: commentId,
                    is_deleted: 0
                }});

            if (!comment) {
                return res.status(404).json({errors: ['评论不存在'], code: 404});
            }

            if (comment.user_id !== userId) {
                return res.status(403).json({errors: ['只有评论的作者可以删除评论'], code: 403});
            }

            await comment.update({is_deleted: 1});
            res.status(200).json({code: 200});
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /post
 * Get all comments for a post by post ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.get('/post',
    auth,
    query('postId').isInt({min: 1}).withMessage('笔记ID只能是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('页面只能是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {postId, page} = req.query;
            if (!page) page = 1;

            // Set the limit to 10 items per page
            const limit = 10;

            // Calculate the offset
            const offset = (page - 1) * limit;

            // Fetch comments for the post from the database
            const {count, rows: comments} = await PostComment.findAndCountAll({
                where: {
                    post_id: postId,
                    is_deleted: 0
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

            // Return the comments to the client
            res.status(200).json({
                total: count,
                page: page,
                comments: comments,
                code: 200
            });
        } catch (error) {
            next(error);
        }
    }
);


/**
 * GET /comment
 * Get all comments for a comment by comment ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.get('/comment',
    auth,
    query('commentId').isInt({min: 1}).withMessage('评论ID只能是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('页面只能是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {commentId, page} = req.query;
            if (!page) page = 1;

            const comments = await CommentComment.getCommentsRecursive(commentId);
            res.status(200).json({data: comments, code: 200});
        } catch (error) {
            next(error);
        }
    }
);


/**
 * POST /comment
 * Create a new comment to a comment for a comment
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/comment',
    auth,
    body('commentId').isInt({min: 1}).withMessage('评论ID必须是大于0的整数').toInt(),
    body('content').isLength({min: 3, max: 200}).withMessage('评论内容不能少于3个字，也不能多于200个字'),
    validationHandler,
    async (req, res, next) => {
        try {
            const {content, commentId} = req.body;
            const {userId} = req;

            // Check if the comment to be commented exists
            const parent = await CommentComment.findOne({where: {
                id: commentId,
                is_deleted: 0
            }});
            if (!parent) {
                return res.status(404).json({errors: ['评论不存在'], code: 404});
            }

            // Create the new comment to the parent comment
            const comment = await CommentComment.create({
                user_id: userId,
                comment_id: commentId,
                content: content,
                status: 'published'
            });

            // if (userId !== comment.user_id) {
                await Notification.findOrCreate({
                    where: {
                        user_id: parent.user_id,
                        action_message: '点赞了你的评论',
                        action_user_id: userId,
                        action_type: 'comment_a_comment',
                        action_type_id: parent.id,
                    }
                });
            // }

            res.status(201).json({data: comment.id, code: 200});
        } catch (error) {
            next(error);
        }
    }
);


/**
 * DELETE /comment
 * Delete a comment to a comment by ID
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.delete('/comment',
    auth,
    body('commentId').isInt({min: 1}).withMessage('评论ID必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            const {commentId} = req.body;
            const {userId} = req;

            const comment = await CommentComment.findOne({where: {
                id: commentId,
                is_deleted: 0
            }});
            if (!comment) {
                return res.status(404).json({errors: ['评论不存在'], code: 404});
            }

            if (comment.user_id !== userId) {
                return res.status(403).json({errors: ['你无法删除其他用户的评论'], code: 403});
            }

            await comment.update({is_deleted: 1});
            res.status(200).json({code: 200});
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
