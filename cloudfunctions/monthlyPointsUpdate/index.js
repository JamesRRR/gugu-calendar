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
    await ensureCollectionExists('users')

    // 更新所有用户的咕咕点数
    const result = await db.collection('users').where({
      regretPoints: _.exists(true)  // 确保字段存在
    }).update({
      data: {
        regretPoints: _.inc(3),  // 增加3点
        lastPointsUpdate: db.serverDate()
      }
    })

    console.log('Monthly points update completed:', result)
    
    return {
      success: true,
      updatedCount: result.updated
    }
  } catch (err) {
    const errCode = err && (err.errCode || err.code)
    const errMsg = err && (err.errMsg || err.message)
    if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
      logger.warn({
        msg: 'monthlyPointsUpdate: users collection missing',
        errCode,
        errMsg
      })
      return { success: true, updatedCount: 0 }
    }
    console.error('Monthly points update failed:', err)
    return {
      success: false,
      error: err
    }
  }
} 