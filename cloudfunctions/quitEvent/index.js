const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
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
  const { eventId } = event
  const requestId = context && (context.requestId || context.requestID)
  
  try {
    await ensureCollectionExists('events')

    const result = await db.collection('events').doc(eventId).update({
      data: {
        participants: db.command.pull(wxContext.OPENID),
        quitUsers: db.command.addToSet(wxContext.OPENID)
      }
    })

    return {
      success: true,
      requestId
    }
  } catch (err) {
    logger.error({
      msg: 'quitEvent: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '退出失败',
      requestId
    }
  }
} 