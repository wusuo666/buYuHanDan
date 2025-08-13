# Cloud Functions (Skeleton)

模块划分与建议：

- map/ 地图相关云函数
  - getMarkers: 返回 idioms 坐标与简要信息
- game/ 小游戏相关云函数
  - nextLevel: 下发题目
  - submitLevel: 校验并累计通关数
- rank/ 排行榜相关云函数
  - getFriendRanks: 根据 openid 列表聚合排序
- admin/ 资料管理相关云函数
  - importIdioms: 批量导入/更新成语数据

注意：仅保留目录与文件占位，函数体按需实现。 