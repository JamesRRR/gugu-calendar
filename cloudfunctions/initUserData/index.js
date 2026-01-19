const cloud = require('wx-server-sdk')
cloud.init()
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
  const openid = wxContext.OPENID

  try {
    await ensureCollectionExists('users')

    // 检查用户是否已存在
    const userCheck = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userCheck.data.length === 0) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: event.userInfo.nickName || '未命名用户',
          avatarUrl: event.userInfo.avatarUrl || '',
          totalEvents: 0,
          guguCount: 0,
          attendRate: '0%',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    return {
      success: true
    }
  } catch (err) {
    const errCode = err && (err.errCode || err.code)
    const errMsg = err && (err.errMsg || err.message)
    if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
      logger.warn({
        msg: 'initUserData: users collection missing',
        openid,
        errCode,
        errMsg
      })
      try {
        await ensureCollectionExists('users')
        await db.collection('users').add({
          data: {
            _openid: openid,
            nickName: (event && event.userInfo && event.userInfo.nickName) || '未命名用户',
            avatarUrl: (event && event.userInfo && event.userInfo.avatarUrl) || '',
            totalEvents: 0,
            guguCount: 0,
            attendRate: '0%',
            regretPoints: 5,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        return { success: true }
      } catch (e) {
        return { success: false, error: e }
      }
    }
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
} 