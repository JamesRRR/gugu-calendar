const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const logger = cloud.logger ? cloud.logger() : console

async function ensureCollectionExists(name) {
  try {
    if (typeof db.createCollection === 'function') {
      await db.createCollection(name)
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const requestId = context && (context.requestId || context.requestID)

  try {
    const { mode, paymentAmount, totalAmount, ...eventData } = event;

    // 开始/结束时间必填校验
    const startTime = eventData && eventData.startTime
    const endTime = eventData && eventData.endTime
    if (typeof startTime !== 'number' || Number.isNaN(startTime)) {
      return { success: false, message: '开始时间必填', requestId }
    }
    if (typeof endTime !== 'number' || Number.isNaN(endTime)) {
      return { success: false, message: '结束时间必填', requestId }
    }
    if (endTime < startTime) {
      return { success: false, message: '结束时间不能早于开始时间', requestId }
    }
    
    const openid = wxContext.OPENID
    
    // 基础数据结构
    const eventDoc = {
      ...eventData,
      creator: openid,
      createTime: db.serverDate(),
      participants: [openid],  // 创建者自动加入
      quitUsers: [],           // 退出者列表
      absentees: [],           // 咕咕者列表 (咕咕模式)
      status: 'pending'
    };

    // 根据模式添加特定字段
    if (mode === 'payment') {
      // 付款模式
      const amount = parseFloat(paymentAmount) || 0
      
      eventDoc.mode = 'payment'
      eventDoc.paymentAmount = amount  // 每人应付金额
      eventDoc.totalAmount = totalAmount ? parseFloat(totalAmount) : null  // 活动总金额 (可选)
      eventDoc.totalPaid = 0  // 当前已收款
      
      // 付款状态: { openid: 'creator' | 'paid' | 'refunded' }
      eventDoc.paymentStatus = {
        [openid]: 'creator'  // 创建者标记为 creator
      }
      
      // 退款状态
      eventDoc.refundStatus = {}  // { openid: { amount, time, reason } }
      
      // 标记已支付的参与者列表
      eventDoc.paidParticipants = [openid]  // 创建者视为已付款
      
      logger.info({
        msg: 'createEvent: payment mode',
        requestId,
        openid,
        paymentAmount: amount
      })
    } else {
      // 咕咕模式 (默认)
      eventDoc.mode = 'gugu'
      eventDoc.regretPointsRequired = event.regretPointsRequired || 1
      
      logger.info({
        msg: 'createEvent: gugu mode',
        requestId,
        openid,
        regretPointsRequired: eventDoc.regretPointsRequired
      })
    }

    let result
    try {
      result = await db.collection('events').add({ data: eventDoc })
    } catch (err) {
      const errCode = err && (err.errCode || err.code)
      const errMsg = err && (err.errMsg || err.message)

      // -502005: DATABASE_COLLECTION_NOT_EXIST
      if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
        const created = await ensureCollectionExists('events')
        logger.warn({
          msg: 'createEvent: events collection missing, created and retrying',
          requestId,
          openid,
          created
        })
        result = await db.collection('events').add({ data: eventDoc })
      } else {
        throw err
      }
    }

    logger.info({
      msg: 'createEvent: event created',
      requestId,
      openid,
      eventId: result && result._id,
      mode: eventDoc.mode
    })

    return {
      success: true,
      eventId: result._id,
      mode: eventDoc.mode,
      requestId
    };
  } catch (err) {
    logger.error({
      msg: 'createEvent: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '创建失败',
      requestId,
      error: {
        errCode: err && (err.errCode || err.code),
        errMsg: err && (err.errMsg || err.message)
      }
    };
  }
};
