const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  console.log('接收到的参数:', event);
  
  try {
    const wxContext = cloud.getWXContext()
    
    // 检查必要参数
    if (!event.title) {
      return {
        success: false,
        message: '活动标题不能为空'
      }
    }

    if (!event.eventDate) {
      return {
        success: false,
        message: '活动时间不能为空'
      }
    }

    // 创建活动记录
    const result = await db.collection('events').add({
      data: {
        title: event.title,
        description: event.description || '',
        eventDate: new Date(event.eventDate),
        creatorId: wxContext.OPENID,
        isCancelled: false,
        guguCount: 0,
        participantCount: 1,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    console.log('创建结果:', result);

    return {
      success: true,
      data: result._id
    }

  } catch (err) {
    console.error('创建活动失败:', err);
    return {
      success: false,
      message: err.message || '创建失败，请重试'
    }
  }
} 