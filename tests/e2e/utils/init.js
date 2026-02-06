// Gugu Calendar 初始化测试环境
jest.setTimeout(30000);

// Mock 微信小程序环境
global.wx = {
  login: jest.fn(),
  cloud: {
    init: jest.fn(),
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: [] })),
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn(() => Promise.resolve({ data: [] }))
            }))
          }))
        })),
        add: jest.fn(() => Promise.resolve({ _id: 'test-id' })),
        doc: jest.fn(() => ({
          update: jest.fn(() => Promise.resolve({ updated: 1 })),
          remove: jest.fn(() => Promise.resolve({ removed: 1 }))
        }))
      }))
    }))
  },
  request: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  chooseImage: jest.fn(),
  getLocation: jest.fn(),
  requestPayment: jest.fn()
};

global.Page = jest.fn((options) => options);
global.App = jest.fn((options) => options);

// 测试辅助函数
global.testUtils = {
  mockEventData: {
    title: '测试活动',
    date: '2024-01-01',
    location: '测试地点',
    description: '测试描述',
    maxParticipants: 10,
    isPaid: false,
    price: 0
  },
  mockUserData: {
    openid: 'test-openid',
    nickName: '测试用户',
    avatarUrl: 'https://test.com/avatar.png'
  },
  mockDoveAvatar: {
    featherCount: 10,
    guguRate: 0
  }
};
