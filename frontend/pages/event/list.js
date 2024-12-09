Page({
  data: {
    events: [],
    searchKeyword: '',
    pageSize: 10,
    currentPage: 0,
    hasMore: true
  },

  onLoad: function() {
    this.loadEvents()
  },

  onReachBottom: function() {
    if (this.data.hasMore) {
      this.loadEvents()
    }
  },

  loadEvents: async function() {
    const db = wx.cloud.database()
    const _ = db.command
    
    try {
      let query = db.collection('events')
      
      // 如果有搜索关键词，添加搜索条件
      if (this.data.searchKeyword) {
        query = query.where(_.or([
          {
            title: db.RegExp({
              regexp: this.data.searchKeyword,
              options: 'i'
            })
          },
          {
            description: db.RegExp({
              regexp: this.data.searchKeyword,
              options: 'i'
            })
          }
        ]))
      }
      
      const events = await query
        .skip(this.data.currentPage * this.data.pageSize)
        .limit(this.data.pageSize)
        .orderBy('createTime', 'desc')
        .get()
      
      this.setData({
        events: this.data.currentPage === 0 ? events.data : [...this.data.events, ...events.data],
        currentPage: this.data.currentPage + 1,
        hasMore: events.data.length === this.data.pageSize
      })
    } catch (err) {
      console.error(err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  onSearch: function(e) {
    this.setData({
      searchKeyword: e.detail.value,
      currentPage: 0,
      events: [],
      hasMore: true
    })
    this.loadEvents()
  }
}) 