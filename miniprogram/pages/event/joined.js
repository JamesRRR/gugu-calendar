Page({
  data: {
    joinedEvents: [],
    activeEvents: 0,
    completedEvents: 0,
    hasMore: false
  },

  onLoad() {
    this.fetchJoinedEvents();
  },

  async fetchJoinedEvents() {
    wx.showLoading({ title: '加载中...' });
    try {
      const db = wx.cloud.database();
      const userInfo = wx.getStorageSync('userInfo');
      
      const res = await db.collection('events')
        .where({
          participants: userInfo.openId
        })
        .orderBy('date', 'desc')
        .get();

      // 处理日期和状态显示
      const events = res.data.map(event => {
        const date = new Date(event.date);
        return {
          ...event,
          dateDay: date.getDate(),
          dateMonth: date.getMonth() + 1,
          statusText: this.getStatusText(event.status),
          timeRemaining: this.getTimeRemaining(event.date, event.time),
          urgent: this.isUrgent(event.date, event.time)
        };
      });

      // 统计活动状态
      const active = events.filter(e => e.status === 'active').length;
      const completed = events.filter(e => e.status === 'completed').length;

      this.setData({
        joinedEvents: events,
        activeEvents: active,
        completedEvents: completed,
        hasMore: events.length >= 20
      });

    } catch (err) {
      console.error('获取活动列表失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
    wx.hideLoading();
  },

  getStatusText(status) {
    const statusMap = {
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  getTimeRemaining(date, time) {
    const eventTime = new Date(`${date} ${time}`);
    const now = new Date();
    const diff = eventTime - now;

    if (diff < 0) return '已结束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `还有${days}天`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `还有${hours}小时`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `还有${minutes}分钟`;
  },

  isUrgent(date, time) {
    const eventTime = new Date(`${date} ${time}`);
    const now = new Date();
    const diff = eventTime - now;
    // 24小时内的活动标记为紧急
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  },

  goToEventDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${id}`
    });
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/event/create'
    });
  }
}); 