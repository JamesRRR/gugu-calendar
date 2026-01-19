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
  const requestId = context && (context.requestId || context.requestID)
  const { eventId } = event || {}

  if (!eventId) {
    return { success: false, message: '参数错误', requestId }
  }

  try {
    await ensureCollectionExists('events')

    const openid = wxContext.OPENID
    const eventRes = await db.collection('events').doc(eventId).get()
    const eventData = eventRes.data

    if (!eventData) {
      return { success: false, message: '活动不存在', requestId }
    }

    if (eventData.status === 'cancelled') {
      return { success: false, message: '活动已取消', requestId }
    }

    const participants = Array.isArray(eventData.participants) ? eventData.participants : []
    if (participants.includes(openid)) {
      return { success: true, message: '已加入', requestId }
    }

    if (eventData.maxParticipants && participants.length >= eventData.maxParticipants) {
      return { success: false, message: '人数已满', requestId }
    }

    await db.collection('events').doc(eventId).update({
      data: {
        participants: _.addToSet(openid),
        quitUsers: _.pull(openid)
      }
    })

    logger.info({
      msg: 'joinEvent: joined',
      requestId,
      openid,
      eventId
    })

    return { success: true, requestId }
  } catch (err) {
    logger.error({
      msg: 'joinEvent: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '加入失败',
      requestId,
      error: {
        errCode: err && (err.errCode || err.code),
        errMsg: err && (err.errMsg || err.message)
      }
    }
  }
}

