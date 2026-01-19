const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const logger = cloud.logger ? cloud.logger() : console

async function ensureCollectionExists(name) {
  // wx-server-sdk 支持 createCollection；若集合已存在会报错，这里吞掉即可
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
    
    const eventDoc = {
      ...eventData,
      mode: mode || 'gugu', // 默认为咕咕模式
      creator: wxContext.OPENID,
      createTime: db.serverDate(),
      participants: [wxContext.OPENID],  // 确保创建者被正确添加为参与者
      status: 'pending'
    };

    // 根据模式添加特定字段
    if (mode === 'payment') {
      // 确保金额为数字类型
      eventDoc.paymentAmount = parseFloat(paymentAmount) || 0;
      eventDoc.totalAmount = totalAmount ? parseFloat(totalAmount) : null;
      eventDoc.paymentStatus = {
        [wxContext.OPENID]: 'creator'  // 使用正确的语法设置创建者状态
      };
      eventDoc.refundStatus = {};  // 用于记录退款状态
      // 添加支付相关的其他字段
      eventDoc.paidParticipants = [];  // 已支付的参与者
      eventDoc.totalPaid = 0;  // 当前总收款金额
    } else {
      eventDoc.regretPointsRequired = event.regretPointsRequired;
    }

    // 打印日志，方便调试（避免日志过大，只打关键字段）
    logger.info({
      msg: 'createEvent: creating event',
      requestId,
      openid: wxContext.OPENID,
      mode: eventDoc.mode,
      title: eventDoc.title,
      startTime: eventDoc.startTime,
      endTime: eventDoc.endTime
    })

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
          openid: wxContext.OPENID,
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
      openid: wxContext.OPENID,
      eventId: result && result._id
    })

    return {
      success: true,
      eventId: result._id,
      requestId
    };
  } catch (err) {
    // 结构化错误日志（云函数日志里可检索）
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
        errMsg: err && (err.errMsg || err.message),
        stack: err && err.stack
      }
    };
  }
}; 