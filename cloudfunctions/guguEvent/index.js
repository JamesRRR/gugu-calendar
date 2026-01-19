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
  const wxContext = cloud.getWXContext()
  const eventId = event.eventId
  const requestId = context && (context.requestId || context.requestID)
  
  try {
    await ensureCollectionExists('events')
    await ensureCollectionExists('users')

    // 获取活动信息
    const eventResult = await db.collection('events').doc(eventId).get()
    const eventData = eventResult.data
    
    // 获取用户信息以检查咕咕点数
    const userResult = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    const user = userResult.data[0]
    if (!user) {
      return { success: false, message: '用户不存在，请先登录', requestId }
    }
    const requiredPoints = eventData.regretPointsRequired || 1

    // 检查用户是否有足够的咕咕点数
    if (user.regretPoints < requiredPoints) {
      return {
        success: false,
        message: '咕咕点数不足'
      }
    }

    // 开始事务
    const transaction = await db.startTransaction()
    
    try {
      // 更新用户的咕咕点数
      await transaction.collection('users')
        .where({
          _openid: wxContext.OPENID
        })
        .update({
          data: {
            regretPoints: _.inc(-requiredPoints)
          }
        })

      // 更新活动状态，添加用户到咕咕名单
      await transaction.collection('events')
        .doc(eventId)
        .update({
          data: {
            absentees: _.addToSet(wxContext.OPENID)
          }
        })

      // 提交事务
      await transaction.commit()

      // 检查是否需要取消活动（超过半数参与者咕咕）
      const updatedEvent = await db.collection('events').doc(eventId).get()
      const absenteesCount = (updatedEvent.data.absentees || []).length
      const participantsCount = updatedEvent.data.participants.length
      
      let cancelled = false
      
      if (absenteesCount > participantsCount / 2) {
        // 取消活动
        await db.collection('events').doc(eventId).update({
          data: {
            status: 'cancelled'
          }
        })
        cancelled = true
      }

      return {
        success: true,
        cancelled,
        message: '咕咕成功',
        requestId
      }
    } catch (err) {
      // 如果事务执行失败，回滚所有操作
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    logger.error({
      msg: 'guguEvent: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '咕咕失败',
      requestId
    }
  }
} 