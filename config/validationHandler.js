const {validationResult} = require('express-validator');

const validationHandler = function (req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map(error => error.msg);
		return res.status(400).json({errors: errorMessages, code: 400});
	}
	next();
}

module.exports = validationHandler;
