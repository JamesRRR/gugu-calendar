Page({
  data: {
    events: [],
    loading: true
  },

  onLoad: function() {
    this.fetchEvents()
  },

  onPullDownRefresh: function() {
    this.fetchEvents()
  },

  fetchEvents: function() {
    const db = wx.cloud.database()
    
    db.collection('events')
      .orderBy('startTime', 'asc')
      .get()
      .then(res => {
        // 处理时间格式和添加表情
        const events = res.data.map(event => {
          const date = new Date(event.startTime)
          return {
            ...event,
            startTime: {
              date: `${date.getMonth() + 1}月${date.getDate()}日`,
              time: `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            },
            categoryEmoji: this.getCategoryEmoji(event.category),
            statusText: this.getStatusText(event.status)
          }
        })

        this.setData({
          events,
          loading: false
        })
        wx.stopPullDownRefresh()
      })
  },

  getCategoryEmoji: function(category) {
    const emojiMap = {
      'sports': '⚽️',
      'study': '📚',
      'game': '🎮',
      'food': '🍜',
      'music': '🎵',
      'movie': '🎬',
      'travel': '✈️',
      'other': '🎯'
    }
    return emojiMap[category] || '🎯'
  },

  getStatusText: function(status) {
    const statusMap = {
      'ongoing': '进行中',
      'upcoming': '即将开始',
      'ended': '已结束'
    }
    return statusMap[status] || '进行中'
  },

  goToEventDetail: function(e) {
    const eventId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/event/detail?id=${eventId}`
    })
  }
}) 