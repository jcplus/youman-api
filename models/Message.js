const {DataTypes, Model, Op} = require('sequelize');
const sequelize = require('../config/db');

// 移动常数变量到文件的开头
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10);

class Message extends Model {}

Message.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    receiver_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    content: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: ''
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: ''
    },
    video: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: ''
    },
    is_read: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
}, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    underscored: true,
});

Message.getConversations = async function (userId, page = 1) {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    let sqlCount = `
        SELECT COUNT(user_conversation_relations.conversation_id) AS total_count
    `;

    let sqlPrefix = `
        SELECT 
            user_conversation_relations.conversation_id,
            last_messages.sender_id,
            last_messages.receiver_id,
            last_messages.content,
            last_messages.image,
            last_messages.video,
            last_messages.is_read,
            last_messages.created_at
    `;

    let sqlMain = `
        FROM (
            SELECT 
                CASE 
                    WHEN sender_id = ${userId} THEN receiver_id
                    ELSE sender_id
                END AS other_user_id,
                MAX(created_at) as last_sent
            FROM messages
            WHERE sender_id = ${userId} OR receiver_id = ${userId}
            GROUP BY other_user_id
        ) AS conversation_last_sent
        JOIN messages last_messages ON (
            (last_messages.sender_id = ${userId} AND last_messages.receiver_id = conversation_last_sent.other_user_id) OR 
            (last_messages.receiver_id = ${userId} AND last_messages.sender_id = conversation_last_sent.other_user_id)
        ) AND last_messages.created_at = conversation_last_sent.last_sent
        JOIN users other_users ON other_users.id = conversation_last_sent.other_user_id
        JOIN user_conversation_relations ON (
            user_conversation_relations.user_id = ${userId} AND 
            user_conversation_relations.conversation_id IN (
                SELECT conversation_id 
                FROM user_conversation_relations
                WHERE user_id = other_users.id
            )
        )
    `;

    let sqlPage = `
        ORDER BY last_messages.created_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset};
    `;

    const resultTotal = await sequelize.query(sqlCount + sqlMain, {
        type: sequelize.QueryTypes.SELECT
    });

    const resultList = await sequelize.query(sqlPrefix + sqlMain + sqlPage, {
        type: sequelize.QueryTypes.SELECT
    });

    return {total: resultTotal[0].total_count, conversations: resultList};
};

Message.getUnreadMessages = async function (receiverId, senderId) {
    const unreadMessages = await Message.findAll({
        where: {
            receiver_id: receiverId,
            sender_id: senderId,
            is_read: 0,
        },
        order: [['created_at', 'DESC']],
    });

    await Message.update(
        {is_read: 1},
        {where: {
                id: {
                    [Op.in]: unreadMessages.map(message => message.id),
                },
            }},
    );

    return unreadMessages.map(message => message.toJSON());
};

module.exports = Message;
