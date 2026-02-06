Component({
  properties: {
    guguRate: {
      type: Number,
      value: 0,
      observer: 'updateDoveStatus'
    },
    showStatus: {
      type: Boolean,
      value: true
    }
  },

  data: {
    doveEmoji: '🕊️',
    doveClass: 'plump',
    statusText: '羽毛丰满 🪶',
    emojiConfig: {
      plump: { emoji: '🕊️', class: 'plump', text: '羽毛丰满 🪶' },
      molting: { emoji: '🪶', class: 'molting', text: '正在脱毛 🪹' },
      bald: { emoji: '🐦', class: 'bald', text: '咕王驾到 🏆' }
    }
  },

  lifetimes: {
    attached() {
      this.updateDoveStatus(this.properties.guguRate);
    }
  },

  methods: {
    updateDoveStatus(guguRate) {
      const { emojiConfig } = this.data;
      
      // 计算咕咕率（咕咕次数/参与活动总数）
      // guguRate 已经是百分比 (0-100)
      
      let config;
      if (guguRate < 5) {
        config = emojiConfig.plump; // 0-5%: 羽毛丰满
      } else if (guguRate < 10) {
        config = emojiConfig.molting; // 5-10%: 逐渐脱毛
      } else {
        config = emojiConfig.bald; // >=10%: 脱毛鸽子（咕王）
      }

      this.setData({
        doveEmoji: config.emoji,
        doveClass: config.class,
        statusText: config.text
      });
    },

    onTap() {
      this.triggerEvent('tap', {
        guguRate: this.properties.guguRate
      });
    }
  }
});
