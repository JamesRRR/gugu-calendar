Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#07c160",
    list: [{
      pagePath: "pages/event/create",
      text: "创建",
      iconType: "add",
      selectedIconType: "add"
    }, {
      pagePath: "pages/event/list",
      text: "活动",
      iconType: "waiting",
      selectedIconType: "waiting"
    }, {
      pagePath: "pages/profile/index",
      text: "我的",
      iconType: "personal",
      selectedIconType: "personal"
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