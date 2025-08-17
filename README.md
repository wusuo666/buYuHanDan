# 步语邯郸

仅包含开发框架与占位，无任何具体业务数据。四位同学可分别在各自模块内独立开发，便于并行与合并。

## 模块划分
- 地图导览：`miniprogram/pages/map/` + 云函数 `cloudfunctions/map`
- 成语小游戏：`miniprogram/pages/game/` + 云函数 `cloudfunctions/game`
- 好友排行榜：`miniprogram/pages/rank/` + 云函数 `cloudfunctions/rank`
- 资料管理：`miniprogram/pages/admin/` + 云函数 `cloudfunctions/admin`
- 成语详情：`miniprogram/pages/idiomDetail/`（独立页面）
- 公共服务：`miniprogram/services/`、`miniprogram/utils/`

## 数据与集合建议
统一集合名由 `app.globalData.collections` 控制，默认：
- `idioms`：成语数据源（地图与游戏共用）
- `users`：用户数据（含 `level` 通关字段）

建议 `idioms` 字段示例（可按需调整）：
```
{
  "id": "",
  "idiom": "",
  "location": { "lat": 0, "lng": 0 },
  "story": "",
  "scenicSpot": "",
  "imgUrl": "",
  "storySegments": [],
  "relatedCharacters": []
}
```

## 路由与导航
- 底部导航：地图 / 游戏 / 排行榜 / 资料
- 地图页标记 -> 成语详情页

## 开发提示
- 仅用微信原生组件与云开发
- 云环境 ID 请在 `miniprogram/app.js` 的 `globalData.env` 填写
- 各模块调用云函数统一采用 `{ action: string, ... }` 路由风格

