const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const db = cloud.database();
  
  try {
    const { mode, paymentAmount, ...eventData } = event;
    
    const eventDoc = {
      ...eventData,
      mode: mode || 'gugu', // 默认为咕咕模式
      creator: context.OPENID,
      createTime: db.serverDate(),
      participants: [context.OPENID],
      status: 'active'
    };

    // 根据模式添加特定字段
    if (mode === 'payment') {
      eventDoc.paymentAmount = paymentAmount;
      eventDoc.paymentStatus = {};
      eventDoc.paymentStatus[context.OPENID] = 'creator'; // 创建者无需支付
    } else {
      eventDoc.regretPointsRequired = event.regretPointsRequired;
    }

    const result = await db.collection('events').add({
      data: eventDoc
    });

    return {
      success: true,
      eventId: result._id
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}; 