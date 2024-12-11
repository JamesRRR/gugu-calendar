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
    const userCheck = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    if (userCheck.data.length === 0) {
      // 新用户，创建带有初始点数的记录
      await db.collection('users').add({
        data: {
          ...userInfo,
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
          ...userInfo
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
      error: err
    }
  }
} 