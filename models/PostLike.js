const {Model, DataTypes} = require('sequelize');
const sequelize = require('../config/db');

// 移动常数变量到文件的开头
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10);

class PostLike extends Model {
}

PostLike.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    post_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'PostLike',
    tableName: 'post_likes',
    timestamps: true,
    underscored: true,
});

/**
 * 获取用户的总点赞数
 *
 * @param {number} userId 用户ID
 * @returns {Promise<Number>}
 */
PostLike.countLikesByUserId = async function (userId) {
    const result = await sequelize.query(`
        SELECT COUNT(*) AS like_count
        FROM post_likes
        WHERE user_id = :userId
    `, {
        replacements: {userId},
        type: sequelize.QueryTypes.SELECT
    });

    return result[0].like_count;
};

/**
 * 获取该用户点赞过的post ID数组
 * 排序：点赞由高到低
 *
 * @param {number} userId 用户ID
 * @param {number} [page=1] 页码
 * @returns {Promise<Array<number>>}
 */
PostLike.getLikedPostsByUserId = async function (userId, page = 1) {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const likedPosts = await sequelize.query(`
        SELECT post_id, COUNT(post_id) as like_count
        FROM post_likes
        WHERE user_id = :userId
        GROUP BY post_id
        ORDER BY like_count DESC
        LIMIT :limit
        OFFSET :offset
    `, {
        replacements: {userId, limit: ITEMS_PER_PAGE, offset},
        type: sequelize.QueryTypes.SELECT
    });

    const likedTotal = await sequelize.query(`
        SELECT COUNT(DISTINCT post_likes.post_id) as total_count
        FROM post_likes
        WHERE user_id = :userId
    `, {
        replacements: {userId, limit: ITEMS_PER_PAGE, offset},
        type: sequelize.QueryTypes.SELECT
    });

    const total = likedTotal[0].total_count;
    const postIds = likedPosts.map(like => like.post_id);
    return {total: total, postIds: postIds};
};

/**
 * 获取某个分类点赞由高到低的帖子
 * @param {number} categoryId 分类ID
 * @param {number} page 页码
 * @returns {Promise<{total: *, postIds: *[]}>} 返回一个promise，解析得到一个对象，包含total（总数）、page（页码）和posts（帖子数组）
 */
PostLike.getLikedPostsByCategoryId = async function (categoryId, page) {
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // 获取点赞从高到低的帖子
    const likedPosts = await sequelize.query(`
        SELECT post_likes.post_id, COUNT(post_likes.post_id) as like_count
        FROM post_likes
                 JOIN posts on posts.id = post_likes.post_id
                 JOIN post_category_relations on post_category_relations.post_id = posts.id
        WHERE post_category_relations.post_category_id = :categoryId
        GROUP BY post_likes.post_id
        ORDER BY like_count DESC LIMIT :limit
        OFFSET :offset
    `, {
        replacements: {categoryId, limit: ITEMS_PER_PAGE, offset}, // 注意这里的改变
        type: sequelize.QueryTypes.SELECT
    });

    // 获取总数量
    const likedTotal = await sequelize.query(`
        SELECT COUNT(DISTINCT post_likes.post_id) as total_count
        FROM post_likes
                 JOIN posts on posts.id = post_likes.post_id
                 JOIN post_category_relations on post_category_relations.post_id = posts.id
        WHERE post_category_relations.post_category_id = :categoryId
    `, {
        replacements: {categoryId},
        type: sequelize.QueryTypes.SELECT
    });

    const total = likedTotal[0].total_count;
    const postIds = likedPosts.map(like => like.post_id);
    return {total: total, postIds: postIds};
}


module.exports = PostLike;
