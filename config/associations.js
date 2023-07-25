const CommentComment = require('../models/CommentComment');
const Content = require('../models/Content');
const Favourite = require('../models/Favourite');
const PostLike = require('../models/PostLike');
const Message = require('../models/Message');
const Mention = require('../models/Mention');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const PostCategory = require('../models/PostCategory');
const PostCategoryRelation = require('../models/PostCategoryRelation');
const PostComment = require('../models/PostComment');
const PostTagRelation = require('../models/PostTagRelation');
const Tag = require('../models/Tag');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');

Post.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'author',
});

Mention.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'mentionedUser',
});

Post.belongsToMany(PostCategory, {
    through: PostCategoryRelation,
    foreignKey: 'post_id',
    otherKey: 'post_category_id',
    as: 'postcategories'
});

PostCategory.belongsToMany(Post, {
    through: PostCategoryRelation,
    foreignKey: 'post_category_id',
    otherKey: 'post_id',
    as: 'categoryPosts'
});

PostCategory.hasMany(PostCategoryRelation, {
    foreignKey: 'post_category_id',
    as: 'postCategoryRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

PostCategoryRelation.belongsTo(PostCategory, {
    foreignKey: 'post_category_id',
    as: 'categoryPostRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Post.hasMany(PostCategoryRelation, {
    foreignKey: 'post_id',
    as: 'postCategoryRelationsRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

PostCategoryRelation.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'categoryPostRelationsRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 表示一个用户可以被很多帖子提到（mention）
User.hasMany(Mention, {
    foreignKey: 'user_id',
    as: 'mentions',
});

// 表示一个帖子可以提到很多用户
Post.hasMany(Mention, {
    foreignKey: 'post_id',
    as: 'mentions',
});

// 表示一个提到（mention）属于一个用户
Mention.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

// 表示一个提到（mention）属于一个帖子
Mention.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'post',
});

// 表示一个内容（content）属于一个帖子
Content.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'contentPost',
});

// 表示一个帖子可以有很多内容（content）
Post.hasMany(Content, {
    foreignKey: 'post_id',
    as: 'contents',
});

// 表示一个帖子可以有很多标签关联（postTagRelation）
Post.hasMany(PostTagRelation, {
    foreignKey: 'post_id',
    as: 'postTagRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 表示一个帖子可以有很多标签（tag）
Post.belongsToMany(Tag, {
    through: PostTagRelation,
    foreignKey: 'post_id',
    otherKey: 'tag_id',
    as: 'tags'
});

// 表示一个标签关联（postTagRelation）属于一个帖子
PostTagRelation.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'relationPost',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 表示一个标签（tag）可以被很多帖子关联
Tag.belongsToMany(Post, {
    through: PostTagRelation,
    foreignKey: 'tag_id',
    otherKey: 'post_id',
    as: 'posts'
});

// 表示一个标签（tag）可以有很多标签关联（postTagRelation）
Tag.hasMany(PostTagRelation, {
    foreignKey: 'tag_id',
    as: 'tagPostRelations',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 表示一个标签关联（postTagRelation）属于一个标签（tag）
PostTagRelation.belongsTo(Tag, {
    foreignKey: 'tag_id',
    as: 'relationTag',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 表示一个用户可以点赞很多帖子
User.belongsToMany(Post, {
    through: PostLike,
    foreignKey: 'user_id',
    otherKey: 'post_id',
    as: 'userLikedPosts'
});

// 表示一个帖子可以被很多用户点赞
Post.belongsToMany(User, {
    through: PostLike,
    foreignKey: 'post_id',
    otherKey: 'user_id',
    as: 'postLikedByUsers'
});

// 一个帖子可以被很多用户点赞
Post.hasMany(PostLike, {
    foreignKey: 'post_id',
    as: 'postLikes',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 一个用户可以对很多帖子点赞
User.hasMany(PostLike, {
    foreignKey: 'user_id',
    as: 'userLikes',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 一个赞属于一个帖子
PostLike.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'likePost',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

// 一个赞属于一个用户
PostLike.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'likeUser',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

User.belongsToMany(User, {
    through: UserFollow,
    as: 'followers',
    foreignKey: 'following_id',
    otherKey: 'follower_id'
});

User.belongsToMany(User, {
    through: UserFollow,
    as: 'following',
    foreignKey: 'follower_id',
    otherKey: 'following_id'
});

UserFollow.belongsTo(User, {
    as: 'user_following',
    foreignKey: 'following_id'
});

User.hasMany(UserFollow, {
    as: 'followingRelations',
    foreignKey: 'follower_id',
    constraints: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

User.hasMany(Post, {
    foreignKey: 'user_id',
    as: 'posts'
});

Post.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});


User.hasMany(Favourite, {
    foreignKey: 'user_id'
});
Post.hasMany(Favourite, {
    foreignKey: 'post_id'
});
Favourite.belongsTo(User, {
    foreignKey: 'user_id'
});
Favourite.belongsTo(Post, {
    foreignKey: 'post_id'
});

// 用户和评论的关系
User.hasMany(PostComment, {
    foreignKey: 'user_id'
});

PostComment.belongsTo(User, {
    foreignKey: 'user_id'
});

// 帖子和评论的关系
Post.hasMany(PostComment, {
    foreignKey: 'post_id'
});

PostComment.belongsTo(Post, {
    foreignKey: 'post_id'
});

CommentComment.belongsTo(User, {
    foreignKey: 'user_id'
});

CommentComment.belongsTo(PostComment, {
    foreignKey: 'comment_id', as: 'postComment'
});

Message.belongsTo(User, {
    foreignKey: 'sender_id', targetKey: 'id'
});

Message.belongsTo(User, {
    foreignKey: 'receiver_id', targetKey: 'id'
});