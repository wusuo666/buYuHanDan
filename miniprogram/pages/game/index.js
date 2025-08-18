// pages/game/index.js
Page({
  data: {
    // 统一关卡进度：从 users.level 获取
    totalLevels: 0,
    passedLevels: 0,
  },
  onLoad: function (options) {
    // You can fetch user's progress here if needed
  },

  startLevelFillBlank() {
    wx.navigateTo({
      url: '/pages/gameFillBlank/index'
    });
  },

  startLevelPlaceMatch() {
    wx.navigateTo({
      url: '/pages/gamePlaceMatch/index'
    });
  },

  startLevelDialogFill() {
    wx.navigateTo({
      url: '/pages/gameDialogFill/index'
    });
  }
}); 