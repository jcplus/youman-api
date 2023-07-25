// config/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
	// 从请求头部获取JWT
	const token = req.headers['authorization']?.split(' ')[1];

	if (!token) {
		return res.status(403).json({errors: ['未提供认证令牌'], code: 403});
	}

	// 验证JWT并解码
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).json({errors: ['无效的认证令牌'], code: 403});
		}

		// 将解码后的用户ID附加到请求对象上
		req.userId = decoded.userId;

		// 进入下一个中间件
		next();
	});
}
