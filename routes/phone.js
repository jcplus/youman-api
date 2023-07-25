const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

// 创建一个新的缓存实例，并设置默认过期时间（单位：秒）
const cache = new NodeCache({stdTTL: parseInt(process.env.VERIFICATION_CODE_EXPIRATION) * 60});

/**
 * 检查手机号是否符合中国的格式
 *
 * @param phoneNumber
 * @returns {boolean}
 */
function validatePhone(phoneNumber) {
	// 去掉所有非数字字符
	phoneNumber = phoneNumber.toString().replace(/\D/g, '');
	return /^1[3-9]\d{9}$/.test(phoneNumber);
}

async function validatePhoneAndCode(req, res, next) {
	// 检查请求体中是否存在 phone 和 code 字段
	if (!validateRequest(req, ['phone', 'code'])) {
		return res.status(400).json({errors: ['请求体中缺少 phone 或 code 字段'], code: 400});
	}

	let phoneNumber = req.body.phone;
	let verificationCode = req.body.code;

	if (!validatePhone(phoneNumber)) {
		return res.status(400).json({errors: ['手机号不能为空或格式不正确'], code: 400});
	}

	// 从缓存中获取验证码
	let cachedCode = cache.get(phoneNumber);

	// 验证码不存在或已过期
	if (!cachedCode) {
		return res.status(400).json({errors: ['验证码不存在或已过期'], code: 400});
	}

	// 验证码不匹配
	if (verificationCode.toString() !== cachedCode.toString()) {
		return res.status(400).json({errors: ['验证码不匹配'], code: 400});
	}

	// 删除验证码
	cache.del(phoneNumber);

	// 所有检查都通过，进入下一个中间件
	next();
}

function validateRequest(req, fields) {
	for (const field of fields) {
		if (!req.body || !req.body[field]) {
			return false;
		}
	}
	return true;
}

function sendSMSVerification(phoneNumber) {
	return new Promise((resolve, reject) => {
		const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
		console.log(`向 ${phoneNumber} 发送验证码 ${verificationCode}`);

		setTimeout(() => {
			// 将验证码保存到缓存中，以手机号为键
			cache.set(phoneNumber, verificationCode);
			console.log(`发送验证码 ${verificationCode} 到 ${phoneNumber} 成功`);
			resolve(verificationCode);
		}, 1000);
	});
}

router.post('/code', function (req, res, next) {
	// 检查请求体中是否存在 phone 字段
	if (!validateRequest(req, ['phone'])) {
		return res.status(400).json({errors: ['请求体中缺少 phone 字段'], code: 400});
	}

	let phoneNumber = req.body.phone;

	if (!validatePhone(phoneNumber)) {
		return res.status(400).json({errors: ['手机号不能为空或格式不正确'], code: 400});
	}

	// 如果验证通过，发送验证码
	sendSMSVerification(phoneNumber)
		.then((verificationCode) => {
			res.status(200).json({code: 200, verificationCode: verificationCode});
		})
		.catch((err) => {
			res.status(500).json({errors: ['验证码发送失败'], code: 500});
		});
});

router.post('/verify', validatePhoneAndCode, function (req, res, next) {
	// 验证成功
	res.status(200).json({message: "验证成功", code: 200});
});

router.post('/verify-login', validatePhoneAndCode, async function (req, res, next) {
	let phoneNumber = req.body.phone;

	// 验证成功后，根据手机号查询用户是否存在，如果null，则用户不存在，调用User模型生成一个新的用户，生成后
	// 返回用户ID生成的token
	// 如果用户存在，则调用User模型内的loginUser方法生成token并返回
	const {user, token} = await User.loginUser(phoneNumber);

	if (!user) {
		return res.status(500).json({errors: ['登陆失败'], code: 500});
	}

	// 验证成功
	res.status(200).json({data: user, token: token, code: 200});
});

module.exports = router;