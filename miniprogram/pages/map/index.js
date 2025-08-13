// pages/map/index.js
Page({
  data: {
    // 地图中心与缩放级别占位
    center: { latitude: 36.62556, longitude: 114.53896 },
    scale: 12,
    // 地图标记占位：从云数据库 idioms 拉取
    markers: [],
  },

  onLoad() {
    // TODO: 拉取 idioms 集合坐标，初始化 markers
    // 建议：封装到独立 service `services/idioms.js` 中，便于复用
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    // TODO: 根据 markerId 查询 idiom 详情，展示信息卡或跳转详情页
    // wx.navigateTo({ url: `/pages/idiomDetail/index?id=${markerId}` })
  },
}); 