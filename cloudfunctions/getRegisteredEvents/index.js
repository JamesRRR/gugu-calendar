// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  const logger = cloud.logger ? cloud.logger() : console

  async function ensureCollectionExists(name) {
    try {
      if (typeof db.createCollection === 'function') {
        await db.createCollection(name)
      }
    } catch (e) {
      // ignore
    }
  }
  
  try {
    await ensureCollectionExists('events')

    // 查询用户参与的所有活动
    const result = await db.collection('events')
      // 查询用户是参与者或创建者的活动（participants 是数组字段）
      .where(_.or([
        { participants: _.all([wxContext.OPENID]) },
        { creator: _.eq(wxContext.OPENID) }
      ]))
      .orderBy('createTime', 'desc')
      .get()

    // 打印日志，方便调试
    console.log('Found events:', result.data);

    return {
      success: true,
      events: result.data.map(event => {
        return {
          ...event,
          participants: Array.isArray(event.participants) ? event.participants.filter(p => p != null) : [],
          paymentStatus: event.paymentStatus || {}
        };
      })
    };
  } catch (err) {
    // events 集合不存在时，直接返回空列表，避免前端报错
    const errCode = err && (err.errCode || err.code)
    const errMsg = err && (err.errMsg || err.message)
    if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
      logger.warn({
        msg: 'getRegisteredEvents: events collection missing',
        openid: wxContext.OPENID,
        errCode,
        errMsg
      })
      return { success: true, events: [] }
    }
    console.error('获取已注册活动失败:', err)
    return {
      success: false,
      message: err.message || '获取活动列表失败'
    }
  }
} 