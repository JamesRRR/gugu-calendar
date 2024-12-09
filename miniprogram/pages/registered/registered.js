const app = getApp()

Page({
  data: {
    events: [],
    loading: true
  },

  onLoad() {
    this.fetchRegisteredEvents();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.fetchRegisteredEvents();
  },

  fetchRegisteredEvents() {
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo || !userInfo.openId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '加载中...'
    });

    const db = wx.cloud.database();
    db.collection('events')
      .where({
        participants: userInfo.openId
      })
      .orderBy('startTime', 'asc')
      .get()
      .then(res => {
        console.log('获取到的活动:', res.data);
        this.setData({
          events: res.data.map(event => ({
            ...event,
            formattedDate: this.formatDate(event.startTime)
          })),
          loading: false
        });
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取活动失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  goToEventDetail(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${eventId}`
    });
  }
}); 