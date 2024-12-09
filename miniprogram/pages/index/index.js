Page({
  data: {
    events: []
  },

  onLoad() {
    this.fetchEvents();
  },

  onShow() {
    this.fetchEvents();
  },

  fetchEvents() {
    // 从后端获取活动列表
    wx.request({
      url: 'your-backend-api/events',
      success: (res) => {
        this.setData({
          events: res.data
        });
      }
    });
  },

  createEvent() {
    wx.navigateTo({
      url: '/pages/event/create'
    });
  },

  shareEvent(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  guguEvent(e) {
    const eventId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认咕咕',
      content: '确定要咕咕这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `your-backend-api/events/${eventId}/gugu`,
            method: 'POST',
            success: (response) => {
              if (response.data.success) {
                wx.showToast({
                  title: '咕咕成功',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  }
}); 