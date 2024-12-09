App({
  onLaunch: function () {
    console.log('App onLaunch');
    
    // 添加全局错误监听
    wx.onError((err) => {
      console.error('Global error:', err);
    });

    // 添加未处理的 Promise 拒绝监听
    wx.onUnhandledRejection((res) => {
      console.error('Unhandled promise rejection:', res.reason);
    });

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true,
      })
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