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

async function getOrUpsertUser(openid, incomingUserInfo) {
  await ensureCollectionExists('users')
  const incoming = incomingUserInfo || {}
  const nickName = incoming.nickName || '匿名用户'
  const avatarUrl = incoming.avatarUrl || ''
  const avatarFileId = incoming.avatarFileId || ''

  const isBadNickName = (name) => !name || name === '微信用户' || name === '匿名用户'
  const isBadAvatar = (url) => !url || url.startsWith('wxfile://')
  const isBadAvatarFileId = (id) => !id

  const existing = await db.collection('users').where({ _openid: openid }).get()
  if (existing.data && existing.data.length > 0) {
    // 补齐缺失字段（不强行覆盖用户已有数据）
    const current = existing.data[0]
    const patch = {}
    if ((isBadNickName(current.nickName) && !isBadNickName(nickName))) patch.nickName = nickName
    if ((isBadAvatar(current.avatarUrl) && !isBadAvatar(avatarUrl))) patch.avatarUrl = avatarUrl
    if ((isBadAvatarFileId(current.avatarFileId) && !isBadAvatarFileId(avatarFileId))) patch.avatarFileId = avatarFileId
    if (Object.keys(patch).length > 0) {
      await db.collection('users').where({ _openid: openid }).update({
        data: {
          ...patch,
          updateTime: db.serverDate()
        }
      })
    }
    return
  }

  await db.collection('users').add({
    data: {
      _openid: openid,
      nickName: isBadNickName(nickName) ? '匿名用户' : nickName,
      avatarUrl: isBadAvatar(avatarUrl) ? '' : avatarUrl,
      avatarFileId: isBadAvatarFileId(avatarFileId) ? '' : avatarFileId,
      regretPoints: 5,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const requestId = context && (context.requestId || context.requestID || context.RequestId)
  const { eventId, userInfo } = event || {}

  if (!eventId) {
    return { success: false, message: '参数错误', requestId }
  }

  try {
    await ensureCollectionExists('events')
    await getOrUpsertUser(wxContext.OPENID, userInfo)

    // 强制要求用户已授权昵称+头像（否则不允许加入，避免匿名用户污染参与者列表）
    await ensureCollectionExists('users')
    const userRes = await db.collection('users').where({ _openid: wxContext.OPENID }).get()
    const me = userRes.data && userRes.data[0]
    const isBadNickName = (name) => !name || name === '微信用户' || name === '匿名用户'
    const isBadAvatar = (url) => !url || url.startsWith('wxfile://')
    const hasAvatar = me && (!isBadAvatar(me.avatarUrl) || !!me.avatarFileId)
    if (!me || isBadNickName(me.nickName) || !hasAvatar) {
      const incoming = userInfo || {}
      logger.warn({
        msg: 'joinEvent: NEED_PROFILE',
        requestId,
        openid: wxContext.OPENID,
        me: me
          ? {
              nickName: me.nickName,
              hasAvatarUrl: !!me.avatarUrl,
              avatarUrlPrefix: typeof me.avatarUrl === 'string' ? me.avatarUrl.slice(0, 20) : '',
              hasAvatarFileId: !!me.avatarFileId
            }
          : null,
        incoming: {
          nickName: incoming.nickName,
          hasAvatarUrl: !!incoming.avatarUrl,
          avatarUrlPrefix: typeof incoming.avatarUrl === 'string' ? incoming.avatarUrl.slice(0, 20) : '',
          hasAvatarFileId: !!incoming.avatarFileId
        }
      })
      return {
        success: false,
        code: 'NEED_PROFILE',
        message: '请先登录授权头像和昵称后再加入',
        requestId,
        debug: {
          meExists: !!me,
          meNickName: me && me.nickName,
          meHasAvatarUrl: !!(me && me.avatarUrl),
          meHasAvatarFileId: !!(me && me.avatarFileId),
          incomingNickName: incoming.nickName,
          incomingHasAvatarUrl: !!incoming.avatarUrl,
          incomingHasAvatarFileId: !!incoming.avatarFileId
        }
      }
    }

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

