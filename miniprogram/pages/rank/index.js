// pages/rank/index.js
Page({
  data: {
    rankList: [],
  },
  onLoad() {
    // TODO: 调用云函数 rank/getFriendRanks 拉取好友排行
  },
  onShareAppMessage() {
    // TODO: 返回分享卡片内容
    return {
      title: "一起解锁邯郸成语故事",
      path: "/pages/game/index"
    }
  }
}); 