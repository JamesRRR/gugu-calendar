Page({
  data: {
    date: '',
    time: '',
    minDate: '',
    maxParticipants: 0,
    description: ''
  },

  onLoad() {
    // 设置最小日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      minDate: `${year}-${month}-${day}`
    });
  },

  dateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  timeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  // 添加表单提交方法
  submitEvent(e) {
    const userInfo = getApp().globalData.userInfo;
    if (!userInfo || !userInfo.openId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const formData = e.detail.value;
    
    // 表单验证
    if (!formData.title || !formData.title.trim()) {
      wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
      return;
    }

    if (!this.data.date || !this.data.time) {
      wx.showToast({
        title: '请选择活动时间',
        icon: 'none'
      });
      return;
    }

    const datetime = new Date(`${this.data.date} ${this.data.time}`);
    if (isNaN(datetime.getTime())) {
      wx.showToast({
        title: '时间格式错误',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '创建中...',
      mask: true
    });

    const eventData = {
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : '',
      location: formData.location ? formData.location.trim() : '',
      maxParticipants: parseInt(formData.maxParticipants) || 0,
      startTime: datetime,
      creatorId: userInfo.openId,
      status: 'upcoming',
      createTime: new Date(),
      participants: [userInfo.openId]
    };

    wx.cloud.callFunction({
      name: 'createEvent',
      data: eventData
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/event/detail?id=${res.result.eventId}`
          });
        }, 1500);
      } else {
        throw new Error(res.result ? res.result.message : '创建失败');
      }
    }).catch(err => {
      console.error('创建活动失败：', err);
      wx.hideLoading();
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    });
  },

  // 人数限制相关方法
  maxParticipantsChange(e) {
    let value = parseInt(e.detail.value) || 0;
    if (value < 0) value = 0;
    this.setData({
      maxParticipants: value
    });
  },

  decreaseNumber() {
    let value = this.data.maxParticipants - 1;
    if (value < 0) value = 0;
    this.setData({
      maxParticipants: value
    });
  },

  increaseNumber() {
    this.setData({
      maxParticipants: this.data.maxParticipants + 1
    });
  }
}); 