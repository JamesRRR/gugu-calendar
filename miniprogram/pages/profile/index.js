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
    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      this.loadUserStats();
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 先调用登录云函数获取 openId
        wx.cloud.callFunction({
          name: 'login'
        }).then(loginRes => {
          const completeUserInfo = {
            ...userInfo,
            openId: loginRes.result.openid
          };
          
          // 保存到全局数据和本地存储
          getApp().globalData.userInfo = completeUserInfo;
          wx.setStorageSync('userInfo', completeUserInfo);
          
          this.setData({
            userInfo: completeUserInfo,
            hasUserInfo: true
          });
          
          this.loadUserStats();

          // 更新到云端
          wx.cloud.callFunction({
            name: 'updateUser',
            data: {
              userInfo: completeUserInfo
            }
          }).catch(err => {
            console.error('更新用户信息失败：', err);
          });
        }).catch(err => {
          console.error('登录失败：', err);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { 
      ...this.data.userInfo, 
      avatarUrl
    };
    
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

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
    const nickName = e.detail.value;
    if (!nickName) return;
    
    const userInfo = { ...this.data.userInfo, nickName };
    
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userInfo
      }
    }).catch(err => {
      console.error('更新昵称失败：', err);
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
  },

  goToFAQ() {
    console.log('Navigating to FAQ');
    wx.navigateTo({
      url: '/pages/faq/index',
      fail: (err) => {
        console.error('Navigation failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  goToIntro() {
    console.log('Navigating to Intro');
    wx.navigateTo({
      url: '/pages/intro/index',
      fail: (err) => {
        console.error('Navigation failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
}); 