const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userIds } = event
  
  if (!userIds || !Array.isArray(userIds)) {
    return {
      success: false,
      message: '参数错误'
    }
  }

  try {
    // 获取用户信息
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          // 这里可以根据实际需求从用户集合中获取更多信息
          return {
            openId: userId,
            // 可以添加其他用户信息字段
          }
        } catch (err) {
          console.error('获取用户信息失败:', err)
          return {
            openId: userId,
            error: '获取用户信息失败'
          }
        }
      })
    )

    return {
      success: true,
      users
    }
  } catch (err) {
    console.error('获取用户列表失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 