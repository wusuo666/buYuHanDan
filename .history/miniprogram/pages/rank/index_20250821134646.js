// pages/rank/index.js
const app = getApp();

Page({
  data: {
    // 排行榜数据
    rankList: [],
    myRankInfo: null,
    
    // 切换标签
    currentTab: 'friend', // 'friend' 或 'global'
    
    // 加载状态
    loading: false,
    hasMore: true,
    
    // 分页
    page: 1,
    pageSize: 20,
    
    // 用户信息
    userInfo: null,
    hasUserInfo: false,
    
    // 分享海报相关
    showPoster: false,
    posterUrl: '',
    canvasWidth: 750,
    canvasHeight: 1334,
    
    // 邀请相关
    showInviteModal: false,
    inviteMessage: '一起解锁邯郸成语故事，体验成语文化的魅力！',
    
    // 用户统计
    userStats: null
  },

  onLoad() {
    this.initUserInfo();
    this.loadRankData();
    this.loadUserStats();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadRankData();
    this.loadUserStats();
  },

  // 初始化用户信息
  async initUserInfo() {
    try {
      // 获取用户信息
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

  // 获取用户统计信息
  async loadUserStats() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getUserStats'
        }
      });
      
      if (res.result.code === 0) {
        this.setData({
          userStats: res.result.data
        });
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  },

  // 获取用户信息按钮回调
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于排行榜展示头像昵称',
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
          title: '需要授权才能显示排行榜',
          icon: 'none'
        });
      }
    });
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
        // 重新加载排行榜
        this.loadRankData();
        this.loadUserStats();
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  },

  // 加载排行榜数据
  async loadRankData() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      if (this.data.currentTab === 'friend') {
        await this.loadFriendRanks();
      } else {
        await this.loadGlobalRanks();
      }
      
      // 获取我的排名
      await this.getMyRank();
    } catch (error) {
      console.error('加载排行榜失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载好友排行榜
  async loadFriendRanks() {
    try {
      // 获取微信好友数据
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getWxFriends'
        }
      });
      
      if (res.result.code === 0) {
        // 获取好友的进度数据
        const friendRes = await wx.cloud.callFunction({
          name: 'rank',
          data: {
            action: 'getFriendRanks',
            openidList: res.result.data.map(item => item._openid)
          }
        });
        
        if (friendRes.result.code === 0) {
          this.setData({
            rankList: friendRes.result.data || []
          });
        }
      }
    } catch (error) {
      console.error('加载好友排行榜失败:', error);
    }
  },

  // 加载全球排行榜
  async loadGlobalRanks() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getGlobalRanks',
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });
      
      if (res.result.code === 0) {
        const data = res.result.data;
        
        // 如果是第一页，直接设置；否则追加
        const rankList = this.data.page === 1 
          ? data.list 
          : [...this.data.rankList, ...data.list];
        
        this.setData({
          rankList,
          hasMore: rankList.length < data.total
        });
      }
    } catch (error) {
      console.error('加载全球排行榜失败:', error);
    }
  },

  // 获取我的排名
  async getMyRank() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getUserRank'
        }
      });
      
      if (res.result.code === 0) {
        this.setData({
          myRankInfo: res.result.data
        });
      }
    } catch (error) {
      console.error('获取我的排名失败:', error);
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    
    this.setData({
      currentTab: tab,
      rankList: [],
      page: 1,
      hasMore: true
    });
    
    this.loadRankData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      rankList: [],
      hasMore: true
    });
    
    this.loadRankData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多（仅全球排行榜）
  onReachBottom() {
    if (this.data.currentTab === 'global' && this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadRankData();
    }
  },

  // 显示邀请弹窗
  showInviteModal() {
    this.setData({
      showInviteModal: true
    });
  },

  // 关闭邀请弹窗
  closeInviteModal() {
    this.setData({
      showInviteModal: false
    });
  },

  // 发送邀请
  async sendInvitation() {
    try {
      // 这里可以记录邀请关系
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'recordInvitation',
          inviterOpenid: wx.getStorageSync('openid') || '',
          inviteeOpenid: '', // 实际项目中需要获取被邀请者的openid
          inviterNickname: this.data.userInfo?.nickName || '好友'
        }
      });
      
      if (res.result.code === 0) {
        wx.showToast({
          title: '邀请发送成功',
          icon: 'success'
        });
        this.closeInviteModal();
      }
    } catch (error) {
      console.error('发送邀请失败:', error);
      wx.showToast({
        title: '邀请发送失败',
        icon: 'none'
      });
    }
  },

  // 生成分享海报
  async generatePoster() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先授权用户信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '生成中...' });
    
    try {
      // 获取canvas上下文
      const query = wx.createSelectorQuery();
      query.select('#posterCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            wx.hideLoading();
            wx.showToast({ title: '生成失败', icon: 'none' });
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          // 设置canvas尺寸
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          
          // 绘制海报
          this.drawPoster(ctx, canvas);
        });
    } catch (error) {
      wx.hideLoading();
      console.error('生成海报失败:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    }
  },

  // 绘制海报内容
  async drawPoster(ctx, canvas) {
    try {
      const stats = this.data.userStats || {};
      const myInfo = this.data.myRankInfo || {};
      
      // 背景
      ctx.fillStyle = '#f0f4f7';
      ctx.fillRect(0, 0, 375, 667);
      
      // 标题背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, '#1AAD19');
      gradient.addColorStop(1, '#2ECC71');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 375, 200);
      
      // 标题
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('邯郸成语文化导览', 187, 50);
      
      // 副标题
      ctx.font = '16px sans-serif';
      ctx.fillText('我的成语学习进度', 187, 80);
      
      // 用户信息
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.data.userInfo?.nickName || '游客'}`, 187, 110);
      
      // 排名信息卡片
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillRect(30, 140, 315, 120);
      ctx.shadowBlur = 0;
      
      // 排名数据
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`排名: ${myInfo.rank || '--'}/${stats.totalUsers || '--'}`, 50, 180);
      ctx.fillText(`得分: ${stats.score || 0}分`, 50, 210);
      ctx.fillText(`关卡: ${stats.level || 0}关`, 200, 180);
      ctx.fillText(`解锁: ${(stats.unlockedSpots || []).length}/${stats.totalSpots || 0}个景点`, 200, 210);
      
      // 成就展示
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(30, 280, 315, 280);
      
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已解锁成语景点', 187, 310);
      
      // 展示部分解锁的景点
      const spots = stats.unlockedSpots || [];
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#666666';
      
      if (spots.length > 0) {
        spots.slice(0, 6).forEach((spot, index) => {
          ctx.fillText(`✓ ${spot.spotName || spot}`, 187, 340 + index * 25);
        });
      } else {
        ctx.fillText('暂无解锁景点', 187, 340);
        ctx.fillText('快来游戏中解锁吧！', 187, 365);
      }
      
      // 底部引导
      ctx.fillStyle = '#1AAD19';
      ctx.fillRect(30, 580, 315, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('长按识别小程序码', 187, 610);
      ctx.font = '14px sans-serif';
      ctx.fillText('一起解锁邯郸成语故事', 187, 630);
      
      // 生成图片
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          this.setData({
            posterUrl: res.tempFilePath,
            showPoster: true
          });
          wx.hideLoading();
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('Canvas转图片失败:', error);
          wx.showToast({
            title: '生成失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('绘制海报失败:', error);
    }
  },

  // 保存海报到相册
  savePoster() {
    if (!this.data.posterUrl) return;
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterUrl,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        this.closePoster();
      },
      fail: (error) => {
        if (error.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 关闭海报
  closePoster() {
    this.setData({
      showPoster: false,
      posterUrl: ''
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const stats = this.data.userStats || {};
    const myInfo = this.data.myRankInfo || {};
    
    return {
      title: `我在邯郸成语导览中排名第${myInfo.rank || '--'}，已解锁${(stats.unlockedSpots || []).length}个景点！`,
      path: '/pages/game/index',
      imageUrl: '/images/share.png', // 需要添加分享图片
      success: () => {
        // 记录分享行为
        this.recordShare();
      }
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const stats = this.data.userStats || {};
    
    return {
      title: `邯郸成语文化导览 - 已解锁${(stats.unlockedSpots || []).length}个景点`,
      query: 'from=timeline',
      success: () => {
        // 记录分享行为
        this.recordShare();
      }
    };
  },

  // 记录分享行为
  async recordShare() {
    try {
      // 这里可以记录用户的分享行为，用于数据分析
      console.log('用户分享了排行榜');
    } catch (error) {
      console.error('记录分享失败:', error);
    }
  }
});