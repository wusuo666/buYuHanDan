// 云函数入口文件 - map
exports.main = async (event, context) => {
  const { action } = event || {};
  switch (action) {
    case 'getMarkers':
      // TODO: 查询 idioms 集合，返回 markers 所需字段
      return { code: 0, data: [] };
    default:
      return { code: 404, message: 'unknown action' };
  }
}; 