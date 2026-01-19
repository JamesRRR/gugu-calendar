Page({
  onShow() {
    // 自定义 tabBar 高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  navigateToGuguMode() {
    wx.navigateTo({
      url: '/pages/create-gugu/index'
    });
  },

  navigateToPaymentMode() {
    wx.navigateTo({
      url: '/pages/create-payment/index'
    });
  }
}); 