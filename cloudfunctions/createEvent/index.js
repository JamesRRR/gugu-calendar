const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const result = await db.collection('events').add({
      data: {
        title: event.title,
        dateTime: event.dateTime,
        location: event.location,
        description: event.description,
        maxParticipants: event.maxParticipants || 0,
        participants: [wxContext.OPENID],
        creatorId: wxContext.OPENID,
        createdAt: new Date(),
        status: 'active'
      }
    })

    return {
      success: true,
      eventId: result._id
    }
  } catch (err) {
    return {
      success: false,
      error: err
    }
  }
} 