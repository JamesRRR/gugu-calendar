# 咕咕日历 V2 - E2E 测试

> 咕咕日历 V2 微信小程序自动化测试（鸽子头像 + 公式墙）

## 测试概述

本测试使用 `miniprogram-automator` 和 `Jest` 进行 E2E 自动化测试，覆盖 V2 新功能：鸽子头像系统和公式墙（排行榜）。

## 前置要求

### 1. 微信开发者工具配置

**重要:** 在运行测试前，必须开启微信开发者工具的服务端口：

1. 打开微信开发者工具
2. 点击 **设置** → **安全设置**
3. 开启 **服务端口**
4. 确保开发者工具处于登录状态

### 2. 安装依赖

```bash
cd tests
npm install
```

## 运行测试

### 一键运行所有测试

```bash
npm run test:e2e
```

### 运行单个页面测试

```bash
# 排行榜页测试
npm run test:leaderboard

# 用户页测试
npm run test:profile
```

## 测试覆盖

### 排行榜页 (pages/leaderboard)
- [x] 页面加载成功
- [x] 显示"今日咕王"
- [x] 排行榜列表正确排序
- [x] 咕咕率计算展示
- [x] 鸽子头像组件展示

### 用户页 (pages/profile)
- [x] 显示鸽子头像
- [x] 咕咕率计算正确
- [x] 鸽子状态与咕咕率匹配
- [x] 统计数据展示
- [x] 功能菜单跳转

## V2 新功能测试

### 鸽子头像系统
- 🕊️ 初始状态：羽毛丰满的鸽子
- 🪶 随着咕咕率增加，鸽子逐渐脱毛
- 🐦 + 👑 当咕咕率达到 10%，变成"咕王"

### 公式墙（排行榜）
- 👑 今日咕王展示
- 📊 按咕咕率排序
- 🎯 咕咕率计算公式展示

## 测试结构

```
tests/
├── e2e/
│   ├── leaderboard.spec.js   # 排行榜页测试
│   ├── profile.spec.js        # 用户页测试
│   └── utils/
│       ├── constants.js       # 测试常量
│       └── init.js            # 测试工具函数
├── jest.config.js            # Jest 配置
├── setup.js                  # 测试初始化
└── package.json              # 依赖和脚本
```

## 测试工具函数

| 函数 | 描述 |
|------|------|
| `launchApp()` | 启动小程序 |
| `navigateTo(pagePath)` | 跳转到页面 |
| `tap(element)` | 点击元素 |
| `input(text)` | 输入文本 |
| `expectText(text)` | 断言文本存在 |
| `expectUrl(url)` | 断言当前页面 |

## 故障排除

### 问题: 端口未开启
**错误信息:** `Error: MiniProgram CLI not found or port not open`

**解决方案:**
1. 确保微信开发者工具已开启服务端口
2. 重启微信开发者工具

### 问题: 测试超时
**错误信息:** `TimeoutError: Timed out after 30000ms`

**解决方案:**
1. 检查网络连接
2. 确保微信开发者工具已登录
3. 尝试增加超时时间

## 相关链接

- [miniprogram-automator](https://www.npmjs.com/package/miniprogram-automator)
- [Jest](https://jestjs.io/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## 更新日志

### v1.0.0 (2026-02-07)
- 初始 E2E 测试配置
- 覆盖排行榜页和用户页
- 支持 V2 鸽子头像和公式墙功能
