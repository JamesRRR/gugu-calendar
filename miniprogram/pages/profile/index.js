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
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
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
      ...this.data.userInfo, 
      avatarUrl
    };
    
    this.setData({ userInfo });
    getApp().globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    wx.cloud.callFunction({
      name: 'updateUser',
      data: {
        userInfo
      }
    }).catch(err => {
      console.error('更新头像失败：', err);
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
        const participationRate = stats.totalEvents > 0 
          ? ((stats.completedEvents / stats.totalEvents) * 100).toFixed(1)
          : 0;
        
        const finalStats = {
          ...stats,
          participationRate: participationRate + '%',
          regretPoints: stats.regretPoints || 0
        };
        console.log('Final stats to be set:', finalStats);
        
        this.setData({
          stats: finalStats
        }, () => {
          // 在setData的回调中确认数据已更新
          console.log('Current stats after update:', this.data.stats);
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