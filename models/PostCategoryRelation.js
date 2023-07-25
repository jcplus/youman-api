const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

class PostCategoryRelation extends Model {}

PostCategoryRelation.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    postId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'post_id',
    },
    postCategoryId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'post_category_id',
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'PostCategoryRelation',
    tableName: 'post_category_relations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = PostCategoryRelation;