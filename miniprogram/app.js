App({
  globalData: {
    userInfo: null,
    hasUserInfo: false
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'gugu-calender-2-4gc2cjwf8054ba71', // 替换成你的云开发环境ID
        traceUser: true,
      })
    }

    // 登录
    wx.login({
      success: res => {
        if (res.code) {
          // 使用云函数处理登录
          wx.cloud.callFunction({
            name: 'login',
            data: {
              code: res.code
            },
            success: (result) => {
              this.globalData.userInfo = result.result.userInfo;
              this.globalData.hasUserInfo = true;
            }
          });
        }
      }
    });
  }
}); 