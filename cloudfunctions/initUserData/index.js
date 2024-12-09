const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
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
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
} 