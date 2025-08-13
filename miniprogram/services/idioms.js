// miniprogram/services/idioms.js
const { getCollection } = require('../utils/db');

async function fetchIdiomMarkers() {
  // TODO: 只取必要字段：_id, idiom, location, scenicSpot, imgUrl
  // return await getCollection('idioms').field({...}).get()
  return { data: [] };
}

async function fetchIdiomById(id) {
  // TODO: 根据 _id 查询单条成语详情
  return null;
}

async function upsertIdiom(data) {
  // TODO: 新增或更新成语文档
  return null;
}

module.exports = {
  fetchIdiomMarkers,
  fetchIdiomById,
  upsertIdiom,
}; 