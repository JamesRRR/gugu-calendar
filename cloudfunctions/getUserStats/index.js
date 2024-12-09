const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const eventsCollection = db.collection('events')
    
    // 获取创建的活动数量
    const createdEvents = await eventsCollection.where({
      creatorId: wxContext.OPENID
    }).count()

    // 获取参与的活动数量
    const joinedEvents = await eventsCollection.where({
      participants: wxContext.OPENID
    }).count()

    // 获取咕咕的活动数量
    const guguEvents = await eventsCollection.where({
      guguUsers: wxContext.OPENID
    }).count()

    // 计算咕咕率
    const guguRate = joinedEvents.total > 0 
      ? Math.round((guguEvents.total / joinedEvents.total) * 100) 
      : 0

    return {
      success: true,
      data: {
        createdCount: createdEvents.total,
        joinedCount: joinedEvents.total,
        guguCount: guguEvents.total,
        guguRate: `${guguRate}%`
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 