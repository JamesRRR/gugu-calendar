Page({
  data: {
    event: null,
    isCreator: false,
    hasJoined: false,
    formattedStartTime: '',
    formattedEndTime: '',
    participants: [],
    needProfile: false,
    needProfileMessage: '',
    profileNickName: ''
  },

  // 通过用户操作触发授权，确保有昵称+头像+openId，并同步到云端 users
  ensureUserProfile() {
    const cached = wx.getStorageSync('userInfo') || {};
    const badNickName = !cached.nickName || cached.nickName === '微信用户' || cached.nickName === '匿名用户';
    const badAvatarUrl = !cached.avatarUrl || (typeof cached.avatarUrl === 'string' && cached.avatarUrl.startsWith('wxfile://'));
    const hasAvatar = !!cached.avatarFileId || !badAvatarUrl;
    // 加入活动不需要前端拿 openId（云函数可直接拿到 OPENID），这里只要求头像+昵称（且头像不能是 wxfile:// 临时路径）
    const hasProfile = !!(hasAvatar && !badNickName);
    if (hasProfile) {
      // 轻量同步一次，避免云端 users 缺字段
      return wx.cloud.callFunction({
        name: 'updateUser',
        data: { userInfo: cached }
      }).catch(() => {}).then(() => cached);
    }

    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于在活动中展示头像昵称',
        success: (res) => {
          const userInfo = res.userInfo || {};
          // 注意：这里不再调用 login 云函数获取 openId，避免因为云调用异常导致“已授权却提示未授权”
          getApp().globalData.userInfo = userInfo;
          wx.setStorageSync('userInfo', userInfo);

          wx.cloud.callFunction({
            name: 'updateUser',
            data: { userInfo }
          }).then(() => {
            resolve(userInfo);
          }).catch(reject);
        },
        fail: reject
      });
    });
  },

  getEnvVersion() {
    try {
      return wx.getAccountInfoSync().miniProgram.envVersion; // develop | trial | release
    } catch (e) {
      return 'release';
    }
  },

  onLoad(options) {
    const id = options && options.id;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/registered/registered' });
      }, 1500);
      return;
    }
    this.fetchEventDetails(id);
  },

  fetchEventDetails(eventId) {
    if (!eventId) return;

    wx.showLoading({
      title: '加载中...',
    });
    wx.cloud.callFunction({
      name: 'getEventDetail',
      data: { eventId }
    }).then(res => {
      wx.hideLoading();
      if (!res.result || !res.result.success) {
        console.error('getEventDetail failed:', res);
        const envVersion = this.getEnvVersion();
        if (envVersion === 'develop' || envVersion === 'trial') {
          wx.showModal({
            title: '加载失败（调试信息）',
            content: JSON.stringify(res.result || res, null, 2).slice(0, 1800),
            showCancel: false
          });
        }
        wx.showToast({ title: (res.result && res.result.message) || '加载失败', icon: 'none' });
        return;
      }

      const event = res.result.data;
      const participants = res.result.participants || [];

      // 格式化时间
      const startTime = new Date(event.startTime);
      const formattedStartTime = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日 ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

      let formattedEndTime = '';
      if (event.endTime) {
        const endTime = new Date(event.endTime);
        formattedEndTime = `${endTime.getFullYear()}年${endTime.getMonth() + 1}月${endTime.getDate()}日 ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      }

      this.setData({
        event,
        participants,
        isCreator: !!res.result.isCreator,
        hasJoined: !!res.result.hasJoined,
        formattedStartTime,
        formattedEndTime
      });
    }).catch(err => {
      console.error('获取活动详情失败：', err);
      wx.hideLoading();
      const envVersion = this.getEnvVersion();
      if (envVersion === 'develop' || envVersion === 'trial') {
        wx.showModal({
          title: '加载失败（调试信息）',
          content: JSON.stringify(err, Object.getOwnPropertyNames(err), 2).slice(0, 1800),
          showCancel: false
        });
      }
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  // 分享配置
  onShareAppMessage() {
    const event = this.data.event;
    return {
      title: event.title,
      path: `/pages/event/detail?id=${event._id}`,
      imageUrl: '/images/share-cover.png'
    };
  },

  // 加入活动
  joinEvent() {
    const event = this.data.event;
    if (!event || !event._id) return;

    wx.showLoading({ title: '加入中' });
    this.ensureUserProfile().then(userInfo => {
      return wx.cloud.callFunction({
        name: 'joinEvent',
        data: {
          eventId: event._id,
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            avatarFileId: userInfo.avatarFileId
          }
        }
      });
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已加入', icon: 'success' });
        this.fetchEventDetails(event._id);
      } else {
        if (res && res.result && res.result.code === 'NEED_PROFILE') {
          const cached = wx.getStorageSync('userInfo') || {};
          const badNickName = !cached.nickName || cached.nickName === '微信用户' || cached.nickName === '匿名用户';
          this.setData({
            needProfile: true,
            needProfileMessage: res.result.message || '请先授权头像和昵称后再加入',
            profileNickName: badNickName ? '' : cached.nickName
          });
          return;
        }
        wx.showToast({
          title: (res.result && res.result.message) || '加入失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加入活动失败：', err);
      wx.hideLoading();
      const msg = (err && (err.errMsg || err.message)) || '加入失败';
      // getUserProfile 的 TAP 限制：提示用户直接点“加入”触发授权
      if (typeof msg === 'string' && msg.includes('getUserProfile:fail')) {
        this.setData({
          needProfile: true,
          needProfileMessage: '请点击下方按钮授权头像昵称后再加入'
        });
        return;
      }
      wx.showToast({ title: msg, icon: 'none' });
    });
  },

  onProfileNickNameChange(e) {
    this.setData({ profileNickName: (e && e.detail && e.detail.value) || '' });
  },

  closeNeedProfile() {
    this.setData({ needProfile: false, needProfileMessage: '' });
  },

  authorizeAndJoin() {
    // 用户点击触发：先确保有头像（getUserProfile），再要求用户填昵称，然后写入 users 后加入
    const nickName = (this.data.profileNickName || '').trim();
    if (!nickName || nickName === '微信用户' || nickName === '匿名用户') {
      wx.showToast({ title: '请先填写昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '授权中' });
    this.ensureUserProfile().then((cached) => {
      const merged = {
        ...cached,
        nickName
      };
      wx.setStorageSync('userInfo', merged);
      getApp().globalData.userInfo = merged;

      return wx.cloud.callFunction({
        name: 'updateUser',
        data: {
          userInfo: {
            nickName: merged.nickName,
            avatarUrl: merged.avatarUrl,
            avatarFileId: merged.avatarFileId
          }
        }
      }).then(() => merged);
    }).then((merged) => {
      this.setData({ needProfile: false, needProfileMessage: '' });
      return wx.cloud.callFunction({
        name: 'joinEvent',
        data: {
          eventId: this.data.event && this.data.event._id,
          userInfo: {
            nickName: merged.nickName,
            avatarUrl: merged.avatarUrl,
            avatarFileId: merged.avatarFileId
          }
        }
      });
    }).then((res) => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '已加入', icon: 'success' });
        this.fetchEventDetails(this.data.event._id);
      } else {
        wx.showToast({ title: (res.result && res.result.message) || '加入失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      const msg = (err && (err.errMsg || err.message)) || '授权失败';
      wx.showToast({ title: msg, icon: 'none' });
    });
  },

  // 退出活动
  quitEvent() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出该活动吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          wx.cloud.callFunction({
            name: 'quitEvent',
            data: {
              eventId: this.data.event._id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result.success) {
              wx.showToast({
                title: '已退出活动',
                icon: 'success'
              });
              
              // 延迟后跳转到已注册活动列表页面
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/registered/registered'
                });
              }, 1500);
            }
          }).catch(err => {
            console.error('退出活动失败：', err);
            wx.hideLoading();
            wx.showToast({
              title: '退出失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 点击咕咕按钮时的处理
  onRegret() {
    const event = this.data.event;
    wx.showModal({
      title: '确认咕咕',
      content: `咕咕这个活动将扣除 ${event.regretPointsRequired || 1} 个咕咕点数，确定要咕咕吗？`,
      confirmText: '确定咕咕',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          this.regretEvent();
        }
      }
    });
  },

  // 执行咕咕操作
  regretEvent() {
    wx.showLoading({ title: '处理中' });
    const localUserInfo = wx.getStorageSync('userInfo') || {}

    wx.cloud.callFunction({
      name: 'guguEvent',
      data: {
        eventId: this.data.event._id,
        // 用于新环境 users 记录缺失时自动补齐
        userInfo: {
          nickName: localUserInfo.nickName,
          avatarUrl: localUserInfo.avatarUrl
        }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '已咕咕',
          icon: 'success'
        });
        
        // 刷新页面数据
        this.fetchEventDetails(this.data.event._id);

        // 刷新个人中心页面的数据
        const profilePage = getCurrentPages().find(page => page.route === 'pages/profile/index');
        if (profilePage) {
          profilePage.loadUserStats();
        }

        // 如果活动被取消，发送通知
        if (res.result.cancelled) {
          wx.showModal({
            title: '活动已取消',
            content: `由于超过半数参与者咕咕，活动"${this.data.event.title}"已自动取消`,
            showCancel: false
          });
        }
      } else {
        wx.showToast({
          title: res.result.message || '咕咕失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('咕咕失败：', err);
      wx.hideLoading();
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

}); 