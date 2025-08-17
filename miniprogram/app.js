// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // 云环境占位：开发者在此填写自己的环境 ID
      env: "cloud1-8gjfo0b251334d85", // e.g. "your-env-id"
      // 统一集合名称，地图/游戏共用
      collections: {
        idioms: "idiom",
        routes: "routes", // 导览路线集合
        progress: "progress" // 用户进度/得分集合
      }
    };
    if (!wx.cloud) {
      console.error("请使用基础库 2.2.3 或以上版本以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env || undefined,
        traceUser: true,
      });
    }
  },
});
