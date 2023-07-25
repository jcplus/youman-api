const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Mention = sequelize.define('Mention', {
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
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
}, {
    modelName: 'Mention',
    tableName: 'mentions',
    timestamps: true,
    underscored: true,
});

module.exports = Mention;
