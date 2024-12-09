Page({
  data: {
    userInfo: null
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
  }
}); 