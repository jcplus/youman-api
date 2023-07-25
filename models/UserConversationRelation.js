const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

class UserConversationRelation extends Model {
}

UserConversationRelation.init({
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
    },
    conversation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
    },
}, {
    sequelize,
    modelName: 'UserConversationRelation',
    tableName: 'user_conversation_relations',
    timestamps: false,
    underscored: true,
});

UserConversationRelation.getConversationIdByTwoUserIds = async function (userId1, userId2) {
    const sql = `
        SELECT ucr1.*
        FROM user_conversation_relations AS ucr1
            JOIN user_conversation_relations AS ucr2
        ON ucr1.conversation_id = ucr2.conversation_id
        WHERE ucr1.user_id = :userId1 AND ucr2.user_id = :userId2;
    `;

    const result = await sequelize.query(sql, {
        replacements: {userId1, userId2},
        type: sequelize.QueryTypes.SELECT,
    });

    return result.length ? result[0].conversation_id : null;
};

module.exports = UserConversationRelation;