Page({
  data: {
    story: '',
    idiomId: '',
    inputValue: '',
    showModal: false,
    isCorrect: false,
    modalTitle: '',
    answer: {}
  },

  onLoad: function () {
    this.getStoryIdiom();
  },

  getStoryIdiom: function () {
    wx.cloud.callFunction({
      name: 'game',
      data: {
        action: 'getStoryIdiom'
      },
      success: res => {
        if (res.result.success) {
          this.setData({
            story: res.result.data.story,
            idiomId: res.result.data._id,
            inputValue: '',
            showModal: false
          });
        } else {
          wx.showToast({
            title: '获取故事失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '调用云函数失败',
          icon: 'none'
        });
      }
    });
  },

  onInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  submitAnswer: function () {
    if (!this.data.inputValue) {
      wx.showToast({
        title: '请输入答案',
        icon: 'none'
      });
      return;
    }

    wx.cloud.callFunction({
      name: 'game',
      data: {
        action: 'checkIdiom',
        idiomId: this.data.idiomId,
        userAnswer: this.data.inputValue
      },
      success: res => {
        if (res.result.success) {
          this.setData({
            isCorrect: res.result.correct,
            modalTitle: res.result.correct ? '恭喜你，答对了！' : '很遗憾，答错了',
            answer: res.result.answer,
            showModal: true
          });
        } else {
          wx.showToast({
            title: '校验失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.showToast({
          title: '调用云函数失败',
          icon: 'none'
        });
      }
    });
  },

  closeModal: function () {
    this.setData({
      showModal: false
    });
    if (this.data.isCorrect) {
      this.getStoryIdiom();
    }
  },

  getNext: function () {
    this.getStoryIdiom();
  }
});