Page({
  data: {
    event: null,
    participants: [],
    isCreator: false,
    hasJoined: false,
    canJoin: true
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
        const event = res.data;
        const userInfo = wx.getStorageSync('userInfo');
        const isCreator = event.creatorId === userInfo.openId;
        const hasJoined = event.participants.includes(userInfo.openId);
        const canJoin = event.maxParticipants === 0 || 
                       event.participants.length < event.maxParticipants;

        this.setData({
          event,
          isCreator,
          hasJoined,
          canJoin
        });

        // 获取参与者信息
        this.fetchParticipantsInfo(event.participants);
        wx.hideLoading();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  fetchParticipantsInfo(participantIds) {
    wx.cloud.callFunction({
      name: 'getUsers',
      data: { userIds: participantIds }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          participants: res.result.users
        });
      }
    });
  },

  joinEvent() {
    if (!this.data.canJoin) {
      wx.showToast({
        title: '活动人数已满',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '处理中...' });
    wx.cloud.callFunction({
      name: 'eventOperations',
      data: {
        action: 'join',
        eventId: this.data.event._id
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '加入成功',
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

  onShareAppMessage() {
    return {
      title: this.data.event.title,
      path: `/pages/event/detail?id=${this.data.event._id}`
    };
  }
}); 