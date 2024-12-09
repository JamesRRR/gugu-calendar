Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },

  onLoad() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        getApp().globalData.userInfo = userInfo;
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
      }
    });
  }
}); 