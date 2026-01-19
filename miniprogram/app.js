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
        env: 'cloud1-7g9ukzn1692197af',
        traceUser: true
      })
    }

    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo

      // 新环境迁移/首次运行时，确保云端 users 记录存在（用于咕咕/参与者头像等）
      // 如果用户未授权头像昵称，也不会阻断正常使用
      try {
        wx.cloud.callFunction({
          name: 'updateUser',
          data: { userInfo }
        }).catch(err => {
          console.error('updateUser onLaunch failed:', err)
        })
      } catch (e) {
        // ignore
      }
    }
  },
  
  onShow: function() {
    console.log('App onShow');
  },

  onPageNotFound: function(res) {
    console.error('Page not found:', res);
    wx.switchTab({
      url: '/pages/registered/registered'
    });
  },

  onError: function(err) {
    console.error('App error:', err);
  }
}); 