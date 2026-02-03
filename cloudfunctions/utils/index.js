/**
 * Gugu Calendar 统一工具函数
 * 
 * 包含:
 * - 数据库集合创建
 * - 用户获取/创建
 * - 活动状态检查
 * - 取消活动逻辑
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const logger = cloud.logger ? cloud.logger() : console

/**
 * 确保集合存在
 */
async function ensureCollectionExists(name) {
  try {
    if (typeof db.createCollection === 'function') {
      await db.createCollection(name)
    }
  } catch (e) {
    // ignore
  }
}

/**
 * 获取或创建用户
 */
async function getOrCreateUser(openid, incomingUserInfo) {
  await ensureCollectionExists('users')
  
  const userRes = await db.collection('users').where({ _openid: openid }).get()
  
  if (userRes.data && userRes.data.length > 0) {
    return userRes.data[0]
  }

  // 创建新用户
  const incoming = incomingUserInfo || {}
  await db.collection('users').add({
    data: {
      _openid: openid,
      nickName: incoming.nickName || '匿名用户',
      avatarUrl: incoming.avatarUrl || '',
      avatarFileId: incoming.avatarFileId || '',
      regretPoints: 5,  // 新用户初始 5 点咕咕点数
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })

  // 返回创建的用户
  const retry = await db.collection('users').where({ _openid: openid }).get()
  return (retry.data && retry.data[0]) || null
}

/**
 * 获取活动信息，不存在则返回 null
 */
async function getEvent(eventId) {
  await ensureCollectionExists('events')
  const eventRes = await db.collection('events').doc(eventId).get()
  return eventRes.data
}

/**
 * 检查并取消活动 (超过50%退出/咕咕)
 * 返回: { cancelled: boolean, reason: string }
 */
async function checkAndCancelEvent(eventId) {
  const event = await getEvent(eventId)
  if (!event) {
    return { cancelled: false, reason: '活动不存在' }
  }

  const mode = event.mode || 'gugu'
  
  if (mode === 'gugu') {
    // 咕咕模式: 检查 absentees
    const absentees = event.absentees || []
    const participants = event.participants || []
    const absenteesCount = absentees.length
    const participantsCount = participants.length

    if (participantsCount > 0 && absenteesCount > participantsCount / 2) {
      await db.collection('events').doc(eventId).update({
        data: {
          status: 'cancelled',
          cancelledAt: db.serverDate(),
          cancelReason: 'gugu'
        }
      })
      return { cancelled: true, reason: '超过50%咕咕' }
    }
  } else if (mode === 'payment') {
    // 付款模式: 检查 quitUsers
    const quitUsers = event.quitUsers || []
    const participants = event.participants || []
    const quitCount = quitUsers.length
    const participantsCount = participants.length + quitCount

    if (participantsCount > 0 && quitCount > participantsCount / 2) {
      await db.collection('events').doc(eventId).update({
        data: {
          status: 'cancelled',
          cancelledAt: db.serverDate(),
          cancelReason: 'payment'
        }
      })
      return { cancelled: true, reason: '超过50%退出' }
    }
  }

  return { cancelled: false, reason: '' }
}

/**
 * 计算退款分配 (付款模式)
 * 返回: { totalForfeit, perPerson, recipients }
 */
function calculateRefundAllocation(event) {
  const mode = event.mode || 'gugu'
  
  if (mode !== 'payment') {
    return null
  }

  const paymentAmount = event.paymentAmount || 0
  const quitUsers = event.quitUsers || []
  const participants = event.participants || []
  
  const quitCount = quitUsers.length
  const remainingParticipants = participants.filter(p => !quitUsers.includes(p))
  
  if (quitCount === 0 || remainingParticipants.length === 0 || paymentAmount === 0) {
    return null
  }

  const totalForfeit = paymentAmount * quitCount
  const refundPerPerson = totalForfeit / remainingParticipants.length

  return {
    totalForfeit,
    perPerson: refundPerPerson,
    recipients: remainingParticipants.length,
    recipientIds: remainingParticipants
  }
}

module.exports = {
  ensureCollectionExists,
  getOrCreateUser,
  getEvent,
  checkAndCancelEvent,
  calculateRefundAllocation,
  db,
  _,
  logger
}
