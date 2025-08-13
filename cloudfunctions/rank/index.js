// 云函数入口文件 - rank
exports.main = async (event, context) => {
  const { action } = event || {};
  switch (action) {
    case 'getFriendRanks':
      // TODO: 根据传入 openid 列表查询 users.level 并排序
      return { code: 0, data: [] };
    default:
      return { code: 404, message: 'unknown action' };
  }
}; 