// miniprogram/services/progress.js
const { getCollection } = require('../utils/db');

// 建议结构：
// { _openid: string, level: number, score: number, lastPassedAt?: number, idiomId?: string, nickname?: string, avatar?: string }

function coll() { return getCollection('progress'); }

async function getMyProgress(openid) {
  const r = await coll().where({ _openid: openid }).limit(1).get();
  return r.data && r.data[0] ? r.data[0] : null;
}

async function upsertProgress(openid, patch) {
  const existed = await getMyProgress(openid);
  if (existed) {
    await coll().doc(existed._id).update({ data: Object.assign({}, patch, { updatedAt: Date.now() }) });
    return { updated: 1, _id: existed._id };
  } else {
    // 注意：客户端不要手动写 _openid，系统会自动填充
    const addRes = await coll().add({ data: Object.assign({}, patch, { createdAt: Date.now() }) });
    return { inserted: 1, _id: addRes._id };
  }
}

async function addScore(openid, delta) {
  const p = await getMyProgress(openid);
  const current = p?.score || 0;
  const next = current + Number(delta || 0);
  return await upsertProgress(openid, { score: next, lastPassedAt: Date.now() });
}

async function setLevel(openid, level) {
  return await upsertProgress(openid, { level: Number(level || 0), lastPassedAt: Date.now() });
}

async function listTop({ limit = 50 } = {}) {
  const r = await coll().orderBy('score', 'desc').limit(limit).get();
  return r.data || [];
}

async function listTopByLevel({ limit = 50 } = {}) {
  const r = await coll().orderBy('level', 'desc').limit(limit).get();
  return r.data || [];
}

module.exports = {
  getMyProgress,
  upsertProgress,
  addScore,
  setLevel,
  listTop,
  listTopByLevel,
}; 