Page({
  data: {
    event: null,
    isCreator: false,
    hasJoined: false,
    formattedStartTime: '',
    formattedEndTime: '',
    participants: []
  },

  getEnvVersion() {
    try {
      return wx.getAccountInfoSync().miniProgram.envVersion; // develop | trial | release
    } catch (e) {
      return 'release';
    }
  },

  onLoad(options) {
    const id = options && options.id;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/registered/registered' });
      }, 1500);
      return;
    }
    this.fetchEventDetails(id);
  },

  fetchEventDetails(eventId) {
    if (!eventId) return;

    wx.showLoading({
      title: '加载中...',
    });
    wx.cloud.callFunction({
      name: 'getEventDetail',
      data: { eventId }
    }).then(res => {
      wx.hideLoading();
      if (!res.result || !res.result.success) {
        console.error('getEventDetail failed:', res);
        const envVersion = this.getEnvVersion();
        if (envVersion === 'develop' || envVersion === 'trial') {
          wx.showModal({
            title: '加载失败（调试信息）',
            content: JSON.stringify(res.result || res, null, 2).slice(0, 1800),
            showCancel: false
          });
        }
        wx.showToast({ title: (res.result && res.result.message) || '加载失败', icon: 'none' });
        return;
      }

      const event = res.result.data;
      const participants = res.result.participants || [];

      // 格式化时间
      const startTime = new Date(event.startTime);
      const formattedStartTime = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日 ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

      let formattedEndTime = '';
      if (event.endTime) {
        const endTime = new Date(event.endTime);
        formattedEndTime = `${endTime.getFullYear()}年${endTime.getMonth() + 1}月${endTime.getDate()}日 ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      }

      this.setData({
        event,
        participants,
        isCreator: !!res.result.isCreator,
        hasJoined: !!res.result.hasJoined,
        formattedStartTime,
        formattedEndTime
      });
    }).catch(err => {
      console.error('获取活动详情失败：', err);
      wx.hideLoading();
      const envVersion = this.getEnvVersion();
      if (envVersion === 'develop' || envVersion === 'trial') {
        wx.showModal({
          title: '加载失败（调试信息）',
          content: JSON.stringify(err, Object.getOwnPropertyNames(err), 2).slice(0, 1800),
          showCancel: false
        });
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
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

  // 加入活动
  joinEvent() {
    const event = this.data.event;
    if (!event || !event._id) return;

    wx.showLoading({ title: '加入中' });
    wx.cloud.callFunction({
      name: 'joinEvent',
      data: { eventId: event._id }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已加入', icon: 'success' });
        this.fetchEventDetails(event._id);
      } else {
        wx.showToast({
          title: (res.result && res.result.message) || '加入失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加入活动失败：', err);
      wx.hideLoading();
      wx.showToast({ title: '加入失败', icon: 'none' });
    });
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
    const localUserInfo = wx.getStorageSync('userInfo') || {}

    wx.cloud.callFunction({
      name: 'guguEvent',
      data: {
        eventId: this.data.event._id,
        // 用于新环境 users 记录缺失时自动补齐
        userInfo: {
          nickName: localUserInfo.nickName,
          avatarUrl: localUserInfo.avatarUrl
        }
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

        // 刷新个人中心页面的数据
        const profilePage = getCurrentPages().find(page => page.route === 'pages/profile/index');
        if (profilePage) {
          profilePage.loadUserStats();
        }

        // 如果活动被取消，发送通知
        if (res.result.cancelled) {
          wx.showModal({
            title: '活动已取消',
            content: `由于超过半数参与者咕咕，活动"${this.data.event.title}"已自动取消`,
            showCancel: false
          });
        }
      } else {
        wx.showToast({
          title: res.result.message || '咕咕失败',
          icon: 'none'
        });
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

}); 