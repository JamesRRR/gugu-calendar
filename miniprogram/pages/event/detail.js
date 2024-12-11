Page({
  data: {
    event: null,
    isCreator: false,
    hasJoined: false,
    eventDetail: null,
    formattedStartTime: '',
    formattedEndTime: ''
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
        
        // 格式化时间
        const startTime = new Date(event.startTime);
        const formattedStartTime = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日 ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        
        let formattedEndTime = '';
        if (event.endTime) {
          const endTime = new Date(event.endTime);
          formattedEndTime = `${endTime.getFullYear()}年${endTime.getMonth() + 1}月${endTime.getDate()}日 ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        }

        const isCreator = event.creatorId === userInfo.openId;
        const hasJoined = Array.isArray(event.participants) && 
                         event.participants.includes(userInfo.openId);

        this.setData({
          event,
          isCreator,
          hasJoined,
          formattedStartTime,
          formattedEndTime
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
              
              // 延迟后跳转到已注册活动列表页面
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/registered/registered'
                });
              }, 1500);
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

  // 点击咕咕按钮时的处理
  onRegret() {
    const event = this.data.event;
    wx.showModal({
      title: '确认咕咕',
      content: `咕咕这个活动将扣除 ${event.regretPointsRequired || 1} 个咕咕点数，确定要咕咕吗？`,
      confirmText: '确定咕咕',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          this.regretEvent();
        }
      }
    });
  },

  // 执行咕咕操作
  regretEvent() {
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
            content: `由于超过半数参与者咕咕，活动"${this.data.event.title}"已自动取消`,
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

    // 在获取活动详情后格式化时间
    wx.cloud.callFunction({
      name: 'getEventDetail',
      data: {
        eventId: options.id
      }
    }).then(res => {
      if (res.result.success) {
        const eventDetail = res.result.data;
        
        // 格式化时间
        const startTime = new Date(eventDetail.startTime);
        const formattedStartTime = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日 ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        
        let formattedEndTime = '';
        if (eventDetail.endTime) {
          const endTime = new Date(eventDetail.endTime);
          formattedEndTime = `${endTime.getFullYear()}年${endTime.getMonth() + 1}月${endTime.getDate()}日 ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        }

        this.setData({
          eventDetail,
          formattedStartTime,
          formattedEndTime
        });
      }
    }).catch(console.error);
  }
}); 