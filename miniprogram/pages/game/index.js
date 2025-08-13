// pages/game/index.js
Page({
  data: {
    // 统一关卡进度：从 users.level 获取
    totalLevels: 0,
    passedLevels: 0,
  },
  onLoad() {
    // TODO: 从云获取当前用户通关进度（openid + level）
  },
  // 子玩法入口占位
  startLevelFillBlank() {
    // TODO: 跳转至 /pages/gameFillBlank/index
  },
  startLevelPlaceMatch() {
    // TODO: 跳转至 /pages/gamePlaceMatch/index
  },
  startLevelDialogFill() {
    // TODO: 跳转至 /pages/gameDialogFill/index
  }
}); 