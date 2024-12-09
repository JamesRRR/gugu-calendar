const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 查找或创建用户
    const userCollection = db.collection('users')
    const user = await userCollection.where({
      openId: wxContext.OPENID
    }).get()

    if (user.data.length === 0) {
      // 新用户，创建记录
      await userCollection.add({
        data: {
          openId: wxContext.OPENID,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }

    return {
      success: true,
      openId: wxContext.OPENID,
      appId: wxContext.APPID,
      unionId: wxContext.UNIONID,
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 