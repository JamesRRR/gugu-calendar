Page({
  data: {
    events: []
  },

  onLoad() {
    this.fetchEvents();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1  // 设置活动列表页为选中状态
      })
    }
    this.fetchEvents();
  },

  fetchEvents() {
    wx.showLoading({
      title: '加载中...',
    });

    const db = wx.cloud.database();
    db.collection('events')
      .orderBy('eventDate', 'asc')
      .get()
      .then(res => {
        wx.hideLoading();
        this.setData({
          events: res.data
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  goToEventDetail(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${eventId}`
    });
  }
}); 