Page({
  data: {
    event: null,
    isCreator: false,
    hasJoined: false
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/create/index'
        });
      }, 1500);
      return;
    }
    this.fetchEventDetails(options.id);
  },

  fetchEventDetails(eventId) {
    if (!eventId) return;

    wx.showLoading({
      title: '加载中...',
    });

    const db = wx.cloud.database();
    db.collection('events')
      .doc(eventId)
      .get()
      .then(res => {
        console.log('活动数据:', res.data);
        const event = res.data;
        const userInfo = getApp().globalData.userInfo;
        
        console.log('当前用户:', userInfo);
        console.log('活动参与者:', event.participants);

        const isCreator = event.creatorId === userInfo.openId;
        const hasJoined = Array.isArray(event.participants) && 
                         event.participants.includes(userInfo.openId);

        console.log('是否创建者:', isCreator);
        console.log('是否已参加:', hasJoined);

        this.setData({
          event,
          isCreator,
          hasJoined
        });

        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取活动详情失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/create/index'
          });
        }, 1500);
      });
  },

  // 分享配置
  onShareAppMessage() {
    const event = this.data.event;
    return {
      title: event.title,
      path: `/pages/event/detail?id=${event._id}`,
      imageUrl: '/images/share-cover.png'
    };
  },

  // 退出活动
  quitEvent() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          wx.cloud.callFunction({
            name: 'quitEvent',
            data: {
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: '已退出活动',
                icon: 'success'
              });
              // 刷新页面数据
              this.fetchEventDetails(this.data.event._id);
            }
          }).catch(err => {
            console.error('退出活动失败：', err);
            wx.hideLoading();
            wx.showToast({
              title: '退出失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 咕咕功能
  guguEvent() {
    wx.showModal({
      title: '确认咕咕',
      content: '确定要咕咕这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          wx.cloud.callFunction({
            name: 'guguEvent',
            data: {
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: '已咕咕',
                icon: 'success'
              });
              // 刷新页面数据
              this.fetchEventDetails(this.data.event._id);

              // 如果活动被取消，发送通知
              if (res.result.cancelled) {
                wx.showModal({
                  title: '活动已取消',
                  content: '由于超过半数参与者咕咕，活��已自动取消',
                  showCancel: false
                });
              }
            }
          }).catch(err => {
            console.error('咕咕失败：', err);
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

  // 取消活动
  cancelEvent() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          wx.cloud.callFunction({
            name: 'cancelEvent',
            data: {
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: '已取消活动',
                icon: 'success'
              });
              // 刷新页面数据
              this.fetchEventDetails(this.data.event._id);
            }
          }).catch(err => {
            console.error('取消活动失败：', err);
            wx.hideLoading();
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
}); 