const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId } = event
  
  try {
    // 获取用户参与的所有活动
    const events = await db.collection('events')
      .where({
        participants: userId
      })
      .get()
      .then(res => res.data)

    // 统计数据
    const stats = events.reduce((acc, event) => {
      acc.totalEvents++
      if (event.status === 'gugu') {
        acc.totalGuguCount++
      } else if (event.status === 'completed') {
        acc.completedEvents++
      }
      return acc
    }, {
      totalEvents: 0,
      totalGuguCount: 0,
      completedEvents: 0
    })

    return {
      success: true,
      stats
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      message: err.message
    }
  }
} 