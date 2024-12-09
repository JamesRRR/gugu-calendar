App({
  globalData: {
    userInfo: null
  },

  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'gugu-calender-2-4gc2cjwf8054ba71',
        traceUser: true
      })
    }

    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },
  
  onShow: function() {
    console.log('App onShow');
  },

  onPageNotFound: function(res) {
    console.error('Page not found:', res);
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onError: function(err) {
    console.error('App error:', err);
  }
}); 