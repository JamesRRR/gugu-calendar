const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, eventId } = event
  
  try {
    switch (action) {
      case 'quit':
        return await handleQuit(eventId, wxContext.OPENID)
      case 'gugu':
        return await handleGugu(eventId, wxContext.OPENID)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

async function handleQuit(eventId, userId) {
  const event = await db.collection('events').doc(eventId).get()
  if (!event.data) {
    throw new Error('活动不存在')
  }

  await db.collection('events').doc(eventId).update({
    data: {
      participantCount: _.inc(-1)
    }
  })

  return {
    success: true,
    message: '退出成功'
  }
}

async function handleGugu(eventId, userId) {
  const event = await db.collection('events').doc(eventId).get()
  if (!event.data) {
    throw new Error('活动不存在')
  }

  await db.collection('events').doc(eventId).update({
    data: {
      guguCount: _.inc(1)
    }
  })

  // 如果咕咕次数达到阈值，取消活动
  if (event.data.guguCount + 1 >= event.data.participantCount / 2) {
    await db.collection('events').doc(eventId).update({
      data: {
        isCancelled: true
      }
    })
    return {
      success: true,
      message: '咕咕成功，活动已取消'
    }
  }

  return {
    success: true,
    message: '咕咕成功'
  }
} 