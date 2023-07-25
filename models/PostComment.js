const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

class PostComment extends Model {
}

PostComment.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    post_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('published', 'draft', 'suspended', 'deleted'),
        defaultValue: 'draft'
    },
    is_deleted: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
}, {
    sequelize,
    modelName: 'PostComment',
    tableName: 'post_comments',
    timestamps: true,
    underscored: true
});

module.exports = PostComment;
