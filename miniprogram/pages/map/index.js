// 获取数据库引用
const db = wx.cloud.database();

Page({
  data: {
    latitude: 36.6255,
    longitude: 114.4907,
    scale: 12,
    markers: [],
    showPopup: false,
    currentIdioms: [],
    currentIdiomIndex: 0,
    showSwipeHint: true,
    isLoading: true,
    currentImageIndex: 0,
    // 新增滑动控制变量
    scrollTop: 0,
    isScrolling: false,
    startX: 0,
    startY: 0,
    // 新增：记录滑动方向
    scrollDirection: null
  },

  onLoad: function() {
    this.loadAllIdiomMarkers();
    setTimeout(() => {
      this.setData({ showSwipeHint: false });
    }, 3000);
  },

  // 滑动事件处理 - 解决滑动冲突
  onSwiperTouchStart: function(e) {
    this.setData({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isScrolling: false,
      scrollDirection: null
    });
  },

  onSwiperTouchMove: function(e) {
    if (this.data.isScrolling) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - this.data.startX);
    const diffY = Math.abs(currentY - this.data.startY);
    
    // 调整判断阈值，更准确地区分水平和垂直滑动
    if (diffX > diffY && diffX > 10) {
      // 主要是水平滑动，让swiper处理
      this.setData({ 
        isScrolling: false,
        scrollDirection: 'horizontal'
      });
    } else if (diffY > diffX && diffY > 5) {
      // 主要是垂直滑动，标记为滚动状态
      this.setData({ 
        isScrolling: true,
        scrollDirection: 'vertical'
      });
    }
  },

  onSwiperTouchEnd: function(e) {
    this.setData({ 
      isScrolling: false,
      scrollDirection: null
    });
  },

  onScrollTouchStart: function(e) {
    this.setData({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      scrollDirection: null
    });
  },

  onScrollTouchMove: function(e) {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - this.data.startX);
    const diffY = Math.abs(currentY - this.data.startY);
    
    // 如果已经确定为水平滑动，则阻止滚动
    if (this.data.scrollDirection === 'horizontal') {
      return;
    }
    
    // 判断滑动方向
    if (!this.data.scrollDirection) {
      if (diffX > diffY && diffX > 10) {
        this.setData({ scrollDirection: 'horizontal' });
        return; // 水平滑动，阻止滚动
      } else if (diffY > diffX && diffY > 5) {
        this.setData({ scrollDirection: 'vertical' });
        // 垂直滑动，允许滚动
      }
    }
  },

  onScrollTouchEnd: function(e) {
    this.setData({ scrollDirection: null });
  },

  onScroll: function(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  parseCoordinates: function(geopoint) {
    console.log('原始坐标数据:', geopoint);
    try {
      if (geopoint && typeof geopoint.longitude === 'number' && typeof geopoint.latitude === 'number') {
        return [
          parseFloat(geopoint.longitude.toFixed(6)),
          parseFloat(geopoint.latitude.toFixed(6))
        ];
      }
      else if (geopoint && typeof geopoint.longitude === 'function') {
        return [
          parseFloat(geopoint.longitude().toFixed(6)),
          parseFloat(geopoint.latitude().toFixed(6))
        ];
      }
      else if (Array.isArray(geopoint) && geopoint.length >= 2) {
        if (typeof geopoint[0] === 'string') {
          const lonStr = geopoint[0].replace('° E', '').replace('°', '').trim();
          const latStr = geopoint[1].replace('° N', '').replace('°', '').trim();
          return [
            parseFloat(parseFloat(lonStr).toFixed(6)),
            parseFloat(parseFloat(latStr).toFixed(6))
          ];
        } else {
          return [
            parseFloat(geopoint[0].toFixed(6)),
            parseFloat(geopoint[1].toFixed(6))
          ];
        }
      }
    } catch (error) {
      console.warn('坐标解析错误:', error);
    }
    return [114.4907, 36.6255];
  },

  async loadAllIdiomMarkers() {
    try {
      wx.showLoading({ title: '加载成语地点中...' });
      this.setData({ isLoading: true });

      const res = await db.collection('idioms')
        .where({ location: db.command.exists(true) })
        .get();

      if (res.data.length === 0) {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({ title: '暂无成语地点数据', icon: 'none' });
        return;
      }

      const locationMap = {};
      res.data.forEach((item, index) => {
        if (!item.location || !item.location.geopoint) return;
        const [longitude, latitude] = this.parseCoordinates(item.location.geopoint);
        const locationKey = `${longitude.toFixed(6)},${latitude.toFixed(6)}`;
        if (!locationMap[locationKey]) {
          locationMap[locationKey] = { idioms: [], longitude, latitude };
        }
        locationMap[locationKey].idioms.push(item);
      });

      const markers = Object.values(locationMap).map((location, index) => {
        const idiomNames = location.idioms.map(item => item.idiom).join('、');
        return {
          id: index,
          latitude: location.latitude,
          longitude: location.longitude,
          iconPath: '/images/map-marker.png',
          width: 40,
          height: 40,
          title: idiomNames,
          callout: {
            content: idiomNames,
            color: '#000',
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: 'ALWAYS'
          },
          customData: { idioms: location.idioms }
        };
      });

      this.setData({ markers: markers, isLoading: false });
      wx.hideLoading();
      
      if (markers.length > 0) {
        this.setData({
          latitude: markers[0].latitude,
          longitude: markers[0].longitude,
          scale: 14
        });
      }

    } catch (error) {
      console.error('加载成语标记点失败:', error);
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载数据失败，请重试', icon: 'none' });
    }
  },

  async onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.markers[markerId];
    if (!marker || !marker.customData) return;

    try {
      wx.showLoading({ title: '加载详情中...' });
      const idiomsToLoad = marker.customData.idioms.slice(0, 5);
      const formattedIdioms = idiomsToLoad.map(item => this.formatIdiomData(item));
      
      this.setData({
        currentIdioms: formattedIdioms,
        currentIdiomIndex: 0,
        currentImageIndex: 0,
        showPopup: true,
        showSwipeHint: formattedIdioms.length > 1,
        scrollTop: 0 // 重置滚动位置
      });
      wx.hideLoading();
    } catch (error) {
      console.error('查询详情失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '加载详情失败', icon: 'none' });
    }
  },

  formatIdiomData: function(idiomData) {
    return {
      name: idiomData.idiom || '未知成语',
      scenicSpot: idiomData.scenicSpot || '',
      story: idiomData.story || '',
      location: idiomData.location,
      address: idiomData.location?.address || '',
      relatedCharacters: idiomData.relatedCharacters || [],
      storySegments: idiomData.storySegments || [],
      images: this.getImageUrls(idiomData.imgUrl)
    };
  },

  getImageUrls: function(imgUrlData) {
    if (!imgUrlData) return [];
    if (Array.isArray(imgUrlData)) {
      return imgUrlData.map(item => {
        if (item && item.fileID) return item.fileID;
        return null;
      }).filter(url => url !== null);
    }
    return [];
  },

  moveToHandan() {
    this.setData({ latitude: 36.6255, longitude: 114.4907, scale: 12 });
  },

  closePopup() {
    this.setData({ 
      showPopup: false, 
      currentIdioms: [], 
      currentIdiomIndex: 0, 
      currentImageIndex: 0,
      scrollTop: 0,
      scrollDirection: null
    });
  },

  stopPropagation() {
    return false;
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    const currentIdiom = this.data.currentIdioms[this.data.currentIdiomIndex];
    const allUrls = currentIdiom.images;
    wx.previewImage({ current: url, urls: allUrls });
  },

  onSwiperChange: function(e) {
    this.setData({ 
      currentIdiomIndex: e.detail.current, 
      currentImageIndex: 0,
      scrollTop: 0, // 切换成语时重置滚动位置
      scrollDirection: null
    });
  },

  onImageSwiperChange: function(e) {
    this.setData({ currentImageIndex: e.detail.current });
  }
});

