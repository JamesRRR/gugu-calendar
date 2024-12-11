const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
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
    console.error('Monthly points update failed:', err)
    return {
      success: false,
      error: err
    }
  }
} 