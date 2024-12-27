const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const db = cloud.database();
  
  try {
    const { mode, paymentAmount, totalAmount, ...eventData } = event;
    
    const eventDoc = {
      ...eventData,
      mode: mode || 'gugu', // 默认为咕咕模式
      creator: context.OPENID,
      createTime: db.serverDate(),
      participants: [context.OPENID],
      status: 'pending'
    };

    // 根据模式添加特定字段
    if (mode === 'payment') {
      // 确保金额为数字类型
      eventDoc.paymentAmount = parseFloat(paymentAmount) || 0;
      eventDoc.totalAmount = totalAmount ? parseFloat(totalAmount) : null;
      eventDoc.paymentStatus = {};
      eventDoc.paymentStatus[context.OPENID] = 'creator'; // 创建者无需支付
      eventDoc.refundStatus = {};  // 用于记录退款状态
      // 添加支付相关的其他字段
      eventDoc.paidParticipants = [];  // 已支付的参与者
      eventDoc.totalPaid = 0;  // 当前总收款金额
    } else {
      eventDoc.regretPointsRequired = event.regretPointsRequired;
    }

    // 打印日志，方便调试
    console.log('Creating event with data:', eventDoc);

    const result = await db.collection('events').add({
      data: eventDoc
    });

    return {
      success: true,
      eventId: result._id
    };
  } catch (err) {
    console.error('创建活动失败:', err);
    return {
      success: false,
      message: err.message || '创建活动失败'
    };
  }
}; 