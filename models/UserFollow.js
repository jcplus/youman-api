const {Model, DataTypes, fn, col} = require('sequelize');
const sequelize = require('../config/db');
const Post = require('../models/Post');
const User = require('../models/User');

class UserFollow extends Model {
}

UserFollow.init({
    follower_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
    },
    following_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
    }
}, {
    sequelize,
    modelName: 'UserFollow',
    tableName: 'user_follows',
    timestamps: true,
    underscored: true,
});

UserFollow.isFollowing = async function (followerId, followingId) {
    const count = await this.count({where: {follower_id: followerId, following_id: followingId}});
    return count > 0;
};

UserFollow.getFollowingWithPostCount = async function(followerId, limit, offset) {
    const {count, rows: following} = await this.findAndCountAll({
        where: {following_id: followerId},
        include: [{
            model: User,
            as: 'user_following',
            attributes: ['id', 'avatar', 'name'],
            include: {
                model: Post,
                as: 'posts',
                attributes: [[sequelize.fn('COUNT', sequelize.col('posts.id')), 'postCount']],
            }
        }],
        group: ['UserFollow.id', 'user_following.id'],
        limit: limit,
        offset: offset,
    });

    const users = following.map(follow => {
        const {id, avatar, name, posts} = follow.user_following;
        return {id, avatar, name, postCount: posts[0].dataValues.postCount};
    });

    return {total: count, users: users};
};


module.exports = UserFollow;
