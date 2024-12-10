const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { eventId } = event
  
  try {
    const result = await db.collection('events').doc(eventId).update({
      data: {
        participants: db.command.pull(wxContext.OPENID)
      }
    })

    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
} 