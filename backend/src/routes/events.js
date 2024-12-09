const express = require('express');
const router = express.Router();
const db = require('../db');

// 创建活动
router.post('/', async (req, res) => {
  try {
    const { title, description, eventDate } = req.body;
    const result = await db.query(
      'INSERT INTO events (title, description, event_date) VALUES ($1, $2, $3) RETURNING *',
      [title, description, eventDate]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取活动详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 