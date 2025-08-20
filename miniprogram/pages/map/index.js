// 获取数据库引用
const db = wx.cloud.database();

Page({
  data: {
    // 地图中心点 - 邯郸市坐标
    latitude: 36.6255,
    longitude: 114.4907,
    scale: 12,
    
    // 标记点数组
    markers: [],
    
    // 弹窗控制
    showPopup: false,
    currentIdiom: null,
    
    // 加载状态
    isLoading: true
  },

  onLoad: function() {
    this.loadAllIdiomMarkers();
  },

  // 新增：解析坐标字符串函数
 // 修改 parseCoordinates 函数
parseCoordinates: function(geopoint) {
  console.log('原始坐标数据:', geopoint);
  
  try {
    // 方法1：直接访问属性（GEO_POINT类型）
    if (geopoint && typeof geopoint.longitude === 'number' && typeof geopoint.latitude === 'number') {
      return [geopoint.longitude, geopoint.latitude];
    }
    // 方法2：使用getter方法
    else if (geopoint && typeof geopoint.longitude === 'function') {
      return [geopoint.longitude(), geopoint.latitude()];
    }
    // 方法3：处理字符串数组格式
    else if (Array.isArray(geopoint) && geopoint.length >= 2) {
      if (typeof geopoint[0] === 'string') {
        const lonStr = geopoint[0].replace('° E', '').replace('°', '').trim();
        const latStr = geopoint[1].replace('° N', '').replace('°', '').trim();
        return [parseFloat(lonStr), parseFloat(latStr)];
      } else {
        return [geopoint[0], geopoint[1]];
      }
    }
  } catch (error) {
    console.warn('坐标解析错误:', error);
  }
  
  console.warn('无法解析的坐标格式，使用默认值');
  return [114.4907, 36.6255];
},

  // 从数据库加载所有成语标记点
  async loadAllIdiomMarkers() {
    try {
      wx.showLoading({
        title: '加载成语地点中...',
      });

      this.setData({ isLoading: true });

      // 获取数据库中所有包含位置信息的成语
      const res = await db.collection('idiom')
        .where({
          location: db.command.exists(true)
        })
        .get();

      console.log('从数据库获取到的成语数据:', res.data);

      if (res.data.length === 0) {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({
          title: '暂无成语地点数据',
          icon: 'none'
        });
        return;
      }

      // 动态生成标记点 - 已修改
      const markers = res.data.map((item, index) => {
        if (!item.location || !item.location.geopoint) {
          console.warn('成语缺少有效位置信息:', item.idiom || '未知成语');
          return null;
        }

        // 使用解析函数处理坐标
        const [longitude, latitude] = this.parseCoordinates(item.location.geopoint);

        return {
          id: index,
          latitude: latitude,
          longitude: longitude,
          iconPath: '/images/map-marker.png',
          width: 30,
          height: 30,
          title: item.idiom || '未命名成语',
          callout: {
            content: item.idiom || '成语地点',
            color: '#000',
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: 'ALWAYS'
          }
        };
      }).filter(marker => marker !== null);

      console.log('生成的标记点:', markers);

      this.setData({
        markers: markers,
        isLoading: false
      });

      wx.hideLoading();
      
      if (markers.length > 0) {
        // 自动定位到第一个标记点
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
      wx.showToast({
        title: '加载数据失败，请重试',
        icon: 'none'
      });
    }
  },

  // 点击标记点事件 - 已修改
  async onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.markers[markerId];
    
    if (!marker) return;

    try {
      wx.showLoading({
        title: '加载详情中...',
      });

      // 先获取所有数据，然后在客户端过滤（因为坐标格式特殊）
      const allData = await db.collection('idiom')
        .where({
          location: db.command.exists(true)
        })
        .get();

      // 在客户端查找匹配的数据
      const matchedData = allData.data.find(item => {
        if (!item.location || !item.location.geopoint) return false;
        
        const [itemLon, itemLat] = this.parseCoordinates(item.location.geopoint);
        
        // 允许一定的精度误差
        return Math.abs(itemLon - marker.longitude) < 0.001 && 
               Math.abs(itemLat - marker.latitude) < 0.001;
      });

      if (matchedData) {
        this.setData({
          currentIdiom: this.formatIdiomData(matchedData),
          showPopup: true
        });
      } else {
        wx.showToast({
          title: '未找到详情信息',
          icon: 'none'
        });
      }

      wx.hideLoading();
    } catch (error) {
      console.error('查询详情失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载详情失败',
        icon: 'none'
      });
    }
  },

  // 格式化成语数据用于显示
  formatIdiomData: function(idiomData) {
    return {
      name: idiomData.idiom || '未知成语',
      scenicSpot: idiomData.scenicSpot || '暂无景点信息',
      story: idiomData.story || '暂无故事内容',
      location: this.formatLocation(idiomData.location),
      address: idiomData.location?.address || '无地址信息',
      relatedCharacters: idiomData.relatedCharacters || [],
      storySegments: idiomData.storySegments || [],
      images: this.getImageUrls(idiomData.imgUrl)
    };
  },

  // 格式化位置信息 - 已修改
  formatLocation: function(location) {
    if (!location || !location.geopoint) return '位置信息暂无';
    
    const [longitude, latitude] = this.parseCoordinates(location.geopoint);
    
    return `${location.address || '未知地点'} (纬度: ${latitude.toFixed(6)}, 经度: ${longitude.toFixed(6)})`;
  },

  // 获取图片URL数组
  getImageUrls: function(imgUrlData) {
    if (!imgUrlData) return [];
    
    // 如果是数组格式
    if (Array.isArray(imgUrlData)) {
      return imgUrlData.map(item => {
        if (item && item.fileID) return item.fileID;
        return null;
      }).filter(url => url !== null);
    }
    
    return [];
  },

  // 定位到邯郸
  moveToHandan() {
    this.setData({
      latitude: 36.6255,
      longitude: 114.4907,
      scale: 12
    });
  },

  // 关闭弹窗
  closePopup() {
    this.setData({
      showPopup: false,
      currentIdiom: null
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    return false;
  },

  // 预览图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    const allUrls = this.data.currentIdiom.images;
    
    wx.previewImage({
      current: url,
      urls: allUrls
    });
  }
});

