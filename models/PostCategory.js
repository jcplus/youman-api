const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

class PostCategory extends Model {
}

PostCategory.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'PostCategory',
    tableName: 'post_categories',
    timestamps: false,
});

module.exports = PostCategory;