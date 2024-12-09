Page({
  data: {
    date: '',
    time: '',
    minDate: ''
  },

  onLoad() {
    console.log('页面加载');
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
    console.log('触发日期选择:', e);
    if (e.detail && e.detail.value) {
      this.setData({
        date: e.detail.value
      }, () => {
        console.log('日期已更新:', this.data.date);
      });
    }
  },

  timeChange(e) {
    console.log('触发时间选择:', e);
    if (e.detail && e.detail.value) {
      this.setData({
        time: e.detail.value
      }, () => {
        console.log('时间已更新:', this.data.time);
      });
    }
  },

  submitEvent(e) {
    const formData = e.detail.value;
    
    // 表单验证
    if (!formData.title) {
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

    const datetime = `${this.data.date} ${this.data.time}`;
    
    wx.showLoading({
      title: '创建中...',
    });

    wx.cloud.callFunction({
      name: 'createEvent',
      data: {
        title: formData.title,
        description: formData.description,
        eventDate: datetime
      }
    }).then(res => {
      wx.hideLoading();
      console.log('云函数返回结果:', res);
      if (res.result && res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        });
      } else {
        wx.showToast({
          title: res.result?.message || '创建失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('调用云函数失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      });
    });
  },

  onTapDatePicker() {
    console.log('点击日期选择器容器');
  },

  onTapTimePicker() {
    console.log('点击时间选择器容器');
  },

  onPickerTap() {
    console.log('点击picker本身');
  },

  onPickerCancel() {
    console.log('取消选择');
  }
}); 