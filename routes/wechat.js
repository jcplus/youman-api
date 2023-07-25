const axios = require('axios');
const express = require('express');
const https = require('https');
const moment = require('moment');
const router = express.Router();
const {cashOut, convertPointToCny, decryptData, pay} = require('../util/WeChat');
require('dotenv').config();

// 中间件
const auth = require('../config/auth');
const {body} = require('express-validator');
const validationHandler = require('../config/validationHandler');

// 模型
const Order = require('../models/Order');
const User = require('../models/User');
const ErrorLog = require('../models/ErrorLog');
const Transaction = require('../models/Transaction');


/**
 * POST /cash-out
 * Cash the points out
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/cash-out',
	auth,
	body('points').isInt({min: 10}).withMessage('points必须是大于等于1000的数字').toInt(),
	async (req, res, next) => {
		try {
			const {points} = req.body;
			if (points < 10) {
				res.status(400).json({errors: ['提现点数不能小于10'], code: 400});
			}

			const user = await User.findByPk(req.userId);
			if (points > user.points) {
				res.status(400).json({errors: ['提现点数不能大于当前点数'], code: 400});
			}

			const amount = convertPointToCny(points);
			const transaction = await Transaction.create({
				user_id: req.userId,
				type: 'cashout',
				amount: amount,
				status: 'pending'
			});

			await cashOut(user.wechat_open_id, transaction.id, amount);
		} catch (error) {
			next(error);
		}
	}
);


/**
 * POST /login
 * Login with WeChat mini-program
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/login',
	[
		body('code').notEmpty().withMessage('code不能为空'),
		body('enc').notEmpty().withMessage('enc不能为空'),
		body('iv').notEmpty().withMessage('iv不能为空'),
	],
	validationHandler,
	async function (req, res, next) {
		const {code, enc, iv} = req.body;

		try {
			// Get open_id and session_key
			const result = await axios({
				method: 'GET',
				url: 'https://api.weixin.qq.com/sns/jscode2session',
				params: {
					appid: appId,
					secret: appSecret,
					js_code: code,
					grant_type: 'authorization_code'
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false
				})
			});

			const data = result.data;
			if (data.errcode) {
				throw new Error(data.errmsg);
			}

			const {openid, session_key} = result.data;
			const decrypted = decryptData(enc, iv, session_key);
			const {phone} = decrypted;
			const {user, token} = await User.loginUser(phone, openid);

			if (!user) {
				return res.status(500).json({errors: ['登陆失败'], code: 500});
			}

			// 验证成功
			res.status(200).json({data: user, token: token, code: 200});

		} catch (error) {
			next(error);
		}
	}
);

/**
 * POST /order-notify-callback
 * For WeChat callback after order created
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
router.post('/order-notify-callback',
	express.raw({type: 'application/xml'}),
	async (req, res) => {
		res.set('Content-Type', 'application/xml');
		const builder = new xml2js.Builder({rootName: 'xml', headless: true});

		try {
			const notifyJson = await xml2js.parseStringPromise(req.body.notifyData);
			const data = notifyJson.xml;
			const orderId = data.out_trade_no[0];
			const orderData = {
				status: data.result_code[0] === 'SUCCESS' ? 'completed' : 'pending',
				cash_fee: parseInt(data.total_fee[0]),
				is_subscribe: data.is_subscribe[0] === 'Y' ? 1 : 0,
				trade_type: data.trade_type[0],
				transaction_id: data.transaction_id[0],
				bank_type: data.bank_type[0],
				fee_type: data.fee_type[0],
				wechat_timestamp: moment(data.time_end[0], "YYYYMMDDHHmmss").format('YYYY-MM-DD HH:mm:ss'),
			};

			const order = await Order.findOne({where: {id: orderId}});
			const result = await Order.update(orderData, {where: {id: orderId}});
			if (!result || result[0] === 0) {
				throw new Error(`无法找到商户订单${orderId}`);
			}

			await Transaction.create({
				user_id: order.user_id,
				type: 'recharge',
				amount: order.total_fee,
				status: 'complete'
			});

			const xml = builder.buildObject({
				return_code: 'SUCCESS',
				return_msg: 'OK',
			});
			res.status(200).send(xml);
		} catch (error) {
			ErrorLog.create({
				message: error.message,
				stack: error.stack
			}).catch(err => {
				console.error('Failed to save error log: ', err);
			});

			const xml = builder.buildObject({
				return_code: 'FAIL',
				return_msg: error.message,
			});
			res.status(500).send(xml);
		}
	}
);


/**
 * POST /recharge
 * Create a WeChat order to recharge points
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
router.post('/recharge',
	auth,
	body('points').isInt({min: 10}).withMessage('points必须是不小于10的数字').toInt(),
	async (req, res, next) => {
		try {
			const {points} = req.body;
			const fee = convertPointToCny(points);

			if (points % 10 !== 0) {
				return res.status(400).send({errors: ['points必须是10的倍数'], code: 400});
			}

			const user = await User.findOne({
				attributes: ['id', 'is_wechat_user', 'wechat_open_id'],
				where: {
					id: req.userId
				}
			});

			if (!user.is_wechat_user) {
				return res.status(400).send({errors: ['非微信用户'], code: 400});
			}

			// Create a local merchant order
			const order = await Order.create({
				user_id: req.userId,
				points: points,
				total_fee: fee,
			});

			const orderData = {
				description: '购买友漫点数',
				out_trade_no: order.id.toString(),
				amount: {
					total: fee,
					currency: 'CNY'
				},
				payer: {
					openid: user.wechat_open_id
				}
			};

			const result = await pay(orderData);
			res.status(200).json({data: result, code: 200});
		} catch (error) {
			console.log(error)
			next(error);
		}
	}
);

module.exports = router;