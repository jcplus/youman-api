const ErrorLog = require('../models/ErrorLog');

const errorLog = function (err, req, res, next) {
	console.error(err);
	ErrorLog.create({
		message: err.message,
		stack: err.stack
	}).then(errorLog => {
		console.log('Error log saved with id: ', errorLog.id);
	}).catch(err => {
		console.error('Failed to save error log: ', err);
	});
	res.status(500).send({errors: ['服务器错误'], code: 500});
}

module.exports = errorLog;