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
    canvasHeight: 1334
  },

  onLoad() {
    this.initUserInfo();
    this.loadRankData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadRankData();
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
      // 这里可以通过微信关系链获取好友openid列表
      // 目前先使用模拟数据或不传参数
      const res = await wx.cloud.callFunction({
        name: 'rank',
        data: {
          action: 'getFriendRanks',
          openidList: [] // 暂时传空，只显示自己
        }
      });
      
      if (res.result.code === 0) {
        this.setData({
          rankList: res.result.data || []
        });
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
      const myInfo = this.data.myRankInfo || {};
      
      // 排名信息卡片
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillRect(30, 120, 315, 120);
      ctx.shadowBlur = 0;
      
      // 排名数据
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`排名: ${myInfo.rank || '--'}/${myInfo.total || '--'}`, 50, 160);
      ctx.fillText(`得分: ${myInfo.score || 0}分`, 50, 190);
      ctx.fillText(`关卡: ${myInfo.level || 0}关`, 200, 160);
      ctx.fillText(`解锁: ${(myInfo.unlockedSpots || []).length}个景点`, 200, 190);
      
      // 成语进度统计
      ctx.fillStyle = '#1AAD19';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`成语掌握: ${myInfo.idioms || 0}个`, 50, 220);
      ctx.fillText(`正确率: ${myInfo.accuracy || 0}%`, 200, 220);
      
      // 景点地图展示区域
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(30, 260, 315, 200);
      
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已解锁景点地图', 187, 290);
      
      // 绘制景点地图网格
      this.drawSpotsMap(ctx, myInfo.unlockedSpots || []);
      
      // 底部引导
      ctx.fillStyle = '#1AAD19';
      ctx.fillRect(30, 480, 315, 80);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('长按识别小程序码', 187, 510);
      ctx.font = '14px sans-serif';
      ctx.fillText('一起解锁邯郸成语故事', 187, 535);
      
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

  // 绘制景点地图网格
  drawSpotsMap(ctx, unlockedSpots) {
    // 景点数据（模拟邯郸主要景点）
    const allSpots = [
      { name: '丛台', x: 50, y: 320, unlocked: false },
      { name: '学步桥', x: 150, y: 320, unlocked: false },
      { name: '赵苑', x: 250, y: 320, unlocked: false },
      { name: '回车巷', x: 100, y: 380, unlocked: false },
      { name: '黄粱梦', x: 200, y: 380, unlocked: false },
      { name: '响堂山', x: 300, y: 380, unlocked: false },
      { name: '广府城', x: 75, y: 440, unlocked: false },
      { name: '娲皇宫', x: 175, y: 440, unlocked: false },
      { name: '古武安', x: 275, y: 440, unlocked: false }
    ];

    // 标记已解锁的景点
    unlockedSpots.forEach(spotName => {
      const spot = allSpots.find(s => s.name === spotName);
      if (spot) {
        spot.unlocked = true;
      }
    });

    // 绘制景点网格
    allSpots.forEach(spot => {
      // 景点圆圈
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 15, 0, 2 * Math.PI);
      
      if (spot.unlocked) {
        // 已解锁：绿色填充
        ctx.fillStyle = '#1AAD19';
        ctx.fill();
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 解锁标记
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', spot.x, spot.y + 4);
      } else {
        // 未解锁：灰色边框
        ctx.fillStyle = '#F0F0F0';
        ctx.fill();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 锁定标记
        ctx.fillStyle = '#999999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', spot.x, spot.y + 4);
      }
      
      // 景点名称
      ctx.fillStyle = spot.unlocked ? '#1AAD19' : '#999999';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(spot.name, spot.x, spot.y + 35);
    });

    // 绘制连接线（模拟地图路径）
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // 水平连接线
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(65 + i * 100, 320);
      ctx.lineTo(135 + i * 100, 320);
      ctx.stroke();
    }
    
    // 垂直连接线
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(150, 335 + i * 60);
      ctx.lineTo(150, 395 + i * 60);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
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
    const myInfo = this.data.myRankInfo || {};
    
    return {
      title: `我在邯郸成语导览中排名第${myInfo.rank || '--'}，已解锁${(myInfo.unlockedSpots || []).length}个景点！`,
      path: '/pages/game/index',
      imageUrl: '/images/share.png' // 需要添加分享图片
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const myInfo = this.data.myRankInfo || {};
    
    return {
      title: `邯郸成语文化导览 - 已解锁${(myInfo.unlockedSpots || []).length}个景点`,
      query: 'from=timeline'
    };
  }
});