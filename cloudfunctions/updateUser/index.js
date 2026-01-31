const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

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
  const { userInfo } = event
  
  try {
    await ensureCollectionExists('users')

    const safeUserInfo = userInfo || {}
    const isBadNickName = (name) => !name || name === '微信用户' || name === '匿名用户'
    const isBadAvatar = (url) => !url || url.startsWith('wxfile://')

    const patch = {}
    if (!isBadNickName(safeUserInfo.nickName)) patch.nickName = safeUserInfo.nickName
    if (!isBadAvatar(safeUserInfo.avatarUrl)) patch.avatarUrl = safeUserInfo.avatarUrl
    if (safeUserInfo.avatarFileId) patch.avatarFileId = safeUserInfo.avatarFileId
    // 可选字段（不强制）
    if (safeUserInfo.gender !== undefined) patch.gender = safeUserInfo.gender
    if (safeUserInfo.language) patch.language = safeUserInfo.language
    if (safeUserInfo.country) patch.country = safeUserInfo.country
    if (safeUserInfo.province) patch.province = safeUserInfo.province
    if (safeUserInfo.city) patch.city = safeUserInfo.city
    patch.updateTime = db.serverDate()

    // 检查用户是否已存在
    const userCheck = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    if (userCheck.data.length === 0) {
      // 新用户，创建带有初始点数的记录
      await db.collection('users').add({
        data: {
          ...patch,
          _openid: wxContext.OPENID,
          regretPoints: 5,  // 初始点数
          lastPointsUpdate: db.serverDate(),  // 记录最后更新时间
          createTime: db.serverDate()
        }
      })
    } else {
      // 已存在的用户，只更新用户信息
      await db.collection('users').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          ...patch
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
        msg: 'updateUser: users collection missing',
        openid: wxContext.OPENID,
        errCode,
        errMsg
      })
      // 尝试创建后重试一次（最常见是新环境首次写入）
      try {
        await ensureCollectionExists('users')
        await db.collection('users').add({
          data: {
            ...userInfo,
            _openid: wxContext.OPENID,
            regretPoints: 5,
            lastPointsUpdate: db.serverDate(),
            createTime: db.serverDate()
          }
        })
        return { success: true }
      } catch (e) {
        return { success: false, error: e, message: (e && (e.errMsg || e.message)) || '更新失败' }
      }
    }
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
} 