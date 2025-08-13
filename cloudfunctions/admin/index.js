// 云函数入口文件 - admin
exports.main = async (event, context) => {
  const { action } = event || {};
  switch (action) {
    case 'importIdioms':
      // TODO: 批量导入或更新 idioms 文档
      return { code: 0, data: { imported: 0 } };
    default:
      return { code: 404, message: 'unknown action' };
  }
}; 