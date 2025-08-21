// pages/game/index.js
const app = getApp();

Page({
  data: {
    // 统一关卡进度：从 users.level 获取
    totalLevels: 0,
    passedLevels: 0,
    
    // 用户信息
    userInfo: null,
    hasUserInfo: false,
    
    // 分享相关
    showShareModal: false
  },
  
  onLoad: function (options) {
    this.initUserInfo();
    this.loadUserProgress();
  },

  onShow() {
    this.loadUserProgress();
  },

  // 初始化用户信息
  async initUserInfo() {
    try {
      const setting = await wx.getSetting();
      if (setting.authSetting['scope.userInfo']) {
        const userInfo = await wx.getUserInfo();
        this.setData({
          userInfo: userInfo.userInfo,
          hasUserInfo: true
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  // 获取用户信息按钮回调
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于游戏进度记录和排行榜展示',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        // 更新到云端
        this.updateUserProgress(res.userInfo);
      },
      fail: () => {
        wx.showToast({
          title: '需要授权才能记录进度',
          icon: 'none'
        });
      }
    });
  },

  // 加载用户进度
  async loadUserProgress() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getUserStats'
        }
      });
      
      if (res.result.code === 0 && res.result.data) {
        const data = res.result.data;
        this.setData({
          totalLevels: data.totalSpots || 0,
          passedLevels: data.level || 0
        });
      }
    } catch (error) {
      console.error('加载用户进度失败:', error);
    }
  },

  // 更新用户进度到云端
  async updateUserProgress(userInfo) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'updateUserProgress',
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl
        }
      });
      
      if (res.result.code === 0) {
        wx.showToast({
          title: '信息更新成功',
          icon: 'success'
        });
        // 重新加载进度
        this.loadUserProgress();
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  },

  // 显示分享弹窗
  showShareModal() {
    this.setData({
      showShareModal: true
    });
  },

  // 关闭分享弹窗
  closeShareModal() {
    this.setData({
      showShareModal: false
    });
  },

  startLevelFillBlank() {
    wx.navigateTo({
      url: '/pages/gameFillBlank/index'
    });
  },

  startLevelPlaceMatch() {
    wx.navigateTo({
      url: '/pages/gamePlaceMatch/index'
    });
  },

  startLevelDialogFill() {
    wx.navigateTo({
      url: '/pages/gameDialogFill/index'
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const stats = this.data;
    
    return {
      title: `我在邯郸成语导览中已通过${stats.passedLevels}关，快来一起挑战吧！`,
      path: '/pages/game/index',
      imageUrl: '/images/share.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const stats = this.data;
    
    return {
      title: `邯郸成语文化导览 - 已通过${stats.passedLevels}关`,
      query: 'from=timeline'
    };
  }
}); 