Page({
  data: {
    event: null,
    isCreator: false,
    hasJoined: false
  },

  onLoad(options) {
    const eventId = options.id;
    this.fetchEventDetails(eventId);
  },

  fetchEventDetails(eventId) {
    wx.request({
      url: `your-backend-api/events/${eventId}`,
      success: (res) => {
        const event = res.data;
        const app = getApp();
        const isCreator = event.creator_id === app.globalData.userInfo?.id;
        const hasJoined = event.participants.some(
          p => p.user_id === app.globalData.userInfo?.id
        );

        this.setData({
          event,
          isCreator,
          hasJoined
        });
      }
    });
  },

  shareEvent() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  guguEvent() {
    wx.showModal({
      title: '确认咕咕',
      content: '确定要咕咕这个活动吗？其他参与者不会知道是你咕咕了。',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `your-backend-api/events/${this.data.event.id}/gugu`,
            method: 'POST',
            success: (response) => {
              if (response.data.success) {
                wx.showToast({
                  title: '咕咕成功',
                  icon: 'success'
                });
                // 如果活动被取消（达到咕咕阈值），刷新页面
                if (response.data.event_cancelled) {
                  this.fetchEventDetails(this.data.event.id);
                }
              }
            }
          });
        }
      }
    });
  },

  toggleJoin() {
    const eventId = this.data.event.id;
    const action = this.data.hasJoined ? 'quit' : 'join';
    
    wx.request({
      url: `your-backend-api/events/${eventId}/${action}`,
      method: 'POST',
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: this.data.hasJoined ? '已退出' : '已加入',
            icon: 'success'
          });
          this.fetchEventDetails(eventId);
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.event.title,
      path: `/pages/event/detail?id=${this.data.event.id}`
    };
  }
}); 