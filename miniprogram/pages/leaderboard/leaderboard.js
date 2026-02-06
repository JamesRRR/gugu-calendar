Page({
  data: {
    todayKing: null, // 今日咕王
    leaderboard: [],
    currentUser: null,
    isLoading: true,
    todayDate: ''
  },

  onLoad() {
    this.setTodayDate();
    this.loadLeaderboard();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadLeaderboard();
  },

  setTodayDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    this.setData({
      todayDate: `${month}月${day}日`
    });
  },

  loadLeaderboard() {
    this.setData({ isLoading: true });
    
    wx.cloud.callFunction({
      name: 'getLeaderboard'
    }).then(res => {
      console.log('getLeaderboard response:', res.result);
      this.setData({ isLoading: false });
      
      if (res.result.success) {
        const { todayKing, leaderboard } = res.result.data;
        
        // 获取当前用户信息用于对比
        const userInfo = wx.getStorageSync('userInfo');
        
        this.setData({
          todayKing,
          leaderboard,
          currentUser: userInfo
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('Failed to load leaderboard:', err);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  getMockData() {
    // 模拟数据，用于测试
    return {
      todayKing: {
        nickName: '咕咕大王',
        avatarUrl: '',
        todayGuguCount: 5,
        guguRate: 85.5
      },
      leaderboard: [
        { rank: 1, nickName: '咕咕大王', todayGuguCount: 5, guguRate: 85.5, isTodayKing: true },
        { rank: 2, nickName: '放鸽子专业户', todayGuguCount: 3, guguRate: 72.3 },
        { rank: 3, nickName: '迟到大王', todayGuguCount: 2, guguRate: 65.8 },
        { rank: 4, nickName: '临时有事', todayGuguCount: 2, guguRate: 58.2 },
        { rank: 5, nickName: '下次一定', todayGuguCount: 1, guguRate: 45.6 },
        { rank: 6, nickName: '鸽子王中王', todayGuguCount: 1, guguRate: 42.1 },
        { rank: 7, nickName: '咕咕咕', todayGuguCount: 1, guguRate: 38.5 },
        { rank: 8, nickName: '放你鸽子', todayGuguCount: 0, guguRate: 35.2 },
        { rank: 9, nickName: '今天鸽了吗', todayGuguCount: 0, guguRate: 28.9 },
        { rank: 10, nickName: '最后的鸽子', todayGuguCount: 0, guguRate: 22.3 }
      ]
    };
  }
});
