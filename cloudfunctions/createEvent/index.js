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
      description: event.description || '',
      location: event.location, // 现在包含经纬度和地址名称
      maxParticipants: event.maxParticipants || null,
      startTime: event.startTime,
      endTime: event.endTime || null,
      regretPointsRequired: event.regretPointsRequired || 1, // 新增：咕咕点数要求
      status: 'pending',
      creatorId: wxContext.OPENID,
      participants: [wxContext.OPENID],
      createTime: db.serverDate()
    }

    console.log('准备创建活动:', eventData)

    const result = await db.collection('events').add({
      data: eventData
    })

    console.log('活动创建结果:', result)

    return {
      success: true,
      eventId: result._id
    }
  } catch (err) {
    console.error('创建活动失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 