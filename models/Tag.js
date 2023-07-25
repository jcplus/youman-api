const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Tag = sequelize.define('Tag', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
}, {
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
});

module.exports = Tag;