const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

// 移动常数变量到文件的开头
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10);

class Conversation extends Model {
}

Conversation.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
}, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    timestamps: false,
    underscored: true,
});

/**
 * 获取当前用户的消息列表
 *
 * @param {number} userId 用户ID
 * @param {number} [page=1] 页码
 * @returns {Promise<{total: *, messages: *[]}>}
 */
Conversation.getList = async function (userId, page = 1) {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    const sqlTotal = `
        SELECT COUNT(DISTINCT scenes.id) AS scene_total
        FROM scenes
                 INNER JOIN message_scene_relations
                            ON scenes.id = message_scene_relations.scene_id
                 INNER JOIN messages
                            ON message_scene_relations.message_id = messages.id
        WHERE messages.user_id = :userId
    `;

    const resultTotal = await sequelize.query(sqlTotal, {
        replacements: {userId, limit: ITEMS_PER_PAGE, offset},
        type: sequelize.QueryTypes.SELECT
    });
    const total = resultTotal[0].scene_total;

    const sqlScene = `
        SELECT scenes.*
        FROM scenes
                 INNER JOIN message_scene_relations
                            ON scenes.id = message_scene_relations.scene_id
                 INNER JOIN messages
                            ON message_scene_relations.message_id = messages.id
        WHERE messages.user_id = :userId
        GROUP BY scenes.id
        ORDER BY MAX(messages.created_at) DESC
            LIMIT :limit OFFSET :offset
    `;

    const scenes = await sequelize.query(sqlScene, {
        replacements: {userId, limit: ITEMS_PER_PAGE, offset},
        type: sequelize.QueryTypes.SELECT
    });

    // Step 2: 对于每个对话场景，查询最新的消息
    const messages = [];
    for (const scene of scenes) {
        const sqlMessage = `
            SELECT *
            FROM messages
            INNER JOIN message_scene_relations
                ON messages.id = message_scene_relations.message_id
            WHERE message_scene_relations.scene_id = :sceneId
            ORDER BY messages.created_at DESC
            LIMIT 1
        `;

        const message = await sequelize.query(sqlMessage, {
            replacements: {sceneId: scene.id},
            type: sequelize.QueryTypes.SELECT
        });

        messages.push({
            scene_id: message[0].scene_id,
            message_id: message[0].id,
            user_id: message[0].user_id,
            content: message[0].content,
            image: message[0].image,
            video: message[0].video,
            is_read: message[0].is_read,
            created_at: message[0].created_at,
        });
    }

    return {total, messages};
};

module.exports = Conversation;