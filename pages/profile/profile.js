Page({
  data: {
    testMessage: 'Hello World'
  },

  onLoad: function(options) {
    console.log('Profile onLoad');
    wx.showModal({
      title: 'Debug',
      content: 'Profile page onLoad triggered',
      showCancel: false
    });
  },

  onShow: function() {
    console.log('Profile onShow');
    this.setData({
      testMessage: 'Page Shown at ' + new Date().toLocaleTimeString()
    });
  },

  onReady: function() {
    console.log('Profile onReady');
  },

  onHide: function() {
    console.log('Profile onHide');
  },

  onUnload: function() {
    console.log('Profile onUnload');
  }
}); 