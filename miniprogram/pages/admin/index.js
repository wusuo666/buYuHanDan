// pages/admin/index.js
const idiomsService = require('../../services/idioms');
const routesService = require('../../services/routes');
const progressService = require('../../services/progress');

Page({
  data: {
    pendingImages: [],
    idioms: [],
    loading: false,
    debugMsg: '',
    openid: '',
    topList: [],
  },
  onLoad() {
    this.loadAllIdioms();
  },
  onPullDownRefresh() {
    this.loadAllIdioms().finally(() => wx.stopPullDownRefresh());
  },
  async loadAllIdioms() {
    try {
      this.setData({ loading: true });
      const field = { idiom: true, scenicSpot: true, location: true, imgUrl: true, coverImgUrl: true };
      const list = await idiomsService.fetchAllIdioms(field);
      this.setData({ idioms: list });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      console.error('loadAllIdioms error', e);
    } finally {
      this.setData({ loading: false });
    }
  },
  async whoami() {
    try {
      const res = await wx.cloud.callFunction({ name: 'admin', data: { action: 'whoami' } });
      const data = res?.result?.data || {};
      this.setData({ openid: data.openid || '', debugMsg: 'openid: ' + (data.openid || '') });
    } catch (e) {
      this.setData({ debugMsg: 'whoami失败' });
    }
  },
  async createDemoRoute() {
    try {
      const r = await routesService.createRoute({
        name: '邯郸城区经典线',
        description: '示例路线：丛台—学步桥—赵苑',
        waypoints: [
          { lat: 36.616, lng: 114.489, title: '丛台' },
          { lat: 36.613, lng: 114.504, title: '学步桥' },
          { lat: 36.602, lng: 114.506, title: '赵苑' }
        ]
      });
      this.setData({ debugMsg: '创建路线 _id: ' + (r?._id || '') });
    } catch (e) {
      this.setData({ debugMsg: '创建路线失败' });
    }
  },
  async listRoutes() {
    try {
      const list = await routesService.listRoutes({ limit: 10, field: { name: true, waypoints: true } });
      this.setData({ debugMsg: '路线数量: ' + list.length });
    } catch (e) {
      this.setData({ debugMsg: '查询路线失败' });
    }
  },
  async ensureProfile() {
    try {
      if (!this.data.openid) {
        const res = await wx.cloud.callFunction({ name: 'admin', data: { action: 'whoami' } });
        this.setData({ openid: res?.result?.data?.openid || '' });
      }
      wx.getUserProfile({
        desc: '用于排行榜展示头像昵称',
        success: async ({ userInfo }) => {
          const { nickName, avatarUrl } = userInfo;
          await require('../../services/progress').upsertProgress(this.data.openid, {
            nickname: nickName,
            avatar: avatarUrl
          });
          wx.showToast({ title: '已更新资料' });
        },
        fail: () => wx.showToast({ title: '未授权用户信息', icon: 'none' })
      });
    } catch (e) {
      wx.showToast({ title: '创建档案失败', icon: 'none' });
    }
  },
  async addMyScore() {
    if (!this.data.openid) {
      const res = await wx.cloud.callFunction({ name: 'admin', data: { action: 'whoami' } });
      this.setData({ openid: res?.result?.data?.openid || '' });
    }
    await require('../../services/progress').addScore(this.data.openid, 10);
    wx.showToast({ title: '已加分 +10' });
  },
  async showTop() {
    try {
      const list = await progressService.listTop({ limit: 10 });
      this.setData({ topList: list, debugMsg: 'Top分数数量: ' + list.length });
    } catch (e) {
      this.setData({ debugMsg: '排行榜失败' });
    }
  },
}); 