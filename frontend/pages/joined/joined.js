Page({
  data: {
    joinedEvents: [],
    loading: true
  },

  onLoad: function() {
    this.fetchJoinedEvents()
  },

  fetchJoinedEvents: function() {
    const db = wx.cloud.database()
    const _ = db.command
    
    // 获取当前用户ID
    const userInfo = getApp().globalData.userInfo
    
    db.collection('events')
      .where({
        participants: userInfo.openId
      })
      .orderBy('startTime', 'asc')
      .get()
      .then(res => {
        this.setData({
          joinedEvents: res.data,
          loading: false
        })
      })
  }
}) 