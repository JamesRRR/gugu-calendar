Page({
  data: {
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    maxParticipants: 0,
    minDate: new Date().toISOString().split('T')[0]
  },

  onLoad() {
    // 页面加载时的初始化
  },

  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  decreaseNumber() {
    if (this.data.maxParticipants > 0) {
      this.setData({
        maxParticipants: this.data.maxParticipants - 1
      });
    }
  },

  increaseNumber() {
    this.setData({
      maxParticipants: this.data.maxParticipants + 1
    });
  },

  onMaxParticipantsChange(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    this.setData({
      maxParticipants: value
    });
  },

  createEvent() {
    if (!this.validateForm()) return;

    wx.showLoading({
      title: '创建中...'
    });

    const eventData = {
      title: this.data.title,
      dateTime: `${this.data.date} ${this.data.time}`,
      location: this.data.location,
      description: this.data.description,
      maxParticipants: this.data.maxParticipants,
      createdAt: new Date().toISOString()
    };

    wx.cloud.callFunction({
      name: 'createEvent',
      data: eventData
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 2000
        });
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/event/detail?id=${res.result.eventId}`
          });
        }, 2000);
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    });
  },

  validateForm() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.date || !this.data.time) {
      wx.showToast({
        title: '请选择活动时间',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.location.trim()) {
      wx.showToast({
        title: '请输入活动地点',
        icon: 'none'
      });
      return false;
    }
    return true;
  }
}); 