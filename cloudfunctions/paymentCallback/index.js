const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { outTradeNo, resultCode, transactionId } = event;
  const requestId = context && (context.requestId || context.requestID);
  const logger = cloud.logger ? cloud.logger() : console

  if (resultCode === 'SUCCESS') {
    const db = cloud.database();
    try {
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
      await ensureCollectionExists('users')

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

      // Add points to user（users 表使用 _openid）
      const userId = order && order.data && order.data.userId
      const points = order && order.data && order.data.points

      const userRes = await db.collection('users').where({
        _openid: userId
      }).get()

      if (userRes.data && userRes.data.length > 0) {
        await db.collection('users').where({ _openid: userId }).update({
          data: {
            regretPoints: db.command.inc(points),
            updateTime: db.serverDate()
          }
        })
      } else {
        // 新环境可能还没有 user 记录，补一条最小数据
        await db.collection('users').add({
          data: {
            _openid: userId,
            regretPoints: points,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      }

      return { success: true, requestId };
    } catch (err) {
      logger.error({
        msg: 'paymentCallback: failed',
        requestId,
        errCode: err && (err.errCode || err.code),
        errMsg: err && (err.errMsg || err.message),
        stack: err && err.stack
      });
      return { success: false, error: err, requestId, message: (err && (err.errMsg || err.message)) || '回调处理失败' };
    }
  }
  return { success: false, error: 'Payment failed', requestId };
}; 