# Gugu Calendar 代码改进说明

> Last Updated: 2026-02-03
> Author: ClawBot

---

## 改进内容

### 1. createEvent - 付款模式数据结构完善

**改进点:**
- 统一使用 `mode` 字段区分模式 (`gugu` / `payment`)
- 付款模式添加完整字段:
  - `paymentAmount` - 每人应付金额
  - `totalPaid` - 已收款总额
  - `paymentStatus` - 付款状态对象
  - `paidParticipants` - 已付款参与者列表
  - `refundStatus` - 退款状态

**文件:** `cloudfunctions/createEvent/index.js`

### 2. quitEvent - 完整退出和退款逻辑

**改进点:**
- 支持两种模式 (gugu / payment)
- **咕咕模式:** 扣除点数 + 检查取消
- **付款模式:** 
  - 退款处理
  - 检查是否超过 50% 退出
  - 自动取消活动
  - 分配押金给未退出者

**新增功能:**
- `cancelled` - 是否取消活动
- `refundAllocated` - 押金分配信息
- `pointsDeducted` - 扣除点数

**文件:** `cloudfunctions/quitEvent/index.js`

### 3. utils - 统一工具函数

**新增文件:** `cloudfunctions/utils/index.js`

提供以下工具函数:
- `ensureCollectionExists(name)` - 确保集合存在
- `getOrCreateUser(openid, info)` - 获取或创建用户
- `getEvent(eventId)` - 获取活动信息
- `checkAndCancelEvent(eventId)` - 检查并取消活动
- `calculateRefundAllocation(event)` - 计算退款分配

---

## 数据结构

### events 表 (付款模式)

```json
{
  "_id": "event_id",
  "mode": "payment",
  "paymentAmount": 50,
  "totalPaid": 150,
  "paymentStatus": {
    "user_a": "creator",
    "user_b": "paid",
    "user_c": "refunded"
  },
  "paidParticipants": ["user_a", "user_b", "user_c"],
  "participants": ["user_a"],
  "quitUsers": ["user_b", "user_c"],
  "status": "pending" | "cancelled",
  "refundStatus": {
    "user_b": { "amount": 50, "time": "..." }
  }
}
```

### paymentStatus 状态说明

| 状态 | 含义 |
|------|------|
| `creator` | 创建者 (不需要付款) |
| `paid` | 已付款 |
| `refunded` | 已退款 |
| `refund_won:123` | 获得押金 123 元 |

---

## 退款逻辑

### 场景: 4 人参与，每人 50 元

| 步骤 | 操作 | totalPaid | 状态变化 |
|------|------|-----------|----------|
| 1 | A 创建活动 | 0 | A: creator |
| 2 | A、B、C、D 加入并付款 | 200 | A: creator, B/C/D: paid |
| 3 | A 退出 | 150 | A: refunded, totalPaid = 150 |
| 4 | B 退出 | 100 | B: refunded, totalPaid = 100 |
| 5 | C 退出 | 50 | C: refunded, totalPaid = 50 |
| 6 | D 退出 | 0 | D: refunded, totalPaid = 0 |

### 超过 50% 取消

| 退出人数 | 比例 | 结果 |
|----------|------|------|
| 1/4 | 25% | 继续，不取消 |
| 2/4 | 50% | 继续，不取消 |
| 3/4 | 75% | **取消**，押金不退，分配给 D |

---

## 测试用例

### 付款模式测试

```bash
# 1. 创建付款活动
{
  "mode": "payment",
  "paymentAmount": 50,
  "title": "测试付款活动",
  "startTime": <timestamp>,
  "endTime": <timestamp+1day>
}

# 2. 参与者加入
joinEvent(eventId)

# 3. 参与者付款
createPayment(eventId, points: 0, price: 50)

# 4. 模拟支付回调
paymentCallback(outTradeNo, resultCode: "SUCCESS")

# 5. 退出
quitEvent(eventId)
```

---

## 备份

代码已备份到: `~/projects/gugu-calendar-backup/`

如需回滚:
```bash
cp -r ~/projects/gugu-calendar-backup/* ~/projects/gugu-calendar/
```

---

*改进完成: 2026-02-03*
