const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    teamId: '',
    shopNum: 1, //商品数量
    optionList: [], //商品属性list
    attrLinkList: [], //SKUID列表
    teamShopGoods: {}, //抱团配置相关信息
    teamShopInfo: {}, //抱团活动规则
    teamList: [], //未成团列表
    storeList: [], //适用门店列表
    showSku: {},
    teamInfo: {},
    elFreightVo: {},
    freightDouble: 0, //运费
    slideUp: false,
    storeSlideUp: false,
    shareSlideUp: false, //分享弹窗
    posterSlideUp: false, //生成海报保存到相册弹框
    interval: null,
    countHtml: '',
    priceHtml: '',
    cacheSkuId: '',
    imgUrls: [],
    richTxt: '',
    behaviorId: '', //浏览足迹id
    isShowImg: true, //是否显示轮播图
    hasGoodsVideo: false,
    hasDetailVideo: false,
    videoObj: {},
    sidx: 1,
    isExit: false,
    detailPlay: false,
    pauseVideo: false,
    isShow:true,
    showCar:true
  },
  onLoad(opt) {
    let _this = this
    if (opt) {
      _this.setData({
        activityId: opt.activityId || '',
        activityType: opt.activityType || 12,
        storeId: opt.storeId || '',
        goodsId: opt.goodsId || '',
        teamId: opt.teamId || ''
      })
    }
    let _global = app.globalData
    _this.setData({
      memberFlag: _global.memberFlag,
      isIpx: _global.isIpx
    })
  },
  toHome: function() {
    wx.switchTab({
      url: '/pages/home/home',
    })
  },
  toImg: function() {
    this.setData({
      isShowImg: true,
      currIndex: 1
    })
  },
  toVideo: function() {
    this.setData({
      isShowImg: false,
      currIndex: 0
    })
  },
  onReady: function() {
    this.videoContext = wx.createVideoContext('myDetailVideo')
  },
  detailPlay: function() {
    this.setData({
      detailPlay: true
    }, () => {
      setTimeout(() => {
        this.videoContext.play()
      }, 500)
    })
  },
  onShow() {
    this.setData({
      slideUp: false,
      isShow:true,
      showSku: {},
      showCar:true
    })
    app.checkUserId(this.initData)
  },
  onHide() {
    let {
      behaviorId,
      goodsId
    } = this.data
    if (behaviorId) {
      this.reanderZjLeave(goodsId)
    }
  },
  initData() {
    this.setData({
      userType: app.globalData.userType
    })
    this.getEnvironment()
    this.getShopDetail()
  },
  getEnvironment() { //处理电商用户从企业微信中进入电商不允许下单
    let {
      environment
    } = app.globalData
    if (environment) {
      this.setData({
        environment: environment
      })
    }
  },
  getShopDetail() {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      teamId: _data.teamId,
      activityId: _data.activityId,
      goodsId: _data.goodsId,
      buyerId: _global.buyerId,
      userType: _global.userType,
      sessionId: _global.sessionKey
    }
    utils.$http(_global.baseUrl + '/elshop/teamShop/findTeamShopDetail', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopDetRender(res)
      }
    }).catch((res) => {})
  },
  shopDetRender(res) {
    let _this = this
    let _data = _this.data
    if (res && res.result) {
      let _rst = res.result
      let storeFlag = _rst.storeFlag
      if (!storeFlag && storeFlag === 0) {
        wx.showModal({
          title: '温馨提示',
          content: '所属门店找不到该商品信息',
          showCancel: false,
          success() {
            wx.switchTab({
              url: '/pages/home/home',
            })
          }
        })
        return
      }
      if (_rst.teamInfo.detailContent) {
        _rst.teamInfo.detailContent = _rst.teamInfo.detailContent.replace(/<img[ \s]/g, '<img class="maxImg" ')
      }
      _rst.teamInfo.countDownSeconds = parseInt(_rst.teamInfo.countDownSeconds)
      let _list = _rst.optionList
      if (_list) {
        _list.map((item) => {
          return item.cur = ''
        })
      }
      let _price = _rst.teamInfo.price.toString().split('.')
      let memberPrice
      if (_rst.teamInfo.memberPriceDouble) {
        memberPrice = _rst.teamInfo.memberPriceDouble.toString().split('.')
      }
      _this.setData({
        optionList: _list || [],
        attrLinkList: _rst.attrLinkList,
        elFreightVo: _rst.elFreightVo || {},
        status: parseInt(_rst.status),
        teamStatus: parseInt(_rst.teamStatus),
        teamShopGoods: _rst.teamShopGoods || {},
        teamShopInfo: _rst.teamShopInfo || {},
        priceHtml: _price,
        teamInfo: _rst.teamInfo,
        freightDouble: _rst.freightDouble,
        goodsId: _rst.teamShopGoods.goodsId,
        activityId: _rst.teamShopGoods.activityId,
        memberPrice: memberPrice || ''
      })
      _this.getGoodsVideo(_rst)
      if (_data.interval) {
        clearInterval(_data.interval)
        _data.interval = null
      }
      _data.interval = setInterval(() => {
        if (_data.teamInfo.countDownSeconds >= 0) {
          _this.countDown(--_data.teamInfo.countDownSeconds)
        }
      }, 1000)
      let gid = _rst.teamShopGoods.goodsId || _data.goodsId //商品ID
      let syncId = _rst.teamInfo.syncId || ''
      _this.reanderZj(gid)
      _this.unReadMsgCount()
      _this.queryGoodsSkuBrokerage()
      _this.getTeamList()
      _this.searchYouhui()
    }
  },
  getGoodsVideo(rst) {
    let _rst = rst.goodsVideo
    if (_rst) {
      this.setData({
        videoObj: _rst || {},
        hasGoodsVideo: _rst.hasGoodsVideo || false,
        hasDetailVideo: _rst.hasDetailVideo || false,
        isShowImg: _rst.hasGoodsVideo ? false : true
      })
    }
  },
  getReduce(goodsId) { //查询满减信息
    let _global = app.globalData
    let _url = `${_global.baseUrl}/emallMiniApp/fulReduce/findGoodsFulReduceRes/${_global.shopId}/${_global.storeId}/${goodsId}`
    utils.$http(_url, {}).then(res => {
      let _rst = res.result
      if (_rst) {
        this.setData({
          reduceTxt: _rst
        })
      }
      utils.globalShowTip(false)
    }).catch((res) => {})
  },
  reanderZj(goodsId) { //用户浏览足迹 - 用户进入
    let _this = this
    let _data = _this.data
    let _gData = app.globalData
    if (_gData.businessModel && _data.storeId !== _gData.storeId) {
      return false
    }
    let params = {
      shopId: _gData.shopId,
      storeId: _gData.storeId,
      goodsId: goodsId,
      empId: _gData.shareEmpId || ''
    }
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/goods/detail/entry/' + params.shopId + '/' + params.storeId + '/' + params.goodsId, params, 'POST', 1).then(res => {
      if (res) {
        _this.setData({
          behaviorId: res.result
        })
      }
    }).catch(error => {})
  },
  reanderZjLeave(goodsId) { //用户浏览足迹 - 用户离开
    let _this = this
    let _data = this.data
    let _gData = app.globalData
    let params = {
      shopId: _gData.shopId,
      storeId: _gData.storeId,
      goodsId: goodsId,
      behaviorId: _data.behaviorId,
      empId: _gData.shareEmpId || ''
    }
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/goods/detail/leave/' + params.shopId + '/' + params.storeId + '/' + params.goodsId + '/' + params.behaviorId, params, 'POST', 1).then(res => {}).catch(error => {})
  },
  countDown(num) {
    let _this = this
    _this.data.teamInfo.countDownSeconds = num
    if (num <= 0) {
      clearInterval(_this.data.interval)
      _this.data.interval = null
      _this.setData({
        isCountDownEnd: true
      })
      return false
    }
    _this.setData({
      isCountDownEnd: false
    })
    let day = Math.floor(num / (24 * 60 * 60))
    let rewriteD = day < 10 ? ('0' + day) : day
    let hour = Math.floor(num / (60 * 60)) % 24
    let rewriteH = hour < 10 ? ('0' + hour) : hour
    let minute = Math.floor((num % 3600) / 60)
    let rewriteM = minute < 10 ? ('0' + minute) : minute
    let second = Math.floor(num % 60)
    let rewriteS = second < 10 ? ('0' + second) : second;
    let timeStr = '<span class="shape">' + rewriteD + '</span><em class="st_txt">天</em><span class="shape">' + rewriteH + '</span><em class="st_txt">:</em><span class="shape">' + rewriteM + '</span><em class="st_txt">:</em><span class="shape">' + rewriteS + '</span>'
    _this.setData({
      countHtml: timeStr
    })
  },
  searchYouhui() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId: _data.shopId || app.globalData.shopId,
      storeId: _data.storeId || app.globalData.storeId,
      goodsId: _data.goodsId || app.globalData.goodsId,
      activityId: _data.activityId || app.globalData.activityId,
      activityType: _data.activityType || 12,
    }
    let url = `/elshop/teamShop/detail/discounts/${params.shopId}/${params.storeId}/${params.goodsId}`
    utils.$http(app.globalData.baseUrl + url, {
      activityId: params.activityId,
      activityType: params.activityType
    }).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderYh(res)
      }
    }).catch(res => {})
  },
  renderYh(res) {
    if (res) {
      let arr = res.result
      let arrStr = arr.join(',').replace(/\,/g, ' ')
      this.setData({
        yhTxt: arrStr
      })
    }
  },
  queryGoodsSkuBrokerage() { //获取销售佣金
    let _this = this
    let _data = _this.data
    let params = {
      shopId: _data.shopId || app.globalData.shopId,
      storeId: _data.storeId || app.globalData.storeId,
      goodsId: _data.goodsId || app.globalData.goodsId,
      stockFormId: _data.teamInfo.stockFormId || '',
      attributeType: _data.teamInfo.attributeType || 0,
      activityId: _data.activityId || app.globalData.activityId,
      activityType: _data.activityType || 12,
      activityPrice: _data.teamShopGoods.price
    }
    let url = '/emallMiniApp/goods/detail/queryGoodsSkuBrokerage/' + params.shopId + '/' + params.storeId + '/' + params.goodsId
    utils.$http(app.globalData.baseUrl + url, params, '', 1).then(res => {
      if (res) {
        _this.setData({
          brokerage: res.result
        })
      }
    }).catch(res => {})
  },
  getTeamList() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId: _data.shopId || app.globalData.shopId,
      storeId: _data.storeId || app.globalData.storeId,
      skipTeamId: _data.teamId,
      activityId: _data.activityId || app.globalData.activityId,
      goodsId: _data.goodsId || app.globalData.goodsId,
      buyerId: app.globalData.buyerId
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/underwayTeamshopTeam', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderTeamList(res)
      }
    }).catch((res) => {})
  },
  renderTeamList(res) {
    let _this = this
    if (res && res.result) {
      _this.setData({
        teamList: res.result || []
      })
      if (res.result.length) {
        _this.renderTeamInterval()
      }
    }
  },
  renderTeamInterval() {
    let _this = this
    let _list = _this.data.teamList
    let isClear = false
    let timer = setInterval(function() {
      _list.forEach(function(item) {
        if (item.teamCountDownSeconds > 0) {
          isClear = false
          item.timerStr = _this.renderTimerStr(--item.teamCountDownSeconds)
        } else {
          isClear = true
          item.timerOverStr = '已超时'
        }
      })
      _this.setData({
        teamList: _list
      })
      if (isClear) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  },
  renderTimerStr(num) {
    let day = Math.floor(num / (24 * 60 * 60))
    let rewriteD = day < 10 ? ('0' + day) : day
    let hour = Math.floor(num / (60 * 60)) % 24
    let rewriteH = hour < 10 ? ('0' + hour) : hour
    let minute = Math.floor((num % 3600) / 60)
    let rewriteM = minute < 10 ? ('0' + minute) : minute
    let second = Math.floor(num % 60)
    let rewriteS = second < 10 ? ('0' + second) : second;
    let timeStr = rewriteD + '天' + rewriteH + ':' + rewriteM + ':' + rewriteS
    return timeStr
  },
  selectAttr(evt) {
    console.log(evt)
    let dst = evt.target.dataset
    let idx = dst.list
    let sidx = dst.sidx
    let _list = this.data.optionList
    _list[idx].cur = sidx
    let isAll = false
    _list.forEach(function(itm) {
      if (itm.cur !== '') {
        isAll = true
      } else {
        isAll = false
      }
    })
    let _sku = []
    if (isAll) {
      let _arr = []
      _list.forEach(function(itm) {
        _arr.push(itm.opt[itm.cur])
      })
      let str = _arr.join('@*&')
      _sku = this.data.attrLinkList.filter(function(item) {
        return item.key === str
      })
    }
    this.setData({
      optionList: _list,
      showSku: _sku[0] || {}
    })
  },
  gotoOffer(evt) {
    this.setData({
      slideUp: true,
      pauseVideo: false,
      detailPlay:false,
      isShow:false,
      showCar:false
    })
  },
  gotoOrder(evt) {
    let _this = this
    let _data = _this.data
    let _skuId = _data.showSku.skuId
    let _rem = parseInt(_data.showSku.stock)
    let formId = evt.detail.formId
    if (parseInt(_data.teamInfo.attributeType) === 0) {
      _skuId = _data.attrLinkList[0].skuId
    }
    if (!_skuId) {
      wx.showModal({
        title: '温馨提示',
        content: '请选择商品属性！',
        success: function(res) {},
        showCancel: false
      })
      return false
    }
    if (_rem < 1) {
      wx.showModal({
        title: '温馨提示',
        content: '商品库存不足，请选择其它商品！',
        success: function(res) {},
        showCancel: false
      })
      return false
    }
    _this.setData({
      cacheSkuId: _skuId,
      formId: formId
    })
    _this.orderVerify({
      total: _data.shopNum,
      skuId: _skuId,
      shopId: _data.shopId || app.globalData.shopId,
      activityId: _data.activityId || app.globalData.activityId,
      teamId: _data.teamId,
      storeId: _data.storeId || app.globalData.storeId,
      goodsId: _data.goodsId || app.globalData.goodsId,
      buyerId: app.globalData.buyerId
    })
  },
  orderVerify(params) {
    let _this = this
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/placeOrderVerify', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.orderVerifyRender(res)
      }
    }).catch(res => {})
  },
  orderVerifyRender(res) {
    let _data = this.data
    app.saveFormId(_data.formId)
    wx.navigateTo({
      url: '/pages/teamshop/orderInfor/orderInfor?skuId=' + _data.cacheSkuId + '&buyerId=' + app.globalData.buyerId + '&goodsId=' + _data.goodsId + '&number=' + _data.shopNum + '&activityId=' + _data.activityId + '&storeId=' + (_data.storeId || app.globalData.storeId) + '&teamId=' + (_data.teamId || '')
    })
  },
  verifyStores(params) {
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/userCenter/voucher/verifyStores', params, '', 1).then(res => {
      if (res) {
        this.setData({
          storeList: res.result
        })
      }
    }).catch(res => {})
  },
  toggleStore(evt) {
    let dst = evt.target.dataset
    let _this = this
    let isshow = false
    if (dst.type === 'open') {
      isshow = true
      if (!_this.data.storeList.length) {
        _this.verifyStores({
          cardId: dst.card,
          shopId: _this.data.shopId || app.globalData.shopId
        })
      }
    }
    _this.setData({
      storeSlideUp: isshow
    })
  },
  closeSlide() {
    this.setData({
      slideUp: false,
      isShow:true,
      showCar:true
    })
  },
  togNum(evt) {
    let _this = this
    let _data = _this.data
    let dst = evt.target.dataset
    let _type = parseInt(dst.type)
    let _num = _data.shopNum
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.teamInfo.stock) : _data.teamInfo.stock
    let limit = _data.teamShopInfo.limitNumber
    if (limit > 0) {
      max = Math.min(max, limit)
    }
    if (_type === 1) {
      _num = _num < max ? ++_num : max
    } else {
      _num = _num <= 1 ? _num : --_num
    }
    _this.setData({
      shopNum: _num
    })
  },
  numChange(evt) {
    let _this = this
    let _data = _this.data
    let _v = evt.detail.value
    _this.setData({
      shopNum: _v
    })
  },
  iptBlur(evt) {
    let _this = this
    let _data = _this.data
    let _v = parseInt(evt.detail.value || 1)
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.teamInfo.stock) : _data.teamInfo.stock
    let limit = _data.teamShopInfo.limitNumber
    if (limit > 0) {
      max = Math.min(max, limit)
    }
    if (_v > max) {
      _v = max
    }
    _this.setData({
      shopNum: _v
    })
  },
  gotoMyOrder() {
    wx.navigateTo({
      url: '/pages/teamshop/myOrder/myOrder'
    })
  },
  onShareAppMessage(res) {
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/teamshop/productDetail/productDetail?storeId=' + _data.storeId + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + (_data.activityId || app.globalData.activityId || '') + '&activityType=12&goodsId=' + (_data.goodsId || app.globalData.goodsId) + '&teamId=' + (_data.teamInfo.teamId || _data.teamId)
    return {
      title: '跟我一起' + _data.teamInfo.price + '元团' + _data.teamInfo.goodsName,
      path: _url,
      imageUrl: app.globalData.imgUrl,
      success: function(res) {
        // 转发成功
        _this.setData({
          shareSlideUp: false
        })
      },
      fail: function(res) {
        _this.setData({
          shareSlideUp: false
        })
      }
    }
  },
  showCommission: function(opt) {
    let {
      commission
    } = opt.currentTarget.dataset
    if (this.data.goodsDetail.attributeType !== 0) {
      if (commission === 'show') {
        this.setData({
          comBtn: true
        })
      } else {
        this.setData({
          comBtn: false
        })
      }
    }
  },
  toChat(e) {
    let _this = this
    let empObj = _this.data.empObj
    let phone = empObj.storePhone
    if (phone) {
      wx.showModal({
        title: '门店电话',
        content: 'phone',
        showCancel: false,
        success: function(res) {}
      })
      return
    }
    let ev = JSON.stringify(e.currentTarget.dataset)
    wx.navigateTo({
      url: '/pages/chat/chat?goodsInfo=' + encodeURIComponent(ev) + '&name=' + empObj.empName,
    })
  },
  unReadMsgCount() { //临时聊天查询未读消息数量 - 以及保存顾问信息
    let _this = this
    let _global = app.globalData
    let _url = `${_global.lkBaseUrl}/el-imfans-linke-api/miniChat/unReadMsgCount`
    let params = {
      hyId: _global.hyUserId,
      empId: _global.empId || '',
      shopId: _global.shopId,
      storeId: _global.storeId,
      flag: 2,
      isNeedEmpInfo: 2
    }
    utils.$http(_url, params, 'POST').then(res => {
      let _rst = res.result
      if (_rst) {
        _this.setData({
          empObj: _rst
        })
        console.log(_this.data.empObj)
      }
      utils.globalShowTip(false)
    }).catch(res => {})
  },
  //分享生成海报以及分享到微信或企业微信
  toShare() {
    this.setData({
      shareSlideUp: true
    })
  },
  toCancel() {
    this.setData({
      shareSlideUp: false
    })
  },
  toPoster() {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      sessionId: _global.sessionKey
    }
    let url = `${_global.baseUrl}/emallMiniApp/goods/getGoodsFilePaths/${_global.shopId}/${_data.goodsId}`
    utils.$http(url, params).then(res => {
      if (res && res.result) {
        utils.globalShowTip(false)
        let _res = res.result
        _this.setData({
          posterPath: _res.filePath,
          shareSlideUp: false,
          posterSlideUp: true
        })
      }
    }).catch(res => {})
  },
  saveImg() {
    let {
      posterPath
    } = this.data
    wx.downloadFile({
      url: posterPath,
      success: function(res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function(res) {
            wx.showToast({
              title: '保存成功',
              icon: "none"
            })
            this.setData({
              posterSlideUp: false
            })
          }
        })
      }
    })
  },
  cancelPoster() {
    this.setData({
      posterSlideUp: false
    })
  },
  stopScorll() {
    return
  },
  //点击播放按钮，封面图片隐藏,播放视频
  toPlay(e) {
    this.videoCtx = wx.createVideoContext('myVideo')
    this.videoCtx.play()
    this.setData({
      pauseVideo: true
    })
  },
  //点击播放详情视频
  toPlayDetail(e) {
    this.videoCtx = wx.createVideoContext('myDetailVideo')
    this.videoCtx.play()
    this.setData({
      detailPlay: true
    })
  },
  continuePlay(e) {
    let _this = this
    let _dst = e.currentTarget
    let myVideo = wx.createVideoContext('myVideo')
    let myDetailVideo = wx.createVideoContext('myDetailVideo')
    if (_dst.id === 'myVideo') {
      if (myDetailVideo) {
        myDetailVideo.pause()
      }
      _this.setData({
        isExit: true
      })
    }
    if (_dst.id === 'myDetailVideo' && myVideo) {
      myVideo.pause()
    }
  },
  swiperChange(e) {
    let {
      current
    } = e.detail
    let {
      isShowImg,
      videoObj
    } = this.data
    let sidx = e.detail.current + 1
    if (videoObj.hasGoodsVideo) {
      if (current == 0) {
        isShowImg = false
      } else {
        isShowImg = true
      }
      sidx = e.detail.current
    }
    this.setData({
      sidx: sidx,
      isShowImg: isShowImg
    })
  },
  goBack() {
    this.videoCtx = wx.createVideoContext('myVideo')
    this.setData({
      pauseVideo: false
    })
    this.videoCtx.pause()
  }
})