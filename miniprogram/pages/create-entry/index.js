Page({
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