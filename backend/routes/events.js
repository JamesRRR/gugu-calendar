const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// 创建活动
router.post('/events', eventController.createEvent);

// 获取活动列表
router.get('/events', eventController.getEvents);

// 分享活动
router.post('/events/:id/share', eventController.shareEvent);

// 加入活动
router.post('/events/:id/join', eventController.joinEvent);

// 咕咕活动
router.post('/events/:id/gugu', eventController.guguEvent);

// 获取活动状态
router.get('/events/:id/status', eventController.getEventStatus);

module.exports = router; 