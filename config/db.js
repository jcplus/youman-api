const {Sequelize} = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	dialect: 'mysql'
});

sequelize.authenticate()
	.then(() => {
		console.log('数据库连接成功。');
	})
	.catch(err => {
		console.error('无法连接到数据库:', err);
	});

module.exports = sequelize;
