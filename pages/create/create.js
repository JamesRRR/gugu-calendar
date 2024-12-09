Page({
  data: {
    formData: {
      title: '',
      dateTime: '',
      address: '',
      latitude: '',
      longitude: '',
      description: ''
    },
    dateTimeArray: [],
    dateTimeIndex: [0, 0, 0, 0, 0],
  },

  onLoad() {
    this.initDateTimePicker();
  },

  // 初始化日期时间选择器
  initDateTimePicker() {
    const date = new Date();
    const years = [];
    const months = [];
    const days = [];
    const hours = [];
    const minutes = [];
    
    // 未来3年
    for (let i = date.getFullYear(); i <= date.getFullYear() + 2; i++) {
      years.push(i + '年');
    }
    
    for (let i = 1; i <= 12; i++) {
      months.push(i + '月');
    }
    
    for (let i = 1; i <= 31; i++) {
      days.push(i + '日');
    }
    
    for (let i = 0; i < 24; i++) {
      hours.push(i + '时');
    }
    
    for (let i = 0; i < 60; i++) {
      minutes.push(i + '分');
    }

    this.setData({
      dateTimeArray: [years, months, days, hours, minutes],
      dateTimeIndex: [0, date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes()]
    });
  },

  // 日期时间��择器列变化
  changeDateTimeColumn(e) {
    const { column, value } = e.detail;
    const { dateTimeArray, dateTimeIndex } = this.data;
    
    dateTimeIndex[column] = value;
    
    // 处理月份天数联动
    if (column === 0 || column === 1) {
      const year = parseInt(dateTimeArray[0][dateTimeIndex[0]]);
      const month = parseInt(dateTimeArray[1][dateTimeIndex[1]]);
      const days = new Date(year, month, 0).getDate();
      
      const newDays = [];
      for (let i = 1; i <= days; i++) {
        newDays.push(i + '日');
      }
      
      dateTimeArray[2] = newDays;
      if (dateTimeIndex[2] >= newDays.length) {
        dateTimeIndex[2] = newDays.length - 1;
      }
    }
    
    this.setData({
      dateTimeArray,
      dateTimeIndex
    });
  },

  // 日期时间选择器值变化
  changeDateTime(e) {
    const { dateTimeArray, dateTimeIndex } = this.data;
    const value = e.detail.value;
    
    const dateTime = 
      dateTimeArray[0][value[0]] + 
      dateTimeArray[1][value[1]] + 
      dateTimeArray[2][value[2]] + 
      dateTimeArray[3][value[3]] + 
      dateTimeArray[4][value[4]];
    
    this.setData({
      'formData.dateTime': dateTime,
      dateTimeIndex: value
    });
  },

  // 选择地点
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.address': res.address,
          'formData.latitude': res.latitude,
          'formData.longitude': res.longitude
        });
      },
      fail: (err) => {
        console.error('选择地点失败', err);
        wx.showToast({
          title: '选择地点失败',
          icon: 'none'
        });
      }
    });
  },

  // 提交表单
  async submitForm(e) {
    const formData = {
      ...this.data.formData,
      ...e.detail.value
    };

    // 表单验证
    if (!formData.title.trim()) {
      wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
      return;
    }

    if (!formData.dateTime) {
      wx.showToast({
        title: '请选择活动时间',
        icon: 'none'
      });
      return;
    }

    if (!formData.address) {
      wx.showToast({
        title: '请选择活动地点',
        icon: 'none'
      });
      return;
    }

    try {
      const db = wx.cloud.database();
      
      // 创建活动记录
      await db.collection('activities').add({
        data: {
          ...formData,
          createTime: db.serverDate(),
          participants: [],
          status: 'pending' // pending, ongoing, completed, cancelled
        }
      });

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      console.error('创建活动失败', err);
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    }
  }
}); 