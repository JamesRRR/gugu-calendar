const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  // Get both OPENID and ENV from context
  const { OPENID, ENV } = cloud.getWXContext();
  const { points, price } = event;
  const requestId = context && (context.requestId || context.requestID);
  const logger = cloud.logger ? cloud.logger() : console

  try {
    const db = cloud.database();

    async function ensureCollectionExists(name) {
      try {
        if (typeof db.createCollection === 'function') {
          await db.createCollection(name);
        }
      } catch (e) {
        // ignore
      }
    }
    await ensureCollectionExists('orders')
    
    // Create order in database
    const order = {
      userId: OPENID,
      points: points,
      price: price,
      status: 'pending',
      createTime: db.serverDate()
    };
    
    let orderResult;
    try {
      orderResult = await db.collection('orders').add({ data: order });
    } catch (err) {
      const errCode = err && (err.errCode || err.code);
      const errMsg = err && (err.errMsg || err.message);
      if (errCode === -502005 || (typeof errMsg === 'string' && errMsg.includes('DATABASE_COLLECTION_NOT_EXIST'))) {
        await ensureCollectionExists('orders');
        orderResult = await db.collection('orders').add({ data: order });
      } else {
        throw err;
      }
    }

    // Generate timestamp and nonceStr
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = Math.random().toString(36).substr(2, 15);

    // Generate payment parameters with explicit ENV
    const res = await cloud.cloudPay.unifiedOrder({
      body: `购买${points}点数`,
      outTradeNo: orderResult._id,
      spbillCreateIp: '127.0.0.1',
      subMchId: '1702547862',
      totalFee: price * 100, // Convert to cents
      envId: ENV,
      functionName: 'paymentCallback'
    });

    console.log('Payment environment:', ENV);
    console.log('Unified order response:', res);

    if (res.returnCode === 'SUCCESS' && res.resultCode === 'SUCCESS') {
      // Only proceed if both returnCode and resultCode are SUCCESS
      const payment = {
        timeStamp: timeStamp,
        nonceStr: res.nonceStr, // Use the nonceStr from the response
        package: `prepay_id=${res.payment.prepayId}`, // Use the prepayId from payment object
        signType: 'MD5',
        paySign: res.payment.paySign // Use the paySign from payment object
      };

      return {
        success: true,
        requestId,
        payment: payment
      };
    } else {
      console.error('Unified order failed:', res);
      return {
        success: false,
        error: res,
        requestId,
        message: res.errCodeDes || res.returnMsg
      };
    }
  } catch (err) {
    logger.error({
      msg: 'createPayment: failed',
      requestId,
      openid: OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    });
    return {
      success: false,
      error: err,
      requestId,
      message: (err && (err.errMsg || err.message)) || '创建支付订单失败'
    };
  }
}; 