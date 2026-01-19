const app = getApp()

Page({
  data: {
    events: [],
    userInfo: null
  },

  onShow() {
    // 自定义 tabBar 高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }

    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
    this.loadEvents();
  },

  loadEvents() {
    wx.showLoading({ title: '加载中' });
    console.log('Loading events...');
    wx.cloud.callFunction({
      name: 'getRegisteredEvents',
      data: {
        mode: 'all'
      }
    }).then(res => {
      console.log('Got events response:', res);
      if (res.result.success) {
        // 处理时间格式和计算收款总额
        const events = res.result.events.map(event => {
          // 确保 mode 字段存在
          event.mode = event.mode || 'gugu';
          
          // 格式化时间
          event.startTime = this.formatDate(event.startTime);
          if (event.endTime) {
            event.endTime = this.formatDate(event.endTime);
          }
          
          // 计算收款模式的总金额
          if (event.mode === 'payment') {
            event.totalPayment = event.totalPaid || 0;
          }
          
          return event;
        });
        
        console.log('Processed events:', events);
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
    if (!timestamp) return '';
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