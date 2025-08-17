// miniprogram/services/routes.js
const { getCollection } = require('../utils/db');

// 结构建议：
// {
//   name: string,
//   description?: string,
//   coverImgUrl?: string,
//   waypoints: [{ lat: number, lng: number, title?: string, idiomId?: string }],
//   distance?: number, // 预计算或运行时计算
//   difficulty?: 'easy'|'normal'|'hard',
//   tags?: string[]
// }

function coll() { return getCollection('routes'); }

async function createRoute(data) { return await coll().add({ data }); }
async function getRouteById(id) { const r = await coll().doc(id).get(); return r.data || null; }
async function updateRoute(id, data) { return await coll().doc(id).update({ data }); }
async function deleteRoute(id) { return await coll().doc(id).remove(); }

async function listRoutes({ skip = 0, limit = 20, field } = {}) {
  let q = coll();
  if (field) q = q.field(field);
  const r = await q.skip(skip).limit(limit).get();
  return r.data || [];
}

async function listAllRoutes(field) {
  const c = await coll().count();
  const total = c?.total || 0;
  const pageSize = 20;
  let all = [];
  for (let s = 0; s < total; s += pageSize) {
    let q = coll();
    if (field) q = q.field(field);
    const r = await q.skip(s).limit(pageSize).get();
    if (Array.isArray(r.data)) all = all.concat(r.data);
  }
  return all;
}

// 附近路线（占位：需要在 routes 中引入地理索引后基于云函数或范围筛选实现）
async function listNearbyRoutes(_center, _radiusMeters) {
  // TODO: 若使用地理类型，可转到云函数使用 Geo API；目前先返回全部并由前端筛选
  return await listAllRoutes({ name: true, waypoints: true, coverImgUrl: true });
}

module.exports = {
  createRoute,
  getRouteById,
  updateRoute,
  deleteRoute,
  listRoutes,
  listAllRoutes,
  listNearbyRoutes,
}; 