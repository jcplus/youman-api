const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const {query} = require('express-validator');
const Post = require('../models/Post');
const dotenv = require('dotenv');
const validationHandler = require("../config/validationHandler");
dotenv.config();

router.get('/',
	auth,
	query('page').optional().isInt({min: 1}).withMessage('page必须是大于0的整数').toInt(),
	validationHandler,
	async function (req, res, next) {
		try {
			let {page} = req.query;
			if (!page) page = 1;

			const result = await Post.getTutorials(page);
			result.code = 200;

			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({errors: [error.message], code: 500});
		}
	}
);

module.exports = router;