const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const PostTagRelation = sequelize.define('PostTagRelation', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    post_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    tag_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
}, {
    modelName: 'PostTagRelation',
    tableName: 'post_tag_relations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
});

module.exports = PostTagRelation;
