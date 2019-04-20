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
    headTop: 0,
    fixedTop: 0,//45
    showTop: true,
    isFirst: true,
    isLoad: false,
    tabLoad: false
  },
  onLoad(opt) {
    let _this = this
    if (opt) {
      this.setData({
        templateId: opt.templateId || ''
      })
    }
    app.checkUnionId(this.initData)
    setTimeout(function() {
      _this.data.tabLoad = true
    }, 1000)
  },
  onShow() {
    //释放传入商品列表的主题id
    app.globalData.themeId = ''
  },
  onHide() {
    let {
      behaviorId
    } = this.data
    if (behaviorId) {
      app.reanderZjLeave(2, behaviorId)
    }
  },
  onTabItemTap(item) {
    if (this.data.tabLoad) {
      wx.showNavigationBarLoading()
      this.setData({
        isFirst: false,
        pageNumber: 1,
        isLoad: true
      }, () => {
        app.checkUnionId(this.initData)
      })
      setTimeout(function() {
        wx.hideNavigationBarLoading()
      }, 1000)
    }
  },
  onPullDownRefresh: function() {
    wx.showNavigationBarLoading()
    this.setData({
      isFirst: false,
      isLoad: true,
      pageNumber: 1
    }, () => {
      this.initData()
    })
    setTimeout(function() {
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }, 1000)
  },
  //初始化数据
  initData() {
    let _this = this
    let {
      storeId,
      isFirst
    } = _this.data
    let _global = app.globalData
    if (_global.jumpAppB) {
      wx.showModal({
        title: '温馨提示',
        content: '请先激活',
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            _this.jumpApp()
          }
        }
      })
      return
    }
    app.linecarCount()
    app.unReadMsgCount().then(res => {
      _global.empId = res.empId || ''
      _global.empName = res.empName
      _this.setData({
        empObj: res
      })
    })
    if (isFirst) {
      app.reanderZj(2).then(res => {
        _this.setData({
          behaviorId: res
        })
      })
    }
    _this.getTheme()
    _this.getStoreInfor()
  },
  jumpApp() {
    let _this = this
    let _global = app.globalData
    let _url = `pages/index/index`
    wx.navigateToMiniProgram({
      appId: _global.jumpAppId,
      path: _url,
      extraData: {
        'type': 'zhiyuan'
      },
      envVersion: 'develop',
      success(res) {},
      fail(res) {}
    })
  },
  //查询粉丝对应的员工和门店信息
  getStoreInfor: function() {
    let _this = this
    let _global = app.globalData
    if (_global.empId) {
      _this.setData({
        empId: _global.empId,
        headTop: 60,
        fixedTop: 60
      })
    }
    let params = {
      empId: _global.empId || ''
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/emp/storeAndEmp/' + _global.shopId + '/' + _global.storeId, params, '', 1).then(res => {
      if (res) {
        _this.setData({
          empInfo: res.result.employee,
          storeInfo: res.result.store
        })
      }
    }).catch(error => {})
  },
  // 获取主题数据
  getTheme() {
    let _this = this
    let {
      shopId,
      storeId,
      baseUrl
    } = app.globalData
    let data = {
      templateId: _this.data.templateId || ''
    }
    //正常进首页
    utils.$http(baseUrl + '/emallMiniApp/home/index/' + shopId + '/' + storeId, data, '', _this.data.isLoad).then(res => {
      if (res) {
        _this.themeRender(res)
      }
    }).catch(error => {})
  },
  themeRender(res) {
    let _this = this
    let result = res.result
    if (result) {
      let _cnt = result.customTheme || []
      let appletName = app.globalData.appletName
      let cstName = result.customName
      if (getCurrentPages()[0].route.toString().indexOf('pages/home/home') > -1) {
        wx.setNavigationBarTitle({
          title: cstName || appletName || ''
        })
      }
      let _prm = {}
      // 获取富文本主题 给富文本图片添加样式
      _cnt.map(item => {
        const _idx = parseInt(item.style)
        if (_idx === 7) {
          if (item.theme.richText) {
            item.theme.richText = item.theme.richText.toString().replace(/\<img/gi, '<img class="rich-img" ')
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
  asyncFun(_prm, _cnt) {
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
      })
    } else {
      _this.setData({
        themeObj: _cnt
      })
    }
  },
  // 获取商品列表
  getShopList(pageNumber, shopTheme, resolve, reject) {
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
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/proListForIndex/' + params.shopId + '/' + params.storeId + '/' + params.themeId + '/' + params.sortType + '/' + params.pageNumber, data, '', _this.data.isLoad).then(res => {
      if (res) {
        if (res && res.result) {
          let _rst = res.result
          let _rarr = _rst.result || []
          let hasNextPage = 'hasNextPage' + shopTheme.sort
          _this.setData({
            [hasNextPage]: _rst.hasNextPage,
            pageNumber: _rst.pageNumber,
          })
          if (_this.data.pageNumber === 1) {
            shopTheme['shopList'] = _rarr
          } else {
            shopTheme['shopList'] = shopTheme['shopList'].concat(_rarr)
          }
          resolve(_rarr)
        } else {
          resolve([])
        }
      }
    }).catch(error => {})
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
          return
        }
        _cnt.forEach(item => {
          let hasNextPage = 'hasNextPage' + item.sort
          if (_this.data[hasNextPage]) {
            let _prm = {}
            const _idx = parseInt(item.style)
            if (_idx === 4) {
              _prm['prm' + item.sort] = new Promise((resolve, reject) => {
                _this.data.isLoad = true
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
    let _templateId = _this.data.templateId || ''
    let _url = '/pages/home/home?templateId=' + _templateId
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
    let {
      type,
      gid,
      aid,
      sid,
      stid
    } = opt.currentTarget.dataset
    if (type === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + aid + '&goodsId=' + gid
      })
    } else if (type === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + aid + '&goodsId=' + gid + '&storeId=' + stid
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?goodsId=' + gid + '&storeId=' + stid + '&shopId=' + sid
      })
    }
  },
  toChat() {
    let _this = this
    let phone = _this.data.empObj.storePhone //没有导购的就返回电话号
    let name = _this.data.empObj.empName
    if (phone) {
      wx.showModal({
        title: '门店电话',
        content: phone,
        confirmText: '拨打',
        showCancel: true,
        success: function(res) {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: phone// 仅为示例，并非真实的电话号码
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/chat/chat?name=' + name
    })
  },
  searchCustomer(e) {
    let _this = this
    let _global = app.globalData
    let goodsName = e.detail.value
    _global.goodsName = goodsName
    _this.setData({
      value: ''
    })
    wx.switchTab({
      url: '/pages/commonshop/shopList/shopList'
    })
  },
  goTop: function(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
  },
  // 获取主题下面商品列表的数量
  getList: function(themeId) {
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
    }).catch(e => {})
  }
})