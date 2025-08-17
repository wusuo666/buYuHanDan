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

// 新增：批量拉取全部成语（自动分页），可传 field 选择器裁剪字段
async function fetchAllIdioms(fieldSelector) {
  const coll = getCollection('idioms');
  const countRes = await coll.count();
  const total = countRes && typeof countRes.total === 'number' ? countRes.total : 0;
  const pageSize = 20;
  let all = [];
  for (let skip = 0; skip < total; skip += pageSize) {
    let q = coll;
    if (fieldSelector) {
      q = q.field(fieldSelector);
    }
    const res = await q.skip(skip).limit(pageSize).get();
    if (res && Array.isArray(res.data)) {
      all = all.concat(res.data);
    }
  }
  return all;
}

module.exports = {
  fetchIdiomMarkers,
  fetchIdiomById,
  upsertIdiom,
  fetchAllIdioms,
}; 