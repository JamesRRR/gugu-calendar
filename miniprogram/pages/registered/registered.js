const app = getApp()

Page({
  data: {
    events: []
  },

  onShow() {
    this.loadEvents();
  },

  loadEvents() {
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo || !userInfo.openId) return;

    wx.showLoading({ title: '加载中' });

    const db = wx.cloud.database();
    db.collection('events')
      .where({
        participants: userInfo.openId
      })
      .orderBy('startTime', 'asc')  // 按开始时间升序排序
      .get()
      .then(res => {
        const events = res.data.map(event => ({
          ...event,
          formattedStartTime: this.formatTime(event.startTime),
          formattedEndTime: event.endTime ? this.formatTime(event.endTime) : null,
          statusText: this.getStatusText(event.status)
        }));

        this.setData({ events });
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取活动列表失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  getStatusText(status) {
    const statusMap = {
      'pending': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
      'gugu': '已咕咕'
    };
    return statusMap[status] || status;
  },

  // 添加跳转函数
  goToEventDetail(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${eventId}`
    });
  }
}); 