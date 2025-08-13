// miniprogram/utils/db.js
// 统一封装云数据库调用，便于模块复用
const app = getApp();

function getDb() {
  return wx.cloud.database();
}

function getCollection(collectionKey) {
  const name = app?.globalData?.collections?.[collectionKey] || collectionKey;
  return getDb().collection(name);
}

module.exports = {
  getDb,
  getCollection,
}; 