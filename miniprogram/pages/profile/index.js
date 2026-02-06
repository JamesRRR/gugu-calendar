Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    stats: {
      totalGuguCount: 0,
      totalEvents: 0,
      completedEvents: 0,
      participationRate: '0%',
      regretPoints: 0
    },
    guguRate: 0, // 咕咕率 (咕咕次数/参与活动总数)
    pointsPackages: [
      { points: 100, price: 648 },
      { points: 10, price: 128 }
    ]
  },

  setTabSelected() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onLoad() {
    this.setTabSelected();
    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      const badNickName = !userInfo.nickName || userInfo.nickName === '微信用户' || userInfo.nickName === '匿名用户';
      const hasProfile = !!(userInfo.openId && (userInfo.avatarUrl || userInfo.avatarFileId) && !badNickName);
      this.setData({
        userInfo: userInfo,
        hasUserInfo: hasProfile
      });

      // 若本地只有 avatarFileId（云存储），补一个可展示的临时 URL
      if (!userInfo.avatarUrl && userInfo.avatarFileId) {
        wx.cloud.getTempFileURL({
          fileList: [userInfo.avatarFileId]
        }).then(r => {
          const url = r.fileList && r.fileList[0] && r.fileList[0].tempFileURL;
          if (url) {
            const updated = { ...userInfo, avatarUrl: url };
            this.setData({ userInfo: updated });
            wx.setStorageSync('userInfo', updated);
            getApp().globalData.userInfo = updated;
          }
        }).catch(err => {
          console.error('获取头像临时链接失败：', err);
        });
      }

      // 确保userInfo中有openId
      if (userInfo.openId) {
        this.loadUserStats();
      } else {
        // 如果没有openId，重新获取
        wx.cloud.callFunction({
          name: 'login'
        }).then(res => {
          userInfo.openId = res.result.openid;
          wx.setStorageSync('userInfo', userInfo);
          this.setData({ userInfo });
          this.loadUserStats();
        });
      }
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 先调用登录云函数获取 openId
        wx.cloud.callFunction({
          name: 'login'
        }).then(loginRes => {
          const completeUserInfo = {
            ...userInfo,
            openId: loginRes.result.openid
          };
          
          // 保存到全局数据和本地存储
          getApp().globalData.userInfo = completeUserInfo;
          wx.setStorageSync('userInfo', completeUserInfo);
          
          this.setData({
            userInfo: completeUserInfo,
            hasUserInfo: true
          });
          
          // 确保在更新用户信息后再加载统计信息
          wx.cloud.callFunction({
            name: 'updateUser',
            data: {
              userInfo: completeUserInfo
            }
          }).then(() => {
            // 在updateUser成功后加载统计信息
            this.loadUserStats();
          }).catch(err => {
            console.error('更新用户信息失败：', err);
          });
        }).catch(err => {
          console.error('登录失败：', err);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = {
      ...(this.data.userInfo || {}),
      avatarUrl
    };

    const ensureOpenId = userInfo.openId
      ? Promise.resolve(userInfo.openId)
      : wx.cloud.callFunction({ name: 'login' }).then(res => {
          userInfo.openId = res.result.openid;
          return userInfo.openId;
        });

    ensureOpenId.then((openid) => {
      // chooseAvatar 返回的是本地临时路径 wxfile://，需要上传到云存储供他人/跨设备展示
      const needUpload = typeof avatarUrl === 'string' && avatarUrl.startsWith('wxfile://');
      if (!needUpload) return null;

      const cloudPath = `avatars/${openid}_${Date.now()}.png`;
      return wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl
      }).then(up => up.fileID);
    }).then((fileID) => {
      if (fileID) {
        userInfo.avatarFileId = fileID;
      }

      this.setData({ userInfo, hasUserInfo: true });
      getApp().globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);

      wx.cloud.callFunction({
        name: 'updateUser',
        data: {
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl, // 若是 wxfile:// 云端会忽略
            avatarFileId: userInfo.avatarFileId
          }
        }
      }).then(() => {
        this.loadUserStats();
      }).catch(err => {
        console.error('更新头像失败：', err);
      });
    }).catch(err => {
      console.error('获取 openId 失败：', err);
      wx.showToast({ title: '更新头像失败', icon: 'none' });
    });
  },

  onNicknameChange(e) {
    const nickName = e.detail.value;
    if (!nickName) return;
    
    const userInfo = { ...this.data.userInfo, nickName };
    
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userInfo
      }
    }).catch(err => {
      console.error('更新昵称失败：', err);
    });
  },

  loadUserStats() {
    const userInfo = this.data.userInfo;
    console.log('Loading stats for user:', userInfo); // 添加日志

    if (!userInfo || !userInfo.openId) {
      console.log('No user info or openId available'); // 添加日志
      return;
    }

    wx.cloud.callFunction({
      name: 'getUserStats',
      data: {
        userId: userInfo.openId
      }
    }).then(res => {
      console.log('getUserStats response:', res.result);
      if (res.result.success) {
        const stats = res.result.stats;
        console.log('Stats from cloud:', stats);
        
        // 计算咕咕率 = (咕咕次数 / 参与活动总数) × 100%
        const totalEvents = stats.totalEvents || 0;
        const guguCount = stats.totalGuguCount || 0;
        const guguRate = totalEvents > 0 
          ? ((guguCount / totalEvents) * 100).toFixed(1)
          : 0;
        
        const participationRate = totalEvents > 0 
          ? ((stats.completedEvents / totalEvents) * 100).toFixed(1)
          : 0;
        
        const finalStats = {
          ...stats,
          participationRate: participationRate + '%',
          regretPoints: stats.regretPoints || 0
        };
        
        console.log('Final stats to be set:', finalStats);
        console.log('Gugu rate:', guguRate + '%');
        
        this.setData({
          stats: finalStats,
          guguRate: parseFloat(guguRate)
        }, () => {
          // 在setData的回调中确认数据已更新
          console.log('Current stats after update:', this.data.stats);
          console.log('Current guguRate:', this.data.guguRate);
        });
      }
    }).catch(err => {
      console.error('Failed to load user stats:', err);
    });
  },

  goToFAQ() {
    console.log('Navigating to FAQ');
    wx.navigateTo({
      url: '/pages/faq/index',
      fail: (err) => {
        console.error('Navigation failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  goToIntro() {
    console.log('Navigating to Intro');
    wx.navigateTo({
      url: '/pages/intro/index',
      fail: (err) => {
        console.error('Navigation failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  goToLeaderboard() {
    wx.navigateTo({
      url: '/pages/leaderboard/leaderboard',
      fail: (err) => {
        console.error('Navigation to leaderboard failed:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  onShow() {
    this.setTabSelected();
    // 每次页面显示时刷新用户统计信息
    if (this.data.hasUserInfo) {
      this.loadUserStats();
    }
  },

  buyRegretPoints() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    console.log('Showing action sheet with packages:', this.data.pointsPackages);
    
    wx.showActionSheet({
      itemList: [
        '100点数 ¥648',
        '10点数 ¥128'
      ],
      success: (res) => {
        console.log('Selected index:', res.tapIndex);
        const selectedPackage = this.data.pointsPackages[res.tapIndex];
        console.log('Selected package:', selectedPackage);
        
        wx.showModal({
          title: '购买点数',
          content: `确认购买 ${selectedPackage.points} 点数？价格：¥${selectedPackage.price}`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.processPayment(selectedPackage);
            }
          }
        });
      },
      fail: (err) => {
        console.error('Action sheet failed:', err);
      }
    });
  },

  processPayment(pointsPackage) {
    wx.showLoading({ title: '处理中' });
    
    wx.cloud.callFunction({
      name: 'createPayment',
      data: {
        points: pointsPackage.points,
        price: pointsPackage.price
      }
    }).then(res => {
      wx.hideLoading();
      const payment = res.result.payment;
      
      wx.requestPayment({
        ...payment,
        success: (res) => {
          wx.showToast({
            title: '支付成功',
            icon: 'success'
          });
          this.loadUserStats();
        },
        fail: (err) => {
          console.error('支付失败：', err);
          wx.showToast({
            title: '支付失败',
            icon: 'none'
          });
        }
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('创建支付订单失败：', err);
      wx.showToast({
        title: '创建支付订单失败',
        icon: 'none'
      });
    });
  }
}); 
