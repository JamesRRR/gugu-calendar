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
        const users = userRes.data || []
        const byOpenid = new Map(users.map(u => [u._openid, u]))
        participants = eventData.participants.map(id => {
          return (
            byOpenid.get(id) || {
              _openid: id,
              nickName: '匿名用户',
              avatarUrl: ''
            }
          )
        })

        // 如果头像存的是云存储 fileID，则转成可访问的临时 URL 返回给小程序展示
        const fileIds = participants
          .map(p => p && p.avatarFileId)
          .filter(Boolean)
        if (fileIds.length > 0) {
          const tempRes = await cloud.getTempFileURL({ fileList: fileIds })
          const urlMap = new Map(
            (tempRes.fileList || [])
              .filter(x => x && x.fileID && x.tempFileURL)
              .map(x => [x.fileID, x.tempFileURL])
          )
          participants = participants.map(p => {
            const temp = p.avatarFileId && urlMap.get(p.avatarFileId)
            // 只要有 avatarFileId，就用最新临时链接覆盖（避免旧 temp URL 过期导致头像空白）
            if (temp) return { ...p, avatarUrl: temp }
            return p
          })
        }
      }
    } catch (e) {
      // users 集合可能不存在/无数据时不阻断详情页
      logger.warn({
        msg: 'getEventDetail: fetch participants failed',
        requestId,
        errCode: e && (e.errCode || e.code),
        errMsg: e && (e.errMsg || e.message)
      })
      participants = (eventData && Array.isArray(eventData.participants) ? eventData.participants : []).map(id => ({
        _openid: id,
        nickName: '匿名用户',
        avatarUrl: ''
      }))
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

