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
      paymentAmount: '', // 新增收款金额字段
      description: ''
    },
    descriptionLength: 0
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