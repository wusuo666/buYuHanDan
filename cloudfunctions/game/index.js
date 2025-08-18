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
    case 'getRandomIdiom':
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
    default:
      return {
        success: false,
        message: '未知的 action'
      };
  }
};