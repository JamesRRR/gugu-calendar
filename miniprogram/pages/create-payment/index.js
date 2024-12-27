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
    
    // 如果设置了总价，自动计算人均金额
    if (totalAmount && maxParticipants) {
      const perPerson = (parseFloat(totalAmount) / parseInt(maxParticipants)).toFixed(2);
      this.setData({
        'formData.paymentAmount': perPerson
      });
    }
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

    // 验证收款金额
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      return wx.showToast({
        title: '请输入有效的收款金额',
        icon: 'none'
      });
    }

    // 其他验证逻辑...

    // 调用云函数创建收款模式活动
    wx.showLoading({ title: '创建中' });
    wx.cloud.callFunction({
      name: 'createEvent',
      data: {
        ...formData,
        mode: 'payment',
        paymentAmount: parseFloat(formData.paymentAmount)
      }
    }).then(res => {
      // 处理响应...
    }).catch(err => {
      // 处理错误...
    });
  }
}); 