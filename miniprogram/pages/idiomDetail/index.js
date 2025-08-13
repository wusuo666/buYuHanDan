// pages/idiomDetail/index.js
Page({
  data: {
    idiomId: "",
    idiom: null,
  },
  onLoad(query) {
    // TODO: 根据 query.id 拉取 idioms 集合详情
    // this.setData({ idiomId: query.id })
  },
  openInMap() {
    // TODO: 打开地图定位到 idiom.location
  },
  startRelatedLevel() {
    // TODO: 根据 idiom.storySegments/relatedCharacters 进入相关关卡
  }
}); 