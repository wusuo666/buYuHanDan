Page({
  data: {
    story: '',
    idiomId: '',
    images: [],
    currentImageIndex: 0,
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
          const idiomData = res.result.data;
          this.setData({
            story: idiomData.story,
            idiomId: idiomData._id,
            inputValue: '',
            showModal: false,
            images: [],
            currentImageIndex: 0
          });

          if (idiomData.imgUrl && Array.isArray(idiomData.imgUrl)) {
            const fileIDs = idiomData.imgUrl.map(item => item.fileID).filter(id => id);
            if (fileIDs.length > 0) {
              wx.cloud.getTempFileURL({
                fileList: fileIDs
              }).then(fileRes => {
                if (fileRes.fileList && fileRes.fileList.length > 0) {
                  const urls = fileRes.fileList.map(file => file.tempFileURL);
                  this.setData({ images: urls });
                }
              }).catch(err => {
                console.error('获取临时文件URL失败:', err);
              });
            }
          }
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
  },

  onImageSwiperChange: function(e) {
    this.setData({ currentImageIndex: e.detail.current });
  }
});