const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const dotenv = require('dotenv');
dotenv.config();

// 设置一个缓存实例，并设置默认过期时间（单位：天）
const cache = new NodeCache({ stdTTL: parseInt(process.env.JWT_EXPIRATION) * 24 * 60 * 60 });

function sign(userId) {
	// 生成JWT Token
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: `${process.env.JWT_EXPIRATION}d` });
	// 将token保存在缓存中
	cache.set(token, userId);
	return token;
}

function verify(token) {
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// 检查缓存中是否存在该token
		const cachedUserId = cache.get(token);
		if (!cachedUserId || cachedUserId !== decoded.userId) {
			return null;
		}
		return decoded.userId;
	} catch (err) {
		console.error('Token verification failed', err);
		return null;
	}
}

function invalidate(token) {
	// 删除缓存中的token
	cache.del(token);
}

module.exports = {
	sign,
	verify,
	invalidate
};
