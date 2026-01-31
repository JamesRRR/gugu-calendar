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
    descriptionLength: 0,
    dateOptions: [],
    timeOptions: [],
    startPickerValue: [0, 0],
    endPickerValue: [0, 0]
  },

  onLoad() {
    const dateOptions = this.buildDateOptions(730);
    const timeOptions = this.buildTimeOptions(5);
    this.setData({
      dateOptions,
      timeOptions,
      startPickerValue: [0, 0],
      endPickerValue: [0, 0]
    });
  },

  buildDateOptions(daysAhead) {
    const days = Number(daysAhead) || 365;
    const out = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i <= days; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      out.push(this.formatYMD(d));
    }
    return out;
  },

  buildTimeOptions(stepMinutes) {
    const step = Number(stepMinutes) || 5;
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return out;
  },

  formatYMD(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatHM(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  goToTab(e) {
    const index = Number(e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.index);
    const tabMap = {
      0: '/pages/registered/registered',
      1: '/pages/create-entry/index',
      2: '/pages/profile/index'
    };
    const url = tabMap[index] || tabMap[1];
    wx.switchTab({ url });
  },

  getEnvVersion() {
    try {
      return wx.getAccountInfoSync().miniProgram.envVersion; // develop | trial | release
    } catch (e) {
      return 'release';
    }
  },

  // iOS 兼容：iOS 不支持 "YYYY-MM-DD HH:mm"
  toTimestamp(dateStr, timeStr, fallbackTime) {
    const normalized = `${dateStr} ${timeStr || fallbackTime}`.replace(/-/g, '/');
    const ts = new Date(normalized).getTime();
    return ts;
  },

  // 输入处理函数
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  onStartDateTimeChange(e) {
    const [dateIndex, timeIndex] = e.detail.value || [0, 0];
    const startDate = this.data.dateOptions[dateIndex];
    const startTimeStr = this.data.timeOptions[timeIndex];

    const startTs = this.toTimestamp(startDate, startTimeStr, '00:00');
    const endDt = new Date(startTs + 60 * 60 * 1000);
    const endDate = this.formatYMD(endDt);
    const endTimeStr = this.formatHM(endDt);

    const endDateIndex = Math.max(0, this.data.dateOptions.indexOf(endDate));
    const endTimeIndex = Math.max(0, this.data.timeOptions.indexOf(endTimeStr));

    this.setData({
      startPickerValue: [dateIndex, timeIndex],
      endPickerValue: [endDateIndex, endTimeIndex],
      'formData.startDate': startDate,
      'formData.startTime': startTimeStr,
      'formData.endDate': endDate,
      'formData.endTime': endTimeStr
    });
  },

  onEndDateTimeChange(e) {
    const [dateIndex, timeIndex] = e.detail.value || [0, 0];
    const endDate = this.data.dateOptions[dateIndex];
    const endTimeStr = this.data.timeOptions[timeIndex];

    const startTs = this.toTimestamp(this.data.formData.startDate, this.data.formData.startTime, '00:00');
    const endTs = this.toTimestamp(endDate, endTimeStr, '23:59');

    if (!Number.isNaN(startTs) && !Number.isNaN(endTs) && endTs < startTs) {
      wx.showToast({ title: '结束时间不能早于开始时间', icon: 'none' });
      return;
    }

    this.setData({
      endPickerValue: [dateIndex, timeIndex],
      'formData.endDate': endDate,
      'formData.endTime': endTimeStr
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
    if (!formData.startTime) {
      return wx.showToast({
        title: '请选择开始时间',
        icon: 'none'
      });
    }

    if (!formData.endDate) {
      return wx.showToast({
        title: '请选择结束日期',
        icon: 'none'
      });
    }
    if (!formData.endTime) {
      return wx.showToast({
        title: '请选择结束时间',
        icon: 'none'
      });
    }

    // 构建开始时间和结束时间
    const startTime = this.toTimestamp(formData.startDate, formData.startTime, '00:00');
    if (Number.isNaN(startTime)) {
      return wx.showToast({
        title: '开始时间格式不正确',
        icon: 'none'
      });
    }

    const endTime = this.toTimestamp(formData.endDate, formData.endTime, '23:59');
    if (Number.isNaN(endTime)) {
      return wx.showToast({
        title: '结束时间格式不正确',
        icon: 'none'
      });
    }
    if (endTime < startTime) {
      return wx.showToast({
        title: '结束时间不能早于开始时间',
        icon: 'none'
      });
    }

    // 调用云函数创建活动
    wx.showLoading({ title: '创建中' });
    wx.cloud.callFunction({
      name: 'createEvent',
      data: {
        title: formData.title,
        startTime,
        endTime,
        // 地点可选：未填写时写入 null
        location: (formData.location && formData.location.name) ? formData.location : null,
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

        // 重置表单数据
        this.setData({
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
        });

        // 跳转到活动详情页
        wx.navigateTo({
          url: `/pages/event/detail?id=${res.result.eventId}`
        });
      } else {
        // 记录云函数返回的详细错误信息（开发/体验版可弹窗）
        console.error('createEvent failed:', res);
        const envVersion = this.getEnvVersion();
        if (envVersion === 'develop' || envVersion === 'trial') {
          const detail = res && res.result && (res.result.error || res.result);
          wx.showModal({
            title: '创建失败（调试信息）',
            content: JSON.stringify(detail, null, 2).slice(0, 1800),
            showCancel: false
          });
        }
        wx.showToast({
          title: res.result.message || '创建失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('创建活动失败:', err);
      const envVersion = this.getEnvVersion();
      if (envVersion === 'develop' || envVersion === 'trial') {
        wx.showModal({
          title: '创建失败（调试信息）',
          content: JSON.stringify(err, Object.getOwnPropertyNames(err), 2).slice(0, 1800),
          showCancel: false
        });
      }
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
    });
  },

  // 添加页面显示时的处理函数
  onShow() {
    // 获取从地图选点页面返回的位置信息
    const location = wx.getStorageSync('selectedLocation');
    if (location) {
      this.setData({
        'formData.location': location
      });
      wx.removeStorageSync('selectedLocation');  // 使用后清除缓存
    }
  }
}); 