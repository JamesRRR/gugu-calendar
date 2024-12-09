Page({
  data: {
    joinedEvents: []
  },

  onShow() {
    this.fetchJoinedEvents();
  },

  fetchJoinedEvents() {
    wx.showLoading({ title: '加载中...' });
    const db = wx.cloud.database();
    
    db.collection('events')
      .where({
        participants: wx.getStorageSync('userInfo').openId
      })
      .get()
      .then(res => {
        wx.hideLoading();
        this.setData({
          joinedEvents: res.data
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  }
}); 