const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const {query, body} = require('express-validator');
const validationHandler = require('../config/validationHandler');
const Post = require('../models/Post');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');

router.post('/',
    auth,
    body('userId').isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const targetUserId = req.body.userId;
            const currentUserId = req.userId;
            if (targetUserId === currentUserId) throw new Error('不能关注自己');

            // 检查目标用户是否存在
            const targetUser = await User.findOne({where: {id: targetUserId}});
            if (!targetUser) {
                return res.status(400).json({errors: ['用户不存在'], code: 400});
            }

            await UserFollow.findOrCreate({where: {follower_id: currentUserId, following_id: targetUserId}});
            res.status(200).send({message: '关注成功', code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);


router.delete('/',
    auth,
    body('userId').isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            const targetId = req.body.userId;
            const currentUserId = req.userId;
            await UserFollow.destroy({where: {follower_id: currentUserId, following_id: targetId}});
            res.status(200).send({message: '取消关注成功', code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

router.get('/following',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        const page = req.query.page || 1;
        const limit = 10; // 每页显示10个用户
        const offset = (page - 1) * limit;

        try {
            const {count, rows: following} = await UserFollow.findAndCountAll({
                where: {follower_id: req.userId},
                include: {
                    model: User,
                    as: 'user_following',
                    attributes: ['id', 'avatar', 'name'],
                },
                limit: limit,
                offset: offset,
            });

            // 对每个用户进行数据库查询，获取他们的帖子数
            const users = await Promise.all(following.map(async (follow) => {
                const {id, avatar, name} = follow.user_following;
                const postCount = await Post.count({where: {user_id: id}});
                return {id, avatar, name, posts: postCount};
            }));

            res.status(200).json({data: {total: count, page: page, users: users}, code: 200});

        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

router.get('/followers',
    auth,
    query('page').isInt({min: 1}).withMessage('页码必须是大于0的整数').optional().toInt(),
    validationHandler,
    async (req, res) => {
        const page = req.query.page || 1;
        const limit = 10; // 每页的数量
        const offset = (page - 1) * limit;

        try {
            const {count, rows: followers} = await UserFollow.findAndCountAll({
                where: {following_id: req.userId},
                include: {
                    model: User,
                    as: 'user_following',
                    attributes: ['id', 'avatar', 'name'],
                },
                limit: limit,
                offset: offset,
            });

            const users = await Promise.all(followers.map(async (follow) => {
                const {id, avatar, name} = follow.user_following;
                const postCount = await Post.count({where: {user_id: id}});
                return {id, avatar, name, posts: postCount};
            }));

            res.status(200).json({data: {total: count, page: page, users: users}, code: 200});

        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

router.get('/followingCount',
    auth,
    query('userId').isInt({min: 1}).withMessage('用户ID必须是大于0的整数').optional().toInt(),
    async (req, res) => {
        try {
            const {userId} = req.query;
            const count = await UserFollow.count({where: {follower_id: userId ?? req.userId}});
            res.status(200).json({data: count, code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message]});
        }
    }
);

router.get('/followersCount',
    auth,
    query('userId').isInt({min: 1}).withMessage('用户ID必须是大于0的整数').optional().toInt(),
    async (req, res) => {
        try {
            const {userId} = req.query;
            const count = await UserFollow.count({where: {following_id: userId ?? req.userId}});
            res.status(200).json({data: count, code: 200});
        } catch (error) {
            res.status(500).send({errors: [error.message]});
        }
    }
);

module.exports = router;
