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
      paymentAmount: '',
      totalAmount: '',
      description: ''
    },
    descriptionLength: 0
  },

  // 处理标题输入
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  // 处理描述输入
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
      success: res => {
        this.setData({
          'formData.location': {
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
      },
      fail: err => {
        console.error('选择地点失败:', err);
        wx.showToast({
          title: '选择地点失败',
          icon: 'none'
        });
      }
    });
  },

  // 时间选择器的处理方法
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

  // 处理总价输入
  onTotalAmountInput(e) {
    const totalAmount = e.detail.value;
    const maxParticipants = this.data.formData.maxParticipants;
    
    this.setData({
      'formData.totalAmount': totalAmount
    });
    
    // 如果设置了人数限制，自动计算人均金额
    if (totalAmount && maxParticipants) {
      const perPerson = (parseFloat(totalAmount) / parseInt(maxParticipants)).toFixed(2);
      this.setData({
        'formData.paymentAmount': perPerson
      });
    }
  },

  // 监听人数限制变化，重新计算人均金额
  onMaxParticipantsInput(e) {
    const maxParticipants = e.detail.value;
    const totalAmount = this.data.formData.totalAmount;
    
    this.setData({
      'formData.maxParticipants': maxParticipants
    });
  },

  // 复用大部分原有的输入处理函数...

  onPaymentAmountInput(e) {
    this.setData({
      'formData.paymentAmount': e.detail.value
    });
  },

  submitForm(e) {
    const formData = this.data.formData;
    
    // 基本验证
    if (!formData.title.trim()) {
      return wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
    }

    // 验证开始日期
    if (!formData.startDate) {
      return wx.showToast({
        title: '请选择开始日期',
        icon: 'none'
      });
    }

    // 验证结束日期
    if (!formData.endDate) {
      return wx.showToast({
        title: '请选择结束日期',
        icon: 'none'
      });
    }

    // 验证收款金额
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      return wx.showToast({
        title: '请输入有效的预收款金额',
        icon: 'none'
      });
    }

    // 验证地点
    if (!formData.location.name) {
      return wx.showToast({
        title: '请选择活动地点',
        icon: 'none'
      });
    }

    // 处理时间格式
    const startDateTime = formData.startDate + ' ' + (formData.startTime || '00:00');
    const endDateTime = formData.endDate + ' ' + (formData.endTime || '23:59');

    // 调用云函数创建收款模式活动
    wx.showLoading({ title: '创建中' });
    wx.cloud.callFunction({
      name: 'createEvent',
      data: {
        title: formData.title,
        startTime: new Date(startDateTime).getTime(),
        endTime: new Date(endDateTime).getTime(),
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        description: formData.description,
        mode: 'payment',
        // 确保金额为数字类型
        paymentAmount: parseFloat(formData.paymentAmount),
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
        status: 'pending'
      }
    }).then(res => {
      if (res.result && res.result.success) {
        wx.hideLoading();
        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 2000
        });
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/registered/registered'
          });
        }, 2000);
      } else {
        throw new Error(res.result.message || '创建失败');
      }
    }).catch(err => {
      console.error('创建活动失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '创建失败，请重试',
        icon: 'none',
        duration: 2000
      });
    });
  }
}); 