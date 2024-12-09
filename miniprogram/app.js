App({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    openId: null
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'gugu-calender-2-4gc2cjwf8054ba71',
        traceUser: true,
      })
    }

    // 登录
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        if (res.result.success) {
          this.globalData.openId = res.result.openId;
        }
      },
      fail: err => {
        console.error('登录失败：', err)
      }
    })
  }
}); 