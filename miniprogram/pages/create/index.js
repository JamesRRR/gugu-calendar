Page({
  data: {
    formData: {
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: {
        name: '',
        latitude: null,
        longitude: null
      },
      maxParticipants: '',
      regretPointsRequired: 1,
      description: ''
    },
    descriptionLength: 0
  },

  // 输入处理函数
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  onStartDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  onStartTimeChange(e) {
    this.setData({
      'formData.startTime': e.detail.value
    });
  },

  onEndDateChange(e) {
    this.setData({
      'formData.endDate': e.detail.value
    });
  },

  onEndTimeChange(e) {
    this.setData({
      'formData.endTime': e.detail.value
    });
  },

  onRegretPointsChange(e) {
    this.setData({
      'formData.regretPointsRequired': e.detail.value
    });
  },

  onDescriptionInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.description': value,
      descriptionLength: value.length
    });
  },

  // 选择地点
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.location': {
            name: res.name || res.address,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
      },
      fail: (err) => {
        console.error('选择地点失败:', err);
        wx.showToast({
          title: '选择地点失败',
          icon: 'none'
        });
      }
    });
  },

  // 表单提交
  submitForm(e) {
    const formData = this.data.formData;
    
    // 验证必填字段
    if (!formData.title.trim()) {
      return wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
    }

    if (!formData.startDate) {
      return wx.showToast({
        title: '请选择开始日期',
        icon: 'none'
      });
    }

    if (!formData.location.name) {
      return wx.showToast({
        title: '请选择活动地点',
        icon: 'none'
      });
    }

    // 构建开始时间和结束时间
    const startTime = new Date(`${formData.startDate} ${formData.startTime || '00:00'}`).getTime();
    let endTime = null;
    if (formData.endDate) {
      endTime = new Date(`${formData.endDate} ${formData.endTime || '23:59'}`).getTime();
      if (endTime < startTime) {
        return wx.showToast({
          title: '结束时间不能早于开始时间',
          icon: 'none'
        });
      }
    }

    // 调用云函数创建活动
    wx.showLoading({ title: '创建中' });
    wx.cloud.callFunction({
      name: 'createEvent',
      data: {
        title: formData.title,
        startTime,
        endTime,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        regretPointsRequired: formData.regretPointsRequired,
        description: formData.description
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        // 跳转到活动详情页
        wx.navigateTo({
          url: `/pages/event/detail?id=${res.result.eventId}`
        });
      } else {
        wx.showToast({
          title: res.result.message || '创建失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('创建活动失败:', err);
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    });
  }
}); 