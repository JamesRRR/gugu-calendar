Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    stats: {
      totalGuguCount: 0,
      totalEvents: 0,
      completedEvents: 0,
      participationRate: '0%'
    }
  },

  onLoad() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      this.loadUserStats();
    }
  },

  onShow() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo && !this.data.hasUserInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      this.loadUserStats();
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { ...this.data.userInfo, avatarUrl };
    
    // 更新本地和全局数据
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    // 更新到云端
    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userInfo
      }
    }).catch(err => {
      console.error('更新头像失败：', err);
    });
  },

  onNicknameChange(e) {
    console.log('昵称变更:', e.detail);  // 添加日志
    const nickName = e.detail.value || e.detail.nickname;
    if (!nickName) return;

    const userInfo = { ...this.data.userInfo, nickName };
    
    // 更新本地和全局数据
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    // 更新到云端
    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userInfo
      }
    }).catch(err => {
      console.error('更新昵称失败：', err);
    });
  },

  getUserProfile() {
    // 先调用登录云函数获取 openId
    wx.cloud.callFunction({
      name: 'login'
    }).then(loginRes => {
      // 创建初始用户信息
      const userInfo = {
        openId: loginRes.result.openid,
        avatarUrl: '/images/default-avatar.png', // 添加一个默认头像
        nickName: '微信用户'
      };
      
      // 保存到全局数据
      getApp().globalData.userInfo = userInfo;
      // 保存到本地存储
      wx.setStorageSync('userInfo', userInfo);
      
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      this.loadUserStats();

      // 调用云函数更新用户信息
      wx.cloud.callFunction({
        name: 'updateUser',
        data: {
          userInfo: userInfo
        }
      }).catch(err => {
        console.error('更新用户信���失败：', err);
      });
    }).catch(err => {
      console.error('登录失败：', err);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    });
  },

  loadUserStats() {
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo || !userInfo.openId) return;

    wx.cloud.callFunction({
      name: 'getUserStats',
      data: {
        userId: userInfo.openId
      }
    }).then(res => {
      if (res.result.success) {
        const stats = res.result.stats;
        const participationRate = stats.totalEvents > 0 
          ? ((stats.completedEvents / stats.totalEvents) * 100).toFixed(1)
          : 0;
        
        this.setData({
          stats: {
            ...stats,
            participationRate: participationRate + '%'
          }
        });
      }
    }).catch(console.error);
  }
}); 