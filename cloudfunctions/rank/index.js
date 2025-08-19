// 云函数入口文件 - rank
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event || {};
  
  switch (action) {
    case 'getFriendRanks':
      return await getFriendRanks(event, wxContext);
    case 'getGlobalRanks':
      return await getGlobalRanks(event);
    case 'updateUserProgress':
      return await updateUserProgress(event, wxContext);
    case 'getUserRank':
      return await getUserRank(wxContext);
    default:
      return { code: 404, message: 'unknown action' };
  }
};

// 获取好友排行榜
async function getFriendRanks(event, wxContext) {
  try {
    const { openidList = [] } = event;
    const currentOpenid = wxContext.OPENID;
    
    // 如果没有传入openid列表，只返回当前用户数据
    let queryOpenids = openidList.length > 0 ? openidList : [currentOpenid];
    
    // 查询好友的进度数据
    const res = await db.collection('progress')
      .where({
        _openid: db.command.in(queryOpenids)
      })
      .orderBy('score', 'desc')
      .orderBy('level', 'desc')
      .limit(100)
      .get();
    
    // 添加排名信息
    const rankedData = res.data.map((item, index) => ({
      ...item,
      rank: index + 1,
      isMe: item._openid === currentOpenid
    }));
    
    return {
      code: 0,
      data: rankedData,
      message: 'success'
    };
  } catch (error) {
    console.error('getFriendRanks error:', error);
    return {
      code: -1,
      message: error.message || '获取好友排行榜失败',
      data: []
    };
  }
}

// 获取全球排行榜
async function getGlobalRanks(event) {
  try {
    const { page = 1, pageSize = 20 } = event;
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const countResult = await db.collection('progress').count();
    const total = countResult.total;
    
    // 获取排行榜数据
    const res = await db.collection('progress')
      .orderBy('score', 'desc')
      .orderBy('level', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    // 添加排名信息
    const rankedData = res.data.map((item, index) => ({
      ...item,
      rank: skip + index + 1
    }));
    
    return {
      code: 0,
      data: {
        list: rankedData,
        total,
        page,
        pageSize
      },
      message: 'success'
    };
  } catch (error) {
    console.error('getGlobalRanks error:', error);
    return {
      code: -1,
      message: error.message || '获取全球排行榜失败',
      data: { list: [], total: 0 }
    };
  }
}

// 更新用户进度
async function updateUserProgress(event, wxContext) {
  try {
    const openid = wxContext.OPENID;
    const { nickname, avatar, level, score, unlockedSpots = [] } = event;
    
    // 查询用户是否存在
    const userRes = await db.collection('progress')
      .where({ _openid: openid })
      .get();
    
    const updateData = {
      nickname: nickname || '',
      avatar: avatar || '',
      level: level || 0,
      score: score || 0,
      unlockedSpots: unlockedSpots,
      lastUpdateTime: db.serverDate()
    };
    
    let result;
    if (userRes.data.length > 0) {
      // 更新现有记录
      const docId = userRes.data[0]._id;
      result = await db.collection('progress')
        .doc(docId)
        .update({
          data: updateData
        });
    } else {
      // 创建新记录
      result = await db.collection('progress')
        .add({
          data: {
            _openid: openid,
            ...updateData,
            createTime: db.serverDate()
          }
        });
    }
    
    return {
      code: 0,
      data: result,
      message: 'success'
    };
  } catch (error) {
    console.error('updateUserProgress error:', error);
    return {
      code: -1,
      message: error.message || '更新用户进度失败'
    };
  }
}

// 获取用户排名
async function getUserRank(wxContext) {
  try {
    const openid = wxContext.OPENID;
    
    // 获取用户数据
    const userRes = await db.collection('progress')
      .where({ _openid: openid })
      .get();
    
    if (userRes.data.length === 0) {
      return {
        code: 0,
        data: null,
        message: '用户数据不存在'
      };
    }
    
    const userData = userRes.data[0];
    
    // 计算排名
    const higherScoreCount = await db.collection('progress')
      .where({
        score: db.command.gt(userData.score)
      })
      .count();
    
    const rank = higherScoreCount.total + 1;
    
    // 获取总人数
    const totalCount = await db.collection('progress').count();
    
    return {
      code: 0,
      data: {
        ...userData,
        rank,
        total: totalCount.total
      },
      message: 'success'
    };
  } catch (error) {
    console.error('getUserRank error:', error);
    return {
      code: -1,
      message: error.message || '获取用户排名失败',
      data: null
    };
  }
}