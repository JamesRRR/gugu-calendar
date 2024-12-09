Page({
  data: {
    userInfo: null,
    userId: null,
    stats: {
      totalEvents: 0,
      guguCount: 0,
      attendRate: '0%'
    },
    activeTab: 'upcoming',
    events: []
  },

  onLoad: function(options) {
    this.getUserInfo();
    this.getStats();
    this.getEvents();
  },

  getUserInfo: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  getStats: function() {
    // 获取统计数据
    const db = wx.cloud.database();
    db.collection('users').where({
      _openid: '{openid}'
    }).get().then(res => {
      if (res.data.length > 0) {
        this.setData({
          stats: {
            totalEvents: res.data[0].totalEvents || 0,
            guguCount: res.data[0].guguCount || 0,
            attendRate: res.data[0].attendRate || '0%'
          }
        });
      }
    });
  },

  getEvents: function() {
    // 获取活动列表
    const db = wx.cloud.database();
    const _ = db.command;
    const now = new Date();

    const query = this.data.activeTab === 'upcoming' 
      ? { startTime: _.gte(now) }
      : { startTime: _.lt(now) };

    db.collection('events')
      .where({
        _openid: '{openid}',
        ...query
      })
      .orderBy('startTime', this.data.activeTab === 'upcoming' ? 'asc' : 'desc')
      .limit(10)
      .get()
      .then(res => {
        const events = res.data.map(event => ({
          ...event,
          date: this.formatDate(event.startTime),
          time: this.formatTime(event.startTime),
          statusText: this.getStatusText(event.status)
        }));
        this.setData({ events });
      });
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab }, () => {
      this.getEvents();
    });
  },

  formatDate: function(date) {
    date = new Date(date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  formatTime: function(date) {
    date = new Date(date);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  getStatusText: function(status) {
    const statusMap = {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已结束',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  },

  goToEventDetail: function(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event/detail?id=${eventId}`
    });
  },

  createEvent: function() {
    wx.navigateTo({
      url: '/pages/event/create'
    });
  },

  showSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/index'
    });
  }
}); 