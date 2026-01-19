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
    await ensureCollectionExists('users')

    const eventRes = await db.collection('events').doc(eventId).get()
    const eventData = eventRes.data

    const openid = wxContext.OPENID
    const isCreator = eventData && eventData.creator === openid
    const hasJoined =
      eventData && Array.isArray(eventData.participants) && eventData.participants.includes(openid)

    let participants = []
    try {
      if (eventData && Array.isArray(eventData.participants) && eventData.participants.length > 0) {
        const userRes = await db
          .collection('users')
          .where({
            _openid: _.in(eventData.participants)
          })
          .get()
        participants = userRes.data || []
      }
    } catch (e) {
      // users 集合可能不存在/无数据时不阻断详情页
      logger.warn({
        msg: 'getEventDetail: fetch participants failed',
        requestId,
        errCode: e && (e.errCode || e.code),
        errMsg: e && (e.errMsg || e.message)
      })
      participants = []
    }

    return {
      success: true,
      data: eventData,
      participants,
      isCreator,
      hasJoined,
      requestId
    }
  } catch (err) {
    logger.error({
      msg: 'getEventDetail: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '获取活动详情失败',
      requestId,
      error: {
        errCode: err && (err.errCode || err.code),
        errMsg: err && (err.errMsg || err.message)
      }
    }
  }
}

