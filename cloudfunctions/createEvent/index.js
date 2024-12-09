const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  switch(event.action) {
    case 'create':
      return await createEvent(event, wxContext)
    case 'join':
      return await joinEvent(event, wxContext)
    case 'leave':
      return await leaveEvent(event, wxContext)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

async function createEvent(event, wxContext) {
  try {
    if (!event.title || !event.eventDate) {
      return {
        success: false,
        message: '必填信息不完整'
      }
    }

    const result = await db.collection('events').add({
      data: {
        title: event.title,
        description: event.description || '',
        eventDate: new Date(event.eventDate),
        creatorId: wxContext.OPENID,
        participants: [wxContext.OPENID], // 创建者默认参与
        isCancelled: false,
        guguCount: 0,
        participantCount: 1,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      data: result._id
    }
  } catch (err) {
    console.error('创建活动失败:', err)
    return {
      success: false,
      message: err.message || '创建失败'
    }
  }
}

async function joinEvent(event, wxContext) {
  try {
    const eventDoc = await db.collection('events').doc(event.eventId).get()
    
    if (eventDoc.data.participants.includes(wxContext.OPENID)) {
      return {
        success: false,
        message: '您已经参加过这个活动了'
      }
    }

    await db.collection('events').doc(event.eventId).update({
      data: {
        participants: db.command.push(wxContext.OPENID),
        participantCount: db.command.inc(1),
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      message: '成功加入活动'
    }
  } catch (err) {
    console.error('加入活动失败:', err)
    return {
      success: false,
      message: err.message || '加入失败'
    }
  }
}

async function leaveEvent(event, wxContext) {
  try {
    const eventDoc = await db.collection('events').doc(event.eventId).get()
    
    if (!eventDoc.data.participants.includes(wxContext.OPENID)) {
      return {
        success: false,
        message: '您还未参加此活动'
      }
    }

    if (eventDoc.data.creatorId === wxContext.OPENID) {
      return {
        success: false,
        message: '创建者不能退出活动'
      }
    }

    await db.collection('events').doc(event.eventId).update({
      data: {
        participants: db.command.pull(wxContext.OPENID),
        participantCount: db.command.inc(-1),
        updatedAt: db.serverDate()
      }
    })

    return {
      success: true,
      message: '成功退出活动'
    }
  } catch (err) {
    console.error('退出活动失败:', err)
    return {
      success: false,
      message: err.message || '退出失败'
    }
  }
} 