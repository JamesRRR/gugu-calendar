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
    wx.showLoading({
      title: '加载中...',
    });

    const db = wx.cloud.database();
    db.collection('events')
      .doc(eventId)
      .get()
      .then(res => {
        wx.hideLoading();
        const event = res.data;
        const isCreator = event.creatorId === this.data.userInfo?.openId;
        
        this.setData({
          event,
          isCreator,
          hasJoined: true // 暂时默认已加入，后续可以添加参与者列表功能
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

  guguEvent() {
    wx.showModal({
      title: '确认咕咕',
      content: '确定要咕咕这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          wx.cloud.callFunction({
            name: 'eventOperations',
            data: {
              action: 'gugu',
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: res.result.message,
                icon: 'success'
              });
              this.fetchEventDetails(this.data.event._id);
            }
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  quitEvent() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          wx.cloud.callFunction({
            name: 'eventOperations',
            data: {
              action: 'quit',
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: '退出成功',
                icon: 'success',
                success: () => {
                  wx.navigateBack();
                }
              });
            }
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  shareEvent() {
    // 分享功能将在小程序审核通过后实现
  },

  onShareAppMessage() {
    return {
      title: this.data.event.title,
      path: `/pages/event/detail?id=${this.data.event._id}`
    };
  }
}); 