// 云函数入口文件 - game
exports.main = async (event, context) => {
  const { action } = event || {};
  switch (action) {
    case 'nextLevel':
      // TODO: 下发题目（从 idioms 集合抽题）
      return { code: 0, data: {} };
    case 'submitLevel':
      // TODO: 校验答案并更新 users.level
      return { code: 0, data: { correct: true } };
    default:
      return { code: 404, message: 'unknown action' };
  }
}; 