const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { points, price } = event;

  try {
    const db = cloud.database();
    
    // Create order in database
    const order = {
      userId: OPENID,
      points: points,
      price: price,
      status: 'pending',
      createTime: db.serverDate()
    };
    
    const orderResult = await db.collection('orders').add({
      data: order
    });

    // Generate payment parameters
    const payment = await cloud.cloudPay.unifiedOrder({
      body: `购买${points}点数`,
      outTradeNo: orderResult._id,
      spbillCreateIp: '127.0.0.1',
      subMchId: '1702547862', // Replace with your merchant ID
      totalFee: price * 100, // Convert to cents
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'paymentCallback'
    });

    return {
      success: true,
      payment: payment
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: err
    };
  }
}; 