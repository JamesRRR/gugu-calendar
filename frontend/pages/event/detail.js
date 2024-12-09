Page({
  data: {
    event: null,
    isCreator: false,
    isParticipant: false,
    loading: true
  },

  onLoad: function(options) {
    this.eventId = options.id
    this.loadEventDetail()
  },

  onPullDownRefresh: function() {
    this.loadEventDetail()
  },

  onShareAppMessage: function() {
    const event = this.data.event
    return {
      title: event.title,
      path: `/pages/event/detail?id=${this.eventId}`,
      imageUrl: event.coverImage // 如果有活动封面图的话
    }
  },

  async loadEventDetail() {
    try {
      wx.showLoading({ title: '加载中' })
      const db = wx.cloud.database()
      const result = await db.collection('events').doc(this.eventId).get()
      const event = result.data
      
      const userInfo = wx.getStorageSync('userInfo')
      const isCreator = event.creatorId === userInfo.openId
      const isParticipant = event.participants.includes(userInfo.openId)

      this.setData({
        event,
        isCreator,
        isParticipant,
        loading: false
      })
    } catch (err) {
      console.error('加载活动详情失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      wx.stopPullDownRefresh()
    }
  },

  async handleJoinEvent() {
    try {
      wx.showLoading({ title: '处理中' })
      const result = await wx.cloud.callFunction({
        name: 'createEvent',
        data: {
          action: 'join',
          eventId: this.eventId
        }
      })

      if (result.result.success) {
        wx.showToast({
          title: '加入成功'
        })
        this.loadEventDetail()
      } else {
        wx.showToast({
          title: result.result.message,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加入活动失败:', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async handleLeaveEvent() {
    try {
      const confirmed = await new Promise(resolve => {
        wx.showModal({
          title: '确认退出',
          content: '确定要退出这个活动吗？',
          success: res => resolve(res.confirm)
        })
      })

      if (!confirmed) return

      wx.showLoading({ title: '处理中' })
      const result = await wx.cloud.callFunction({
        name: 'createEvent',
        data: {
          action: 'leave',
          eventId: this.eventId
        }
      })

      if (result.result.success) {
        wx.showToast({
          title: '已退出活动'
        })
        this.loadEventDetail()
      } else {
        wx.showToast({
          title: result.result.message,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('退出活动失败:', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
}) 