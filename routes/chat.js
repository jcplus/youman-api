const express = require('express');
const expressWs = require('express-ws');
const jwt = require('jsonwebtoken');
const router = express.Router();
expressWs(router);

// 中间件
const auth = require('../config/auth');
const {query} = require('express-validator');
const validationHandler = require('../config/validationHandler');

// 模型
const Conversation = require("../models/Conversation");
const Message = require('../models/Message');
const User = require('../models/User');
const UserConversationRelation = require("../models/UserConversationRelation");

const REFRESH_RATE = parseInt(process.env.MESSAGE_WS_REFRESH_RATE ?? 1000, 10);
let FETCHING_MESSAGES = true;

/**
 * 定时刷新获取用户应该接收到的消息
 *
 * @param ws
 */
function fetchNewMessages(receiverId, senderId, ws) {
    if (!FETCHING_MESSAGES) return;
    const timer = setTimeout(async () => {
        clearTimeout(timer);
        const messages = await Message.getUnreadMessages(receiverId, senderId);
        ws.send(JSON.stringify({data: messages, code: 200}));
        fetchNewMessages(receiverId, senderId, ws);
    }, REFRESH_RATE);
}

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                reject(JSON.stringify({errors: ['无效的认证令牌'], code: 403}));
            } else {
                resolve(decoded);
            }
        });
    });
}

/**
 * 接收和发送聊天信息
 */
router.ws('/',
    async function (ws, req) {
        try {
            const token = req.headers.authorization.replace('Bearer ', '');
            const decoded = await verifyToken(token);
            const receiverId = parseInt(req.query.receiverId);
            const senderId = decoded.userId;

            if (!receiverId) {
                throw new Error(JSON.stringify({errors: ['找不到参数receiverId'], code: 404}));
            }

            // 检查用户是否存在
            const receiver = await User.findById(receiverId);
            if (!receiver) {
                throw new Error(JSON.stringify({errors: [`用户 ${receiverId} 不存在`], code: 404}));
            }

            let conversationId = await UserConversationRelation.getConversationIdByTwoUserIds(senderId, receiverId);
            if (!conversationId) {
                const conversation = await Conversation.create();
                conversationId = conversation.id;
                await UserConversationRelation.bulkCreate([
                    {user_id: senderId, conversation_id: conversationId},
                    {user_id: receiverId, conversation_id: conversationId}
                ]);
            }

            ws.on('close', async () => {
                FETCHING_MESSAGES = false;
                ws.close();
            });

            ws.on('message', async (message) => {
                await Message.create({
                    senderId: senderId,
                    receiverId: receiverId,
                    content: message,
                });

                ws.send(JSON.stringify({code: 200}));
            });

            fetchNewMessages(senderId, receiverId, ws);
        } catch (error) {
            ws.send(error);
            ws.close();
        }
    }
);

module.exports = router;