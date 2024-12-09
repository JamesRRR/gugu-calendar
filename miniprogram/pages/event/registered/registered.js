const app = getApp()

Page({
  data: {
    events: [],
    loading: false
  },

  onLoad: function() {
    this.loadRegisteredEvents()
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadRegisteredEvents()
  },

  onPullDownRefresh: function() {
    this.loadRegisteredEvents()
  },

  loadRegisteredEvents: function() {
    const that = this
    that.setData({ loading: true })

    // 调用云函数获取已注册活动
    wx.cloud.callFunction({
      name: 'getRegisteredEvents',
      data: {
        userId: app.globalData.userInfo._id
      }
    }).then(res => {
      const events = res.result.data.map(event => {
        // 处理活动状态
        const now = new Date()
        const startTime = new Date(event.startTime)
        event.status = startTime > now ? 'upcoming' : 'past'
        return event
      })

      that.setData({
        events: events,
        loading: false
      })

      wx.stopPullDownRefresh()
    }).catch(err => {
      console.error('获取已注册活动失败：', err)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      that.setData({ loading: false })
      wx.stopPullDownRefresh()
    })
  },

  goToEventDetail: function(e) {
    const eventId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/event/detail/detail?id=${eventId}`
    })
  }
}) 