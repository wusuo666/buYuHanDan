// pages/gamePlaceMatch/index.js
Page({
  data: {
    idioms: [],
    locations: [],
    selectedIdiom: null,
    selectedLocation: null,
    matchedPairs: [],
    score: 0
  },
  onLoad() {
    this.getGameData();
  },

  async getGameData() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'game',
        data: {
          action: 'getGameData',
          count: 4 
        },
      });

      if (res.result.success) {
        const gameData = res.result.data;
        const idioms = gameData.map(item => ({ idiom: item.idiom, id: item.idiom, matched: false }));
        const locations = gameData.map(item => ({
          location: item.scenicSpot || (item.location && item.location.address),
          id: item.idiom, // 使用成语作为匹配ID
          matched: false
        }));

        // 随机打乱地点顺序
        locations.sort(() => Math.random() - 0.5);

        this.setData({
          idioms: idioms,
          locations: locations
        });
      } else {
        wx.showToast({
          title: res.result.message || '获取游戏数据失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('调用云函数失败', err);
      wx.showToast({
        title: '获取游戏数据失败',
        icon: 'none'
      });
    }
  },

  selectIdiom(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedIdiom, matchedPairs } = this.data;

    if (matchedPairs.some(pair => pair.idiomId === id || pair.locationId === id)) {
      return; // 已经匹配过的成语不能再次选择
    }

    if (selectedIdiom === id) {
      this.setData({ selectedIdiom: null }); // 取消选择
    } else {
      this.setData({ selectedIdiom: id });
      this.checkMatch();
    }
  },

  selectLocation(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedLocation, matchedPairs } = this.data;

    if (matchedPairs.some(pair => pair.idiomId === id || pair.locationId === id)) {
      return; // 已经匹配过的地点不能再次选择
    }

    if (selectedLocation === id) {
      this.setData({ selectedLocation: null }); // 取消选择
    } else {
      this.setData({ selectedLocation: id });
      this.checkMatch();
    }
  },

  checkMatch() {
    const { selectedIdiom, selectedLocation, matchedPairs, idioms, locations } = this.data;

    if (selectedIdiom && selectedLocation) {
      if (selectedIdiom === selectedLocation) {
        // 匹配成功
        const newMatchedPairs = [...matchedPairs, { idiomId: selectedIdiom, locationId: selectedLocation }];
        const newIdioms = idioms.map(item => item.id === selectedIdiom ? { ...item, matched: true } : item);
        const newLocations = locations.map(item => item.id === selectedLocation ? { ...item, matched: true } : item);

        this.setData({
          matchedPairs: newMatchedPairs,
          idioms: newIdioms,
          locations: newLocations,
          selectedIdiom: null,
          selectedLocation: null,
          score: this.data.score + 1
        });

        wx.showToast({
          title: '匹配成功！',
          icon: 'success',
          duration: 1000
        });

        if (newMatchedPairs.length === idioms.length) {
          wx.showModal({
            title: '恭喜！',
            content: '所有成语和地点都匹配成功了！',
            showCancel: false,
            confirmText: '再玩一次',
            success: (res) => {
              if (res.confirm) {
                this.resetGame();
              }
            }
          });
        }

      } else {
        // 匹配失败
        this.setData({
          selectedIdiom: null,
          selectedLocation: null
        });
        wx.showToast({
          title: '匹配失败，请重试',
          icon: 'none',
          duration: 1000
        });
      }
    }
  },

  resetGame() {
    this.setData({
      idioms: [],
      locations: [],
      selectedIdiom: null,
      selectedLocation: null,
      matchedPairs: [],
      score: 0
    });
    this.getGameData();
  },

  submitAnswer() {
    // TODO: 校验并上报
    // 在这个游戏中，匹配成功即为得分，所以可以根据score进行上报
    wx.showToast({
      title: `最终得分：${this.data.score}`,
      icon: 'none'
    });
  }
});