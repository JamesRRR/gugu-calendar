const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const logger = cloud.logger ? cloud.logger() : console

async function ensureCollectionExists(name) {
  try {
    if (typeof db.createCollection === 'function') {
      await db.createCollection(name)
    }
  } catch (e) {
    // ignore
  }
}

exports.main = async (event, context) => {
  try {
    const userId = event && event.userId
    console.log('Getting stats for user:', userId)
    if (!userId) {
      return { success: false, message: '参数错误' }
    }

    await ensureCollectionExists('users')
    await ensureCollectionExists('events')
    
    // 获取用户基本信息，包括 regretPoints
    const userResult = await db.collection('users')
      .where({
        _openid: userId
      })
      .get()

    console.log('User data:', userResult.data)

    // 获取用户参与的活动统计
    const eventsResult = await db.collection('events')
      .where({
        participants: _.all([userId])
      })
      .get()

    // 获取用户咕咕（未参加）的活动数量
    const guguCount = await db.collection('events')
      .where({
        participants: _.all([userId]),
        absentees: _.all([userId])
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
    // 若集合不存在，返回空统计而不是报错
    const errCode = err && (err.errCode || err.code)
    const errMsg = err && (err.errMsg || err.message)
    if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
      logger.warn({
        msg: 'getUserStats: collection missing',
        errCode,
        errMsg
      })
      return {
        success: true,
        stats: {
          totalGuguCount: 0,
          totalEvents: 0,
          completedEvents: 0,
          regretPoints: 0
        }
      }
    }
    console.error('获取用户统计信息失败：', err)
    return {
      success: false,
      error: err
    }
  }
} 