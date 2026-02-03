const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
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

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { eventId } = event
  const requestId = context && (context.requestId || context.requestID)
  
  try {
    await ensureCollectionExists('events')
    await ensureCollectionExists('users')

    // 获取活动信息
    const eventRes = await db.collection('events').doc(eventId).get()
    const eventData = eventRes.data
    
    if (!eventData) {
      return { success: false, message: '活动不存在', requestId }
    }

    const openid = wxContext.OPENID
    const isCreator = eventData.creator === openid
    const mode = eventData.mode || 'gugu'

    // 1. 从参与者中移除
    await db.collection('events').doc(eventId).update({
      data: {
        participants: _.pull(openid),
        quitUsers: _.addToSet(openid)
      }
    })

    let result = {
      success: true,
      message: '退出成功',
      mode,
      requestId
    }

    // 2. 付款模式：处理退款
    if (mode === 'payment') {
      const paymentAmount = eventData.paymentAmount || 0
      const participants = eventData.participants || []
      const quitUsers = eventData.quitUsers || []
      
      // 计算退出比例
      const totalParticipants = participants.length
      const quitCount = quitUsers.length + 1 // +1 是当前退出者
      
      // 更新 totalPaid (退款不计入)
      await db.collection('events').doc(eventId).update({
        data: {
          totalPaid: _.inc(-paymentAmount)
        }
      })

      // 更新用户的付款状态
      const paymentStatus = eventData.paymentStatus || {}
      paymentStatus[openid] = 'refunded'
      
      await db.collection('events').doc(eventId).update({
        data: {
          [`paymentStatus.${openid}`]: 'refunded'
        }
      })

      // 检查是否需要取消活动并分配押金 (>50% 退出)
      const quitRatio = quitCount / (totalParticipants + 1)
      
      if (quitRatio > 0.5) {
        // 超过50%退出，取消活动
        await db.collection('events').doc(eventId).update({
          data: {
            status: 'cancelled',
            refundMode: 'forfeit', // 押金不退
            cancelledAt: db.serverDate()
          }
        })

        // 分配押金给未退出者
        const remainingParticipants = participants.filter(p => !quitUsers.includes(p) && p !== openid)
        
        if (remainingParticipants.length > 0 && paymentAmount > 0) {
          const totalForfeit = paymentAmount * quitCount
          const refundPerPerson = totalForfeit / remainingParticipants.length
          
          // 更新未退出者的状态，标记他们获得了押金
          for (const participant of remainingParticipants) {
            const participantStatus = paymentStatus[participant] || 'paid'
            if (participantStatus === 'paid') {
              // 标记为已获得押金
              await db.collection('events').doc(eventId).update({
                data: {
                  [`paymentStatus.${participant}`]: `refund_won:${refundPerPerson}`
                }
              })
              
              // 退还用户的付款（实际业务中可能需要原路退回）
              // 这里只是标记，实际退款需要调用支付 API
              logger.info({
                msg: 'quitEvent: refund allocated',
                requestId,
                eventId,
                userId: participant,
                amount: refundPerPerson
              })
            }
          }
        }

        result.cancelled = true
        result.message = '超过50%退出，活动已取消，押金已分配'
        result.refundAllocated = {
          totalForfeit: paymentAmount * quitCount,
          perPerson: remainingParticipants.length > 0 ? (paymentAmount * quitCount) / remainingParticipants.length : 0,
          recipients: remainingParticipants.length
        }
      } else {
        result.message = `退出成功，押金已退还`
        result.refundAmount = paymentAmount
      }
    } else {
      // 咕咕模式：扣点数
      const regretPointsRequired = eventData.regretPointsRequired || 1
      
      // 检查并扣点数
      const userRes = await db.collection('users').where({ _openid: openid }).get()
      const user = userRes.data && userRes.data[0]
      
      if (user && user.regretPoints >= regretPointsRequired) {
        await db.collection('users').where({ _openid: openid }).update({
          data: {
            regretPoints: _.inc(-regretPointsRequired)
          }
        })
        result.pointsDeducted = regretPointsRequired
      }

      // 检查是否需要取消活动
      const absentees = [...(eventData.absentees || []), openid]
      const participants = eventData.participants || []
      const absenteesCount = absentees.length
      
      if (absenteesCount > participants.length / 2) {
        await db.collection('events').doc(eventId).update({
          data: {
            status: 'cancelled',
            absentees: absentees,
            cancelledAt: db.serverDate()
          }
        })
        result.cancelled = true
        result.message = '超过50%咕咕，活动已取消'
      }
    }

    logger.info({
      msg: 'quitEvent: completed',
      requestId,
      openid,
      eventId,
      mode,
      cancelled: result.cancelled || false
    })

    return result

  } catch (err) {
    logger.error({
      msg: 'quitEvent: failed',
      requestId,
      openid: wxContext.OPENID,
      errCode: err && (err.errCode || err.code),
      errMsg: err && (err.errMsg || err.message),
      stack: err && err.stack
    })
    return {
      success: false,
      message: (err && (err.errMsg || err.message)) || '退出失败',
      requestId
    }
  }
}
