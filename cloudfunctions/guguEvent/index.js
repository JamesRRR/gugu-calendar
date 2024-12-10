const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { eventId } = event
  
  try {
    // 获取活动信息
    const eventData = await db.collection('events').doc(eventId).get()
    const currentEvent = eventData.data
    
    // 添加咕咕记录
    const guguUsers = currentEvent.guguUsers || []
    if (!guguUsers.includes(wxContext.OPENID)) {
      guguUsers.push(wxContext.OPENID)
    }
    
    // 检查咕咕人数是否超过半数
    const shouldCancel = guguUsers.length > currentEvent.participants.length / 2
    
    // 更新活动状态
    await db.collection('events').doc(eventId).update({
      data: {
        guguUsers,
        status: shouldCancel ? 'cancelled' : 'gugu'
      }
    })

    return {
      success: true,
      cancelled: shouldCancel
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 