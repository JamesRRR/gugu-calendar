const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  try {
    // 检查用户是否已存在
    const user = await db.collection('users').where({
      openId: wxContext.OPENID
    }).get()

    if (user.data.length === 0) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          openId: wxContext.OPENID,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: db.serverDate()
        }
      })
    } else {
      // 更新现有用户
      await db.collection('users').where({
        openId: wxContext.OPENID
      }).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updateTime: db.serverDate()
        }
      })
    }

    return {
      success: true
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      message: err.message
    }
  }
} 