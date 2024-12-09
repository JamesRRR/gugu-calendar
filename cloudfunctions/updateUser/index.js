const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  try {
    const result = await db.collection('users').where({
      openId: wxContext.OPENID
    }).update({
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 