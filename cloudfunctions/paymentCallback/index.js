const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { outTradeNo, resultCode, transactionId } = event;

  if (resultCode === 'SUCCESS') {
    const db = cloud.database();
    try {
      // Get the order
      const order = await db.collection('orders').doc(outTradeNo).get();
      
      // Update order status
      await db.collection('orders').doc(outTradeNo).update({
        data: {
          status: 'completed',
          transactionId: transactionId,
          completionTime: db.serverDate()
        }
      });

      // Add points to user
      await db.collection('users').where({
        openId: order.data.userId
      }).update({
        data: {
          regretPoints: db.command.inc(order.data.points)
        }
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  }
  return { success: false, error: 'Payment failed' };
}; 