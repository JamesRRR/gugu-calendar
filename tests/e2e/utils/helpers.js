// Gugu Calendar 测试辅助函数
const helpers = {
  mockAPI: {
    createEvent: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: { eventId: 'event-123' }
      })
    ),
    joinEvent: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: { success: true }
      })
    ),
    quitEvent: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: { success: true }
      })
    ),
    cancelEvent: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: { success: true }
      })
    ),
    getEventList: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: [
          { _id: '1', title: '活动1', status: 'active' },
          { _id: '2', title: '活动2', status: 'active' }
        ]
      })
    ),
    getLeaderboard: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: [
          { openid: 'user1', nickName: '用户1', guguCount: 5, guguRate: 25 },
          { openid: 'user2', nickName: '用户2', guguCount: 3, guguRate: 15 }
        ]
      })
    ),
    getUserStats: jest.fn(() =>
      Promise.resolve({
        code: 0,
        data: {
          totalEvents: 20,
          guguCount: 2,
          guguRate: 10,
          featherCount: 8
        }
      })
    )
  },

  generateTestData: {
    randomEvent: () => ({
      title: '测试活动_' + Math.random().toString(36).substring(7),
      date: '2024-02-01',
      location: '测试地点',
      description: '测试描述',
      maxParticipants: Math.floor(Math.random() * 20) + 5
    }),
    randomGuguRate: () => Math.floor(Math.random() * 100),
    randomFeatherCount: () => Math.floor(Math.random() * 10)
  },

  assertions: {
    isDefined: (val) => expect(val).toBeDefined(),
    isPositiveNumber: (val) => expect(val).toBeGreaterThanOrEqual(0),
    isValidGuguRate: (rate) => expect(rate).toBeGreaterThanOrEqual(0) && expect(rate).toBeLessThanOrEqual(100),
    isEventObject: (event) => {
      expect(event).toHaveProperty('_id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('status');
    }
  }
};

module.exports = helpers;
