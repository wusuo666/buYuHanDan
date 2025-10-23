const cloud = require('wx-server-sdk');

cloud.init({
  env: "cloude1-5gnml1jq14e7f39f"
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const {
    action
  } = event;

  switch (action) {
    case 'getStoryIdiom':     //获取成语故事云函数，对应成语故事匹配游戏
      try {
        const randomResult = await db.collection('idioms').aggregate()
          .match({
            story: db.command.neq(null) // 确保story字段存在且不为null
          })
          .sample({
            size: 1
          })
          .project({
            story: 1,
            _id: 1, // 返回_id用于后续校验
            imgUrl: 1
          })
          .end();

        if (randomResult.list && randomResult.list.length > 0) {
          return {
            success: true,
            data: randomResult.list[0]
          };
        } else {
          return {
            success: false,
            message: '未能从数据库中获取成语故事'
          };
        }
      } catch (e) {
        console.error('getStoryIdiom error:', e);
        return {
          success: false,
          message: '查询数据库时发生错误'
        };
      }
    case 'checkIdiom': // 校验成语答案
      try {
        const {
          idiomId,
          userAnswer
        } = event;
        if (!idiomId || !userAnswer) {
          return {
            success: false,
            message: '缺少参数'
          };
        }

        const result = await db.collection('idioms').doc(idiomId).get();

        if (result.data) {
          const correct = result.data.idiom === userAnswer;
          return {
            success: true,
            correct: correct,
            answer: {
              idiom: result.data.idiom,
              pinyin: result.data.pinyin,
              explanation: result.data.explanation
            }
          };
        } else {
          return {
            success: false,
            message: '找不到对应的成语'
          };
        }
      } catch (e) {
        console.error('checkIdiom error:', e);
        return {
          success: false,
          message: '校验答案时发生错误'
        };
      }
    case 'getRandomIdiom':   //获取随机成语云函数，对应成语填空游戏
      try {
        // 优化：使用 projection 只返回必需的 idiom 字段和 _id
        const randomResult = await db.collection('idioms').aggregate()
          .sample({
            size: 1
          })
          .project({
            idiom: 1,
            imgUrl: 1,
            _id: 0 // 默认会返回_id，如果不需要可以显式设为0
          })
          .end();

        if (randomResult.list && randomResult.list.length > 0) {
          const idiomData = randomResult.list[0];
          const imageUrl = idiomData.imgUrl && idiomData.imgUrl.length > 0 ? idiomData.imgUrl[0].fileID : '';
          return {
            success: true,
            idiom: { ...idiomData, imageUrl: imageUrl }
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
        const gameData = await db.collection('idioms').aggregate()
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