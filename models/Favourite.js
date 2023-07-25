const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

class Favourite extends Model {
}

Favourite.init({
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    post_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Favourite',
    timestamps: true,
    underscored: true,
});

module.exports = Favourite;
