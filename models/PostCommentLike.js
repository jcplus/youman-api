const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

class PostCommentLike extends Model {
}

PostCommentLike.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    post_comment_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'PostCommentLike',
    tableName: 'post_comment_likes',
    timestamps: true,
    underscored: true,
});

module.exports = PostCommentLike;
