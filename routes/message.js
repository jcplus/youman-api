const express = require('express');
const router = express.Router();

// 中间件
const auth = require('../config/auth');
const {body, query} = require('express-validator');
const validator = require('validator');
const validationHandler = require("../config/validationHandler");

// 模型
const Message = require('../models/Message');
const User = require("../models/User");
const UserConversationRelation = require("../models/UserConversationRelation");

// 发送消息
router.post('/',
    auth,
    body('targetUserId').isInt({min: 1}).withMessage('targetUserId必须是大于0的整数').toInt(),
    body('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        const {targetUserId, content, image, video} = req.body;

        if (content.length && !validator.isLength(content, {max: 250})) {
            return res.status(400).json({errors: ['content不能超过250个字'], code: 400});
        }

        if (image.length && !validator.isURL(image)) {
            return res.status(400).json({errors: ['image不是有效的URL'], code: 400});
        }

        if (video.length && !validator.isURL(video)) {
            return res.status(400).json({errors: ['video不是有效的URL'], code: 400});
        }

        try {
            // 获取包含req.userId的所有scene_id
            const conversations = await Message.getConversations(req.userId, page);

            return res.status(201).json({data: conversations, code: 200});
        } catch (error) {
            console.log(error);
            return res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

/**
 * 获取当前用户的消息列表
 */
router.get('/list',
    auth,
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    async (req, res) => {
        try {
            let {page} = req.query;
            if (!page) page = 1;

            const {total, conversations} = await Message.getConversations(req.userId, page);

            // 提取所有需要查询的 user_id
            let userIds = [];
            conversations.forEach(conversation => {
                if (!userIds.includes(conversation.sender_id)) {
                    userIds.push(conversation.sender_id);
                }
                if (!userIds.includes(conversation.receiver_id)) {
                    userIds.push(conversation.receiver_id);
                }
            });

            // 执行批量查询
            const users = await User.findAll({
                attributes: ['id', 'avatar', 'name', 'gender', 'is_vip'],
                where: {
                    id: userIds
                }
            });

            // 创建一个映射关系，方便后续查找
            const userMap = {};
            users.forEach(user => {
                userMap[user.id] = user;
            });

            // 把查询到的用户信息添加到每个消息对象
            conversations.forEach(conversation => {
                conversation.sender = {
                    id: userMap[conversation.sender_id].id,
                    avatar: userMap[conversation.sender_id].avatar,
                    name: userMap[conversation.sender_id].name,
                    gender: userMap[conversation.sender_id].gender,
                    is_vip: userMap[conversation.sender_id].is_vip,
                };

                conversation.receiver = {
                    id: userMap[conversation.receiver_id].id,
                    avatar: userMap[conversation.receiver_id].avatar,
                    name: userMap[conversation.receiver_id].name,
                    gender: userMap[conversation.receiver_id].gender,
                    is_vip: userMap[conversation.receiver_id].is_vip,
                };

                delete conversation.sender_id;
                delete conversation.receiver_id;
            });

            return res.status(200).json({data: {
                total: total,
                page: page,
                conversations: conversations
            }, code: 200});
        } catch (error) {
            console.log(error)
            return res.status(500).json({errors: [error.message], code: 500});
        }
    }
);

router.get('/',
    auth,
    query('otherUserId').isInt({min: 1}).withMessage('otherUserId必须是大于0的整数').toInt(),
    query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
    validationHandler,
    async (req, res) => {
        let {otherUserId} = req.query;
        let {page} = req.query;
        if (!page) page = 1;

        try {
            const messages = await Message.getMessagesByUser(req.userId, otherUserId, page);
            return res.status(200).json({data: messages, code: 200});
        } catch (error) {
            return res.status(500).json({errors: [error.message], code: 500});
        }
    }
);


module.exports = router;
