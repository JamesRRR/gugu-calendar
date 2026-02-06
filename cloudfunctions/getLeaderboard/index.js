// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取所有用户数据
    const usersCollection = db.collection('users')
    const usersResult = await usersCollection.get()
    const users = usersResult.data
    
    // 获取今天的开始时间（用于统计今日咕咕次数）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()
    
    // 获取今天的咕咕事件
    const guguEventsCollection = db.collection('gugu_events')
    const todayEventsResult = await guguEventsCollection.where({
      createTime: db.command.gte(todayTimestamp)
    }).get()
    const todayEvents = todayEventsResult.data
    
    // 统计每个用户今日咕咕次数
    const todayGuguCountMap = {}
    todayEvents.forEach(event => {
      if (event.guggedUsers && Array.isArray(event.guggedUsers)) {
        event.guggedUsers.forEach(openId => {
          todayGuguCountMap[openId] = (todayGuguCountMap[openId] || 0) + 1
        })
      }
    })
    
    // 处理用户数据，计算咕咕率
    const userStats = users.map(user => {
      const totalEvents = user.totalEvents || 0
      const totalGuguCount = user.totalGuguCount || 0
      const guguRate = totalEvents > 0 
        ? ((totalGuguCount / totalEvents) * 100).toFixed(1) 
        : 0
      
      return {
        openId: user._id,
        nickName: user.nickName || '匿名用户',
        avatarUrl: user.avatarUrl || '',
        todayGuguCount: todayGuguCountMap[user._id] || 0,
        totalEvents,
        totalGuguCount,
        guguRate: parseFloat(guguRate)
      }
    })
    
    // 按咕咕率降序排序（咕咕率越高排名越前）
    const sortedUsers = userStats.sort((a, b) => b.guguRate - a.guguRate)
    
    // 取前10名
    const top10 = sortedUsers.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      ...user
    }))
    
    // 找出今日咕王（今日咕咕次数最多的人）
    let todayKing = null
    if (Object.keys(todayGuguCountMap).length > 0) {
      const todayKingCandidates = userStats
        .filter(user => todayGuguCountMap[user.openId] > 0)
        .sort((a, b) => todayGuguCountMap[b.openId] - todayGuguCountMap[a.openId])
      
      if (todayKingCandidates.length > 0) {
        todayKing = todayKingCandidates[0]
        // 标记今日咕王
        top10.forEach(user => {
          if (user.openId === todayKing.openId) {
            user.isTodayKing = true
          }
        })
      }
    }
    
    // 如果没有今日咕王，选择第一名
    if (!todayKing && top10.length > 0) {
      todayKing = top10[0]
      top10[0].isTodayKing = true
    }
    
    return {
      success: true,
      data: {
        todayKing,
        leaderboard: top10
      }
    }
    
  } catch (error) {
    console.error('获取排行榜失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
