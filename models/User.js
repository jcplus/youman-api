const {DataTypes, Model, Op} = require('sequelize');
const sequelize = require('../config/db');
const jwtTool = require('../config/jwt');
// const Tag = require("./Tag");
// const PostCategory = require("./PostCategory");
// const Content = require("./Content");
// const Mention = require("./Mention");

const USER_ID_LENGTH = 8;

class User extends Model {}

User.init({
	id: {
		type: DataTypes.BIGINT.UNSIGNED,
		autoIncrement: true,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING(255),
		allowNull: false,
		defaultValue: '',
	},
	phone: {
		type: DataTypes.STRING(255),
		allowNull: false,
	},
	avatar: {
		type: DataTypes.STRING(255),
		allowNull: false,
		defaultValue: ''
	},
	gender: {
		type: DataTypes.ENUM('male', 'female'),
		allowNull: false,
		defaultValue: '',
	},
	age: {
		type: DataTypes.INTEGER.UNSIGNED,
		defaultValue: 0,
	},
	points: {
		type: DataTypes.INTEGER.UNSIGNED,
		defaultValue: 0,
	},
	is_vip: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false,
		defaultValue: 0,
	},
	is_wechat_user: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false,
		defaultValue: 0,
	},
	wechat_open_id: {
		type: DataTypes.STRING(512),
		allowNull: false,
		defaultValue: '',
	},
}, {
	sequelize,
	modelName: 'User',
	tableName: 'users',
	timestamps: true,
	underscored: true,
	defaultScope: {
		attributes: ['id', 'avatar', 'name', 'age', 'gender', 'points', 'is_vip']
	}
});

const random = function (n = 8, excludes = []) {
	let number = (Math.floor(Math.random() * 9) + 1).toString();
	for(let i = 1; i < n; i++) {
		number += Math.floor(Math.random() * 10).toString();
	}
	if (excludes.includes(number)) {
		return random(n, excludes);
	}
	return number;
};

const generateId = async function() {
	const users = await User.findAll();

	const ids = users.map(user => user.id.toString());
	return random(USER_ID_LENGTH, ids);
};

User.findById = async function(id) {
	return await this.findByPk(id);
};

/**
 * Login or create a new user based on phone number.
 *
 * @param {string} phone The user's phone number.
 * @param {string} openId The user's WeChat open ID (optional).
 * @returns {Promise<{user: object, token: string}|null>} Return user object and JWT token, or null if user cannot be created.
 */
User.loginUser = async function (phone, openId) {
	let user = await this.findOne({where: {phone: phone}});

	if (!user) {
		const id = await generateId();
		const name = `友漫${id}`;

		user = await this.create({
			id: id,
			phone: phone,
			name: name,
			is_wechat_user: typeof openId === 'string' && openId.length ? 1 : 0,
			wechat_open_id: openId || ''
		});
	} else if (typeof openId === 'string' && openId.length && !user.wechat_open_id) {
		// If user exists, but does not have a WeChat open ID, add it.
		user.is_wechat_user = 1;
		user.wechat_open_id = openId;
		await user.save();
	}

	if (user) {
		// If user exists, generate a JWT token.
		const token = jwtTool.sign(user.id);

		// Remove sensitive fields from the user object.
		user.phone = undefined;
		user.updatedAt = undefined;

		return {user, token};
	} else {
		// If user cannot be created, return null.
		return null;
	}
};


module.exports = User;
