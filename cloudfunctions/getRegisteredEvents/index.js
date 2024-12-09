// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 先获取用户的报名记录
    const registrations = await db.collection('registrations')
      .where({
        userId: openid  // 使用openid作为用户标识
      })
      .get()

    // 如果没有报名记录，直接返回空数组
    if (!registrations.data || registrations.data.length === 0) {
      return {
        data: [],
        errMsg: 'ok'
      }
    }

    // 获取所有已报名活动的ID
    const eventIds = registrations.data.map(reg => reg.eventId)

    // 查询这些活动的详细信息
    const events = await db.collection('events')
      .where({
        _id: _.in(eventIds)
      })
      .orderBy('startTime', 'desc')  // 按开始时间倒序排列
      .get()

    // 返回活动信息
    return {
      data: events.data,
      errMsg: 'ok'
    }

  } catch (err) {
    console.error(err)
    return {
      data: [],
      errMsg: err
    }
  }
} 