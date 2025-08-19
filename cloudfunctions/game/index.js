const cloud = require('wx-server-sdk');

cloud.init({
  env: "cloud1-8gjfo0b251334d85"
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const {
    action
  } = event;

  switch (action) {
    case 'getRandomIdiom':   //获取随机成语云函数，对应成语填空游戏
      try {
        // 优化：使用 projection 只返回必需的 idiom 字段和 _id
        const randomResult = await db.collection('idiom').aggregate()
          .sample({
            size: 1
          })
          .project({
            idiom: 1,
            _id: 0 // 默认会返回_id，如果不需要可以显式设为0
          })
          .end();

        if (randomResult.list && randomResult.list.length > 0) {
          return {
            success: true,
            idiom: randomResult.list[0]
          };
        } else {
          return {
            success: false,
            message: '未能从数据库中获取成语'
          };
        }
      } catch (e) {
        console.error('getRandomIdiom error:', e);
        return {
          success: false,
          message: '查询数据库时发生错误'
        };
      }
    case 'getGameData':   //成语地点匹配游戏云函数
      try {
        const count = event.count || 2; // 默认获取2个，可根据需要传入event.count来获取更多
        const gameData = await db.collection('idiom').aggregate()
          .sample({
            size: count
          })
          .project({
            idiom: 1,
            scenicSpot: 1,
            'location.address': 1,
            _id: 0
          })
          .end();

        if (gameData.list && gameData.list.length > 0) {
          return {
            success: true,
            data: gameData.list
          };
        } else {
          return {
            success: false,
            message: '未能获取游戏数据'
          };
        }
      } catch (e) {
        console.error('getGameData error:', e);
        return {
          success: false,
          message: '查询游戏数据时发生错误'
        };
      }
    default:
      return {
        success: false,
        message: '未知的 action'
      };
  }
};