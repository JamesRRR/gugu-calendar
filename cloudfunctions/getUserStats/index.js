const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('Getting stats for user:', event.userId)
    
    // 获取用户基本信息，包括 regretPoints
    const userResult = await db.collection('users')
      .where({
        _openid: event.userId
      })
      .get()

    console.log('User data:', userResult.data)

    // 获取用户参与的活动统计
    const eventsResult = await db.collection('events')
      .where({
        participants: event.userId
      })
      .get()

    // 获取用户咕咕（未参加）的活动数量
    const guguCount = await db.collection('events')
      .where({
        participants: event.userId,
        absentees: event.userId
      })
      .count()

    const user = userResult.data[0] || {}
    const events = eventsResult.data || []
    
    // 计算完成的活动数（总活动减去咕咕次数）
    const totalEvents = events.length
    const completedEvents = totalEvents - guguCount.total

    const stats = {
      totalGuguCount: guguCount.total,
      totalEvents: totalEvents,
      completedEvents: completedEvents,
      regretPoints: user.regretPoints || 0
    }

    console.log('Returning stats:', stats)

    return {
      success: true,
      stats
    }
  } catch (err) {
    console.error('获取用户统计信息失败：', err)
    return {
      success: false,
      error: err
    }
  }
} 