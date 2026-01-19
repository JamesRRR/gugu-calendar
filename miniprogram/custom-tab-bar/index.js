Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#07c160",
    list: [{
      pagePath: "pages/registered/registered",
      text: "已注册",
      iconText: "📋",
      selectedIconText: "📋"
    }, {
      pagePath: "pages/create-entry/index",
      text: "创建活动",
      iconText: "➕",
      selectedIconText: "➕"
    }, {
      pagePath: "pages/profile/index",
      text: "我的",
      iconText: "👤",
      selectedIconText: "👤"
    }]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = '/' + data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
}) 