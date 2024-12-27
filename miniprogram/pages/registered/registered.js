const app = getApp()

Page({
  data: {
    events: [],
    userInfo: null
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
    this.loadEvents();
  },

  loadEvents() {
    wx.showLoading({ title: '加载中' });
    wx.cloud.callFunction({
      name: 'getRegisteredEvents',
      data: {}
    }).then(res => {
      if (res.result.success) {
        // 处理时间格式和计算收款总额
        const events = res.result.events.map(event => {
          event.startTime = this.formatDate(event.startTime);
          if (event.mode === 'payment') {
            event.totalPayment = (event.participants?.length || 0) * event.paymentAmount;
          }
          return event;
        });
        this.setData({ events });
      }
      wx.hideLoading();
    }).catch(err => {
      console.error('获取活动列表失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  goToEventDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${id}`
    });
  }
}); 