// pages/gameFillBlank/index.js
Page({
  data: {
    idiomData: null, // 存储从云端获取的完整成语对象
    displayIdiom: [], // 用于显示的成语数组，包含空格
    hiddenIndex: -1, // 被隐藏文字的索引
    userInput: '', // 用户输入
    isCorrect: false, // 答案是否正确
    showResult: false, // 是否显示结果
    resultText: '' // 结果文本
  },

  onLoad: function () {
    this.getNextIdiom();
  },

  // 从云函数获取随机成语
  getRandomIdiomFromServer: function () {
    wx.showLoading({
      title: '正在出题...',
    });

    wx.cloud.callFunction({
      name: 'game',
      data: {
        action: 'getRandomIdiom'
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success && res.result.idiom) {
        const idiomData = res.result.idiom;
        const idiomName = idiomData.idiom; 
        if (!idiomName || typeof idiomName !== 'string') {
          wx.showToast({
            title: '获取到的成语格式不正确',
            icon: 'none'
          });
          return;
        }
        const hiddenIndex = Math.floor(Math.random() * idiomName.length);

        this.setData({
          idiomData: idiomData,
          hiddenIndex: hiddenIndex,
          userInput: '',
          showResult: false,
        });
        this.generateDisplayIdiom();
      } else {
        wx.showToast({
          title: res.result.message || '获取成语失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('调用云函数失败', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },

  // 生成用于显示的成语数组
  generateDisplayIdiom: function () {
    if (!this.data.idiomData || !this.data.idiomData.idiom) return;
    const idiomName = this.data.idiomData.idiom;
    const hiddenIndex = this.data.hiddenIndex;
    const displayIdiom = idiomName.split('').map((char, index) => ({
      char: index === hiddenIndex ? ' ' : char,
    }));
    this.setData({
      displayIdiom: displayIdiom
    });
  },

  // 处理用户输入
  onInput: function (e) {
    this.setData({
      userInput: e.detail.value
    });
  },

  // 检查答案
  checkAnswer: function () {
    const {
      userInput,
      idiomData,
      hiddenIndex
    } = this.data;
    if (!userInput.trim()) {
      wx.showToast({
        title: '请输入答案',
        icon: 'none'
      });
      return;
    }

    const correctAnswer = idiomData.idiom[hiddenIndex];
    const isCorrect = userInput === correctAnswer;
    this.setData({
      showResult: true,
      isCorrect: isCorrect,
      resultText: isCorrect ? '恭喜你，答对了！' : `很遗憾，答错了。正确答案是 "${correctAnswer}"`
    });
  },

  // 获取下一题
  getNextIdiom: function () {
    this.getRandomIdiomFromServer();
  }
});