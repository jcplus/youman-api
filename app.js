const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Middleware
const errorLog = require('./middleware/errorLog');

const app = express();

require('./config/associations');

app.set('etag', false);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const chatRouter = require('./routes/chat');
const CommentRouter = require('./routes/comment');
const FavouriteRouter = require('./routes/favourite');
const FollowRouter = require('./routes/follow');
const LikeRouter = require('./routes/like');
const messageRouter = require('./routes/message');
const notificationRouter = require('./routes/notification');
const phoneRouter = require('./routes/phone');
const postRouter = require('./routes/post');
const promptRouter = require('./routes/prompt');
const recommendRouter = require('./routes/recommend');
const tutorialRouter = require('./routes/tutorial');
const userRouter = require('./routes/user');
const wechatRouter = require('./routes/wechat');

app.get('/api', (req, res) => {
	res.json({
		name: '友漫API',
		version: '1.0.0'
	});
});

app.use('/api/chat', chatRouter);
app.use('/api/comment', CommentRouter);
app.use('/api/favourite', FavouriteRouter);
app.use('/api/follow', FollowRouter);
app.use('/api/like', LikeRouter);
app.use('/api/message', messageRouter);
app.use('/api/notification', notificationRouter);
app.use('/api/phone', phoneRouter);
app.use('/api/post', postRouter);
app.use('/api/prompt', promptRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/tutorial', tutorialRouter);
app.use('/api/user', userRouter);
app.use('/api/wechat', wechatRouter);

// Error handler
app.use(errorLog);

module.exports = app;
