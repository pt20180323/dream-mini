const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    themeObj: [], //主题
    currentSwiper: 0,
    imgheights: [],
    isRequest: false,
    pageNumber: 1,
    scrollTop: 0,
    currentDis: 0,
    lastDis: 0,
    headTop: 45,
    fixedTop: 45,
    showTop: true,
    shopId:''
  },
  onLoad(options) {
    let _this = this
    if (options) {
      if (options.shopId) {
        _this.setData({
          shopId: options.shopId
        })
      }
      if (options.storeId) {
        _this.setData({
          storeId: options.storeId
        })
      }
      if (options.templateId) {
        _this.setData({
          templateId: options.templateId
        })
      }
    }
  },
  onShow() {
    let _this = this;
    //释放传入商品列表的主题id
    app.globalData.themeId = ''
    app.checkUserId(_this.initData)
  },
  //初始化数据
  initData: function () {
    let _this = this;
    let appletName = app.globalData.appletName
    if (appletName && appletName !== '') {
      wx.setNavigationBarTitle({
        title: appletName
      })
    }
    _this.getTheme()
  },

  // 获取主题数据
  getTheme: function () {
    let _this = this
    let params = {
      shopId: _this.data.shopId || app.globalData.shopId,
      storeId: _this.data.storeId || app.globalData.storeId,
      templateId: _this.data.templateId
    }
    //正常进首页
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/home/previewIndex/' + params.shopId + '/' + params.storeId + '/' + params.templateId, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.themeRender(res)
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  themeRender: function (res) {
    let _this = this
    let result = res.result
    if (result) {
      let _cnt = result.customTheme
      let _prm = {}
      // 获取富文本主题 给富文本图片添加样式
      _cnt.map(item => {
        const _idx = parseInt(item.style)
        if (_idx === 7) {
          if (item.theme.richText) {
            item.theme.richText = item.theme.richText.replace(/\<img/gi, '<img class="rich-img" ')
          }
        } else if (_idx === 4) {
          _prm['prm' + item.sort] = new Promise((resolve, reject) => {
            _this.getShopList(1, item, resolve, reject)
          })
        }
      })
      _this.asyncFun(_prm, _cnt)
    }
  },
  //异步处理商品
  asyncFun: function (_prm, _cnt) {
    let _this = this
    let _arr = []
    for (const key in _prm) {
      _arr.push(_prm[key])
    }
    if (_arr.length) {
      Promise.all(...([_arr])).then((res) => {
        utils.globalShowTip(false)
        _this.setData({
          themeObj: _cnt,
          isRequest: true
        })
      }).catch((error) => {
        utils.globalShowTip(false)
        console.log(error)
      })
    } else {
      _this.setData({
        themeObj: _cnt
      })
    }
  },
  // 获取商品列表
  getShopList: function (pageNumber, shopTheme, resolve, reject) {
    let _this = this
    _this.setData({
      pageNumber: pageNumber || 1,
      isRequest: false
    })
    let params = {
      shopId: shopTheme.theme.shopId || app.globalData.shopId,
      storeId: shopTheme.theme.storeId || app.globalData.storeId,
      themeId: shopTheme.theme.themeId,
      sortType: shopTheme.theme.goodSort,
      pageNumber: pageNumber || _this.data.pageNumber
    }
    let data = {
      pageSize: 10
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/previewProListForIndex/' + params.shopId + '/' + params.storeId + '/' + params.themeId + '/' + params.sortType + '/' + params.pageNumber, data).then(res => {
      if (res) {
        if (res.result) {
          let _rst = res.result
          let hasNextPage = 'hasNextPage' + shopTheme.sort
          _this.setData({
            [hasNextPage]: _rst.hasNextPage,
            pageNumber: _rst.pageNumber,
          })
          if (_this.data.pageNumber === 1) {
            shopTheme['shopList'] = _rst.result
          } else {
            shopTheme['shopList'] = shopTheme['shopList'].concat(_rst.result)
          }
          resolve(_rst.result)
        } else {
          utils.globalShowTip(false)
        }
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  //监听屏幕滚动 判断上下滚动
  onPageScroll(ev) {
    let _this = this
    let {
      showTop,
      headTop,
      fixedTop,
      currentDis,
      lastDis,
      scrollTop
    } = _this.data
    let wHeight = wx.getSystemInfoSync().windowHeight
    //当滚动的top值最大或最小时，为什么要做这一步是因为在手机实测小程序的时候会发生滚动条回弹，所以为了处理回弹，设置默认最大最小值
    if (ev.scrollTop <= 0) {
      ev.scrollTop = 0
    } else if (ev.scrollTop > wHeight) {
      ev.scrollTop = wHeight
    }
    //判断浏览器滚动条上下滚动
    if (ev.scrollTop > scrollTop || ev.scrollTop === wHeight) {
      //向下滚动
      lastDis = currentDis
      currentDis = currentDis + ev.scrollTop
      _this.setData({
        lastDis: lastDis,
        currentDis: currentDis
      })
      headTop = 0
      showTop = false
      if (currentDis - lastDis >= 350) {
        let pageNumber = _this.data.pageNumber + 1
        let _cnt = _this.data.themeObj
        if (!_this.data.isRequest) {
          return false
        }
        _cnt.forEach(item => {
          let hasNextPage = 'hasNextPage' + item.sort
          if (_this.data[hasNextPage]) {
            let _prm = {}
            const _idx = parseInt(item.style)
            if (_idx === 4) {
              _prm['prm' + item.sort] = new Promise((resolve, reject) => {
                _this.getShopList(pageNumber, item, resolve, reject)
              })
            }
            _this.asyncFun(_prm, _cnt)
          }
        })
      }
    } else {
      if (scrollTop < fixedTop) {
        headTop = fixedTop
        showTop = true
      }
    }
    //给scrollTop重新赋值
    setTimeout(function() {
      _this.setData({
        scrollTop: ev.scrollTop,
        headTop: headTop,
        showTop: showTop
      })
    }, 0)
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    let _this = this
    let _shopId = _this.data.shopId || app.globalData.shopId
    let _storeId = _this.data.storeId || app.globalData.storeId
    let _templateId = _this.data.templateId || ''
    let _url = '/pages/home/home?shopId=' + _shopId + '&storeId=' + _storeId + '&templateId=' + _templateId
    return {
      title: app.globalData.shareTit,
      path: _url,
      imageUrl: app.globalData.imgUrl,
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  imageLoad(e) {
    let $width = e.detail.width, //获取图片真实宽度
      $height = e.detail.height,
      ratio = $width / $height //图片的真实宽高比例
    let viewHeight = 750 / ratio //计算的高度值
    var imgheights = this.data.imgheights
    imgheights[e.target.dataset.index] = viewHeight
    this.setData({
      "imgheights": imgheights
    })
  },
  swiperWebsite(e) {
    this.setData({
      currentSwiper: e.detail.current
    })
  },
  // 进入主题下的二级页面
  toLink(e) {
    let dataset = e.currentTarget.dataset
    let contentType = parseInt(dataset.type)
    let templateId = dataset.tid
    let hyperLink = dataset.link
    if (contentType === 0) {
      //配置链接为商品列表 跳到商品列表页面
      app.globalData.themeId = dataset.tid
      this.getList(dataset.tid)
    } else if (contentType === 4) {
      //活动
      wx.reLaunch({
        url: hyperLink,
      })
    } else if (contentType === 5) {
      //小程序页面
      wx.navigateTo({
        url: hyperLink,
      })
    } else if (contentType === 6) {
      let URI = encodeURIComponent(hyperLink)
      //公众号链接
      wx.navigateTo({
        url: '/pages/public/public?link=' + URI,
      })
    } else if (contentType === 7) {
      //跳转小程序
      let homeStr = hyperLink.indexOf("home") != -1
      if (homeStr) {
        let hyperLink2 = hyperLink.replace(/home/g, 'home2')
        wx.navigateTo({
          url: hyperLink2,
        })
      } else {
        wx.navigateTo({
          url: hyperLink,
        })
      }
    } else {
      //富文本、超链接、无
      return false
    }
  },
  toDetail(opt) {
    let atype = opt.currentTarget.dataset.type
    let goodsId = opt.currentTarget.dataset.gid
    let activivtyId = opt.currentTarget.dataset.aid
    let shopId = opt.currentTarget.dataset.sid
    let storeId = opt.currentTarget.dataset.stid
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&storeId=' + storeId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId + '&storeId=' + storeId + '&shopId=' + shopId
      })
    }

  },
  // 获取主题下面商品列表的数量
  getList: function (themeId) {
    let _this = this
    let _global = app.globalData
    //？携带参数
    let _params = {
      themeId: themeId
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/goods/list/' + _global.shopId + '/' + _global.storeId + '/0/2/1', _params, 'POST').then(res => {
      if (res) {
        if (res.result.result.length == 1) {
          let goodsDetail = res.result.result[0]
          let atype = goodsDetail.type
          let activivtyId = goodsDetail.activityId
          let goodsId = goodsDetail.id
          let storeId = goodsDetail.storeId
          let shopId = goodsDetail.shopId
          if (atype === 7) { //秒杀
            wx.navigateTo({
              url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
            })
          } else if (atype === 12) { //抱团
            wx.navigateTo({
              url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&storeId=' + storeId + '&activityType=' + atype
            })
          } else {
            wx.navigateTo({
              url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId + '&storeId=' + storeId + '&shopId=' + shopId
            })
          }
        } else {
          wx.switchTab({
            url: '/pages/commonshop/shopList/shopList'
          })
        }
      }
    }).catch(e => { })
  }
})