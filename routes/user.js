const express = require('express');
const router = express.Router();

// 中间件
const auth = require('../config/auth');
const {body, query} = require('express-validator');
const validationHandler = require('../config/validationHandler');

// 模型
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');

/**
 * 获取用户点赞总数
 */
router.get('/liked/count',
    auth,
    query('userId').isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    validationHandler,
    async function (req, res, next) {
        try {
            const {userId} = req.query;

            // 检查用户是否存在
            let user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({errors: ['用户不存在'], code: 404});
            }

            const count = await PostLike.countLikesByUserId(userId);
            res.status(200).json({data: {total: count}, code: 200});
        } catch (error) {
            console.log(error);
            res.status(500).json({errors: ['服务器错误'], code: 500});
        }
    }
);

router.get('/liked',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res, next) => {
        try {
            let {page} = req.query;
            if (!page) page = 1;

            const {total, postIds} = await PostLike.getLikedPostsByUserId(req.userId, page);
            const posts = await Post.findByIds(postIds, req.userId);
            res.status(200).send({data: {total: total, page: page, posts: posts}, code: 200});
        } catch (error) {
            console.log(error);
            res.status(500).send({errors: [error.message], code: 500});
        }
    }
);

/* GET users listing. */
router.get('/',
    auth,
    query('userId').optional().isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    validationHandler,
    async function (req, res, next) {
        try {
            const {userId} = req.query;

            // 根据用户ID获取用户数据
            let user = await User.findById(userId ?? req.userId);
            if (!user) {
                return res.status(404).json({errors: ['用户不存在'], code: 404});
            }
            user = user.toJSON();

            // 用户有多少笔记
            user.posts = await Post.count({where: {user_id: user.id}})

            // 是否关注了这个用户
            let isFollowing = false;
            if (userId !== req.userId) {
                isFollowing = await UserFollow.isFollowing(req.userId, userId);
                delete user.points;
            }
            user.is_following = isFollowing ? 1 : 0;

            // 返回用户数据和关注状态
            res.status(200).json({data: user, code: 200});
        } catch (error) {
            console.log(error);
            res.status(500).json({errors: ['服务器错误'], code: 500});
        }
    }
);



// 获取用户笔记
router.get('/posts',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    query('userId').optional().isInt({min: 1}).withMessage('userId必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        try {
            let {page, userId} = req.query;
            if (!page) page = 1;

            // Set userIds based on the existence of userId
            const currentUserId = req.userId;
            if (userId && userId === currentUserId) userId = null;

            const result = await Post.findByConditions({}, page, currentUserId, userId);
            result.code = 200;

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({errors: [error.message], code: 500});
        }
    }
);


router.post('/',
    auth,
    body('name').isLength({min: 2, max: 10}).withMessage('name不能少于2个字符不能多于10个字符'),
    // body('avatar').isURL().withMessage('头像需要是一个有效的URL'),
    // body('age').isInt({min: 13}).withMessage('年龄不能低于13'),
    // body('gender').isIn(['male', 'female']).withMessage('gender只能是male和female这两个字符串'),
    validationHandler,
    async function (req, res) {
        const {userId} = req;
        const {name, avatar, age, gender} = req.body;

        try {
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({errors: ['用户不存在'], code: 404});
            }

            // 更新用户信息
            user.name = name;
            user.avatar = avatar;
            user.age = age;
            user.gender = gender;

            // 保存更新后的用户信息
            await user.save();

            res.status(200).json({data: user, code: 200});
        } catch (error) {
            res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

module.exports = router;