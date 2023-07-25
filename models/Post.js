const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/db');

// 模型
const Content = require('./Content');
const Favourite = require('./Favourite');
const Mention = require('./Mention');
const PostCategory = require("./PostCategory");
const PostCategoryRelation = require('./PostCategoryRelation');
const PostComment = require('./PostComment');
const PostLike = require('./PostLike');
const Tag = require('./Tag');
const User = require('./User');
const UserFollow = require('./UserFollow');
const validator = require("validator");

// 移动常数变量到文件的开头
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE, 10);

class Post extends Model {}

Post.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	user_id: {
		type: DataTypes.BIGINT.UNSIGNED,
		allowNull: false,
		references: {
			model: User,
			key: 'id'
		},
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE'
	},
	status: {
		type: DataTypes.ENUM('published', 'suspended'),
		defaultValue: 'draft',
	},
	post_cover: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	post_type: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false,
	},
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	content: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	prompt: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: '',
	},
	price: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false,
		defaultValue: 0,
	},
	is_tutorial: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false,
		defaultValue: 0
	},
	is_vip: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false,
		defaultValue: 0
	},
}, {
	sequelize,
	modelName: 'Post',
	tableName: 'posts',
	timestamps: true,
	paranoid: true, // 启用软删除
	underscored: true,
});

/**
 * 异步保存多媒体内容。
 *
 * @async
 * @function saveMedia
 * @param {Object} post - 一个Post实例，它包含了创建内容的方法。
 * @param {Number} postId - 需要保存内容的Post的ID。
 * @param {Array} contentValues - 包含多个内容值的数组。
 * @param {Object} transaction - 事务对象，将在所有内容创建操作中使用。
 * 如果内容值数组存在且不为空，该函数将创建一个Promise数组并使用Promise.all()等待所有Promise完成。
 * 每个Promise都将使用Post实例的createContent方法创建一个新的内容。
 * 这样可以并行处理所有内容创建操作，提高性能。
 * 注意，如果任何一个Promise失败，Promise.all()会立即失败，并且其他Promise的结果将被忽略。
 * 如果你希望即使某些Promise失败也能得到其他Promise的结果，你可以使用Promise.allSettled()。
 */
const saveMedia = async (post, postId, contentValues, transaction) => {
	if (contentValues && contentValues.length) {
		const promises = contentValues.map(contentValue => {
			return post.createContent({
				content_value: contentValue
			}, {transaction});
		});
		await Promise.all(promises);
	}
};

/**
 * 创建或更新文章
 *
 * @param {object} payload 包含文章数据的对象
 * @returns {Promise<number>} 返回文章的id
 * @throws {Error} 当验证失败或事务处理失败时抛出错误
 */
Post.createOrUpdate = async function (payload) {
	let {
		postId,
		userId,
		cover,
		type,
		title,
		content,
		prompt,
		price,
		media,
		tags,
		mentioned,
		categories
	} = payload;

	if (content && !validator.isLength(content.trim(), {min: 3, max: 500})) {
		throw new Error('content最多可以包含500个字符');
	}

	if (prompt) {
		if (!validator.isLength(prompt.trim(), {min: 3, max: 1000})) {
			throw new Error('prompt最多可以包含1000个字符');
		}

		if (price && !validator.isInt(price, {min: 1})) {
			throw new Error('价格必须是大于0的整数');
		}
	}


	const transaction = await this.sequelize.transaction();
	try {
		let post;
		if (postId) {
			post = await this.findByPk(postId);

			if (!post) {
				throw new Error('找不到这个笔记');
			}

			post.status = 'published';
			post.post_cover = cover;
			post.post_type = type;
			post.title = title;
			if (content) post.content = content;
			if (prompt) post.prompt = prompt;
			if (price) post.price = price;
			await post.save({transaction});
		} else {
			let data = {
				user_id: userId,
				status: 'published',
				post_cover: cover,
				post_type: type,
				title: title,
			};
			if (content) data.content = content;
			if (prompt) data.prompt = prompt;
			if (price) data.price = price;

			post = await this.create(data, {transaction});
			postId = post.id;
		}

		await saveMedia(post, postId, media, transaction);

		if (Array.isArray(tags) && tags.length) {
			const tagInstances = [];
			for (let tag of tags) {
				const [tagInstance, created] = await Tag.findOrCreate({where: {name: tag}, transaction});
				if (created) {
					console.log(`创建了新话题: ${tag}`);
				}
				tagInstances.push(tagInstance);
			}

			await post.setTags(tagInstances, {transaction});
		}

		if (mentioned && mentioned.length > 0) {
			// 先从 mentioned 中移除当前用户的 ID
			let validMentionedIds = mentioned.filter(id => id !== userId);

			// 从数据库中查找这些 ID 是否存在
			let users = await User.findAll({
				where: {
					id: validMentionedIds
				}
			});

			// 从数据库返回的用户对象中获取实际存在的用户 ID
			let validUserIds = users.map(user => user.id);

			// 对于每个有效的用户 ID，创建一个新的 Mention 记录
			let mentions = validUserIds.map(userId => ({
				post_id: postId,
				user_id: userId
			}));

			// 使用事务批量创建 Mention 记录
			await Mention.bulkCreate(mentions, {transaction});
		}


		if (categories && categories.length > 0) {
			// 从数据库中查找这些 ID 是否存在
			let existingCategories = await PostCategory.findAll({
				where: {
					id: categories
				}
			});

			// 检查所有的类别 ID 是否都存在
			if (existingCategories.length !== categories.length) {
				throw new Error('一些提供的分类不存在');
			}

			// 从数据库返回的分类对象中获取实际存在的分类 ID
			let validCategoryIds = existingCategories.map(category => category.id);

			// 对于每个有效的分类 ID，创建一个新的 PostCategoryRelation 记录
			let categoryRelations = validCategoryIds.map(categoryId => ({
				post_id: postId,
				post_category_id: categoryId
			}));

			// 使用事务批量创建 PostCategoryRelation 记录
			await PostCategoryRelation.bulkCreate(categoryRelations, {transaction});
		}

		await transaction.commit();
		return postId;
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
};

/**
 * 通过条件查找Post对象，并进行分页处理。
 *
 * @async
 * @function findByConditions
 * @param {Object} conditions - 搜索条件，用于筛选符合条件的Post对象。默认为空对象。
 * @param {Number} page - 需要查询的页数，用于分页处理。默认为第1页。
 * @param {Number} currentUserId - 当前用户的ID。
 * @returns {Object} 返回一个对象，包含总数（total）、当前页数（page）和符合条件的Post对象数组（posts）。
 * @throws {Error} 如果在查找过程中出现错误，则抛出错误。
 * @example
 * // 返回第2页，当前用户ID为1的Post对象
 * const result = await Post.findByConditions({}, 2, 1);
 */
Post.findByConditions = async function (
	conditions = {},
	page = 1,
	currentUserId
) {
	const offset = (page - 1) * ITEMS_PER_PAGE;

	const {count, rows: matchedPosts} = await Post.findAndCountAll({
		attributes: ['id', 'post_cover', 'post_type', 'title', 'content', 'prompt', 'price', 'created_at', 'updated_at'],
		where: conditions,
		limit: ITEMS_PER_PAGE,
		offset: offset,
		order: [['created_at', 'DESC']],
	});

	const postIds = matchedPosts.map(post => post.id);
	const posts = await this.findByIds(postIds, currentUserId);

	return {
		total: count,
		page: page,
		posts: posts
	};
};

/**
 * 批量根据ID获取Post数据
 *
 * @param {number[]} postIds - 需要获取的Post的ID数组
 * @param {number} currentUserId - 当前用户ID
 * @return {Promise<object[]>} 返回的Promise中包含处理后的Post对象数组
 */
Post.findByIds = async function (postIds, currentUserId) {
	try {
		const posts = await Post.findAll({
			attributes: ['id', 'post_cover', 'post_type', 'is_vip', 'title', 'content', 'prompt', 'price', 'created_at', 'updated_at'],
			where: {
				id: postIds
			},
			order: [['created_at', 'DESC']],
			include: [
				{
					model: User,
					as: 'author',
					attributes: ['id', 'avatar', 'name', 'is_vip'],
				},
				{
					model: Tag,
					as: 'tags',
					through: {attributes: []},
					attributes: ['name'],
				},
				{
					model: PostCategory,
					as: 'postcategories',
					through: {attributes: []},
					attributes: ['name'],
				},
				{
					model: Content,
					as: 'contents',
					separate: true,
					attributes: ['content_value'],
				},
				{
					model: Mention,
					as: 'mentions',
					include: [{
						model: User,
						as: 'mentionedUser',
						attributes: ['id', 'avatar', 'name', 'is_vip'],
					}],
				},
			]
		});

		let modifiedPosts = await Promise.all(posts.map(async (post) => {
			const author = {
				id: post.author.id,
				avatar: post.author.avatar,
				name: post.author.name,
				is_vip: post.author.is_vip,
			};

			const newMentions = post.mentions.map((mention) => ({
				id: mention.mentionedUser.id,
				avatar: mention.mentionedUser.avatar,
				name: mention.mentionedUser.name,
				is_vip: post.author.is_vip,
			}));

			const media = post.contents.map((content) => content.content_value);

			const likeCount = await PostLike.count({where: {post_id: post.id}});
			const favouriteCount = await Favourite.count({where: {post_id: post.id}});
			const commentCount = await PostComment.count({where: {post_id: post.id}});

			const isLikedByUser = await PostLike.findOne({where: {user_id: currentUserId, post_id: post.id}}) ? 1 : 0;
			const isFavouriteByUser = await Favourite.findOne({where: {user_id: currentUserId, post_id: post.id}}) ? 1 : 0;

			const follow = await UserFollow.findOne({where: {follower_id: currentUserId, following_id: author.id}});
			const isUserFollowingAuthor = follow ? 1 : 0;

			const newPost = {
				...post.dataValues,
				author: author,
				media: media,
				mentions: newMentions,
				likes: likeCount,
				favourites: favouriteCount,
				comments: commentCount,
				is_favourite: isFavouriteByUser,
				is_liked: isLikedByUser,
				is_follow: isUserFollowingAuthor,
			};

			delete newPost.contents;
			delete newPost.postMentions;
			return newPost;
		}));

		// Reorder the modifiedPosts array to match the order of postIds
		modifiedPosts = modifiedPosts.sort((a, b) => postIds.indexOf(a.id) - postIds.indexOf(b.id));

		return modifiedPosts;
	} catch (error) {
		console.log(error)
		throw error;
	}
};

/**
 * 获取特定用户的帖子列表
 *
 * @param {number} userId - 需要获取帖子的用户的ID
 * @param {number} page=1 - 分页的页数，默认为1
 * @param {number} currentUserId - 当前用户ID
 * @throws {Error} 当userId或page参数无效时抛出错误
 * @return {Promise<{total: number, page: Number, posts: *}>} 返回的Promise中包含帖子对象的数组
 */
Post.getUserPosts = async function (userId, page = 1, currentUserId) {
	if (!userId || userId < 0) {
		throw new Error("Invalid user id");
	}

	if (!page || page < 0) {
		throw new Error("Invalid page number");
	}

	const conditions = {
		is_tutorial: 0,
		user_id: userId,
		status: currentUserId === userId ? ['published', 'draft', 'suspended'] : ['published']
	};

	return await Post.findByConditions(conditions, page, currentUserId);
};

module.exports = Post;