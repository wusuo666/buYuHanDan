// 云函数入口文件 - admin
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event || {};
  switch (action) {
    case 'importIdioms':
      return await importIdioms(event.items || []);
    case 'whoami':
      return whoami();
    default:
      return { code: 404, message: 'unknown action' };
  }
};

function whoami() {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();
  return { code: 0, data: { openid: OPENID, appid: APPID, unionid: UNIONID || null } };
}

async function importIdioms(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { code: 400, message: 'items empty' };
  }
  let inserted = 0;
  let updated = 0;
  const errors = [];

  for (const raw of items) {
    const item = sanitizeIdiom(raw);
    try {
      if (item._id) {
        const res = await db.collection('idioms').doc(item._id).set({ data: item });
        // set 会覆盖文档
        if (res && res._id) {
          updated += 1;
        } else {
          updated += 1;
        }
        continue;
      }
      if (item.idiom) {
        const existed = await db.collection('idioms').where({ idiom: item.idiom }).get();
        if (existed.data && existed.data.length > 0) {
          const docId = existed.data[0]._id;
          await db.collection('idioms').doc(docId).update({ data: item });
          updated += 1;
        } else {
          await db.collection('idioms').add({ data: item });
          inserted += 1;
        }
      } else {
        const res = await db.collection('idioms').add({ data: item });
        if (res && res._id) inserted += 1; else inserted += 1;
      }
    } catch (e) {
      errors.push({ idiom: item.idiom || '', error: e && e.message ? e.message : String(e) });
    }
  }

  return { code: 0, data: { inserted, updated, errors } };
}

function sanitizeIdiom(input) {
  const item = Object.assign({}, input);
  if (item.location) {
    item.location = {
      lat: Number(item.location.lat) || 0,
      lng: Number(item.location.lng) || 0,
    };
  }
  if (!Array.isArray(item.storySegments)) item.storySegments = [];
  if (!Array.isArray(item.relatedCharacters)) item.relatedCharacters = [];
  return item;
} 