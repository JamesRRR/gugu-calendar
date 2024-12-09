const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    console.log('接收到的活动数据:', event)

    // 准备要存储的数据
    const eventData = {
      title: event.title,
      description: event.description,
      location: event.location,
      maxParticipants: event.maxParticipants,
      startTime: event.startTime,
      status: event.status,
      creatorId: wxContext.OPENID,
      participants: [wxContext.OPENID],
      createTime: db.serverDate()
    }

    console.log('准备创建活动:', eventData)

    const result = await db.collection('events').add({
      data: eventData
    })

    console.log('活动创建结果:', result)

    // 修改返回结构，确保返回正确的 eventId
    return {
      success: true,
      eventId: result._id  // 直接返回 _id 作为 eventId
    }
  } catch (err) {
    console.error('创建活动失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 