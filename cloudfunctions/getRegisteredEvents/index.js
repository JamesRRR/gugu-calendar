// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    // 查询用户参与的所有活动
    const result = await db.collection('events')
      .where({
        participants: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')  // 按创建时间倒序排列
      .get()

    return {
      success: true,
      events: result.data
    }
  } catch (err) {
    console.error('获取已注册活动失败:', err)
    return {
      success: false,
      message: err.message || '获取活动列表失败'
    }
  }
} 