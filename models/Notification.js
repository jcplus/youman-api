const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {
    /**
     * 添加通知
     *
     * @param userId
     * @param actionUserId
     * @param actionMessage
     * @param actionType
     * @param actionTypeId
     * @returns {Promise<CreateOptions<Attributes<Model>> extends ({returning: false} | {ignoreDuplicates: true}) ? void : Notification>}
     */
    static async addNotification(userId, actionUserId, actionMessage, actionType, actionTypeId) {
        return this.create({
            user_id: userId,
            action_user_id: actionUserId,
            action_message: actionMessage,
            action_type: actionType,
            action_type_id: actionTypeId,
            is_read: 0,  // 默认 0 表示未阅读
        });
    }
}

Notification.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
        },
        action_user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
        },
        action_message: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        action_type: {
            type: DataTypes.ENUM('comment_a_comment', 'comment_a_post', 'liked_a_post', 'liked_a_comment'),
            allowNull: false,
        },
        action_type_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        is_read: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
        },
    },
    {
        sequelize,
        timestamps: true,
        underscored: true,
        modelName: 'Notification',
        tableName: 'notifications',
    }
);

module.exports = Notification;
