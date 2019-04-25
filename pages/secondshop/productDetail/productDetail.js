const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    shopNum: 1, //商品数量
    optionList: [], //商品属性list
    attrLinkList: [], //SKUID列表
    goodsDetail: {}, //商品详情信息
    yhTxt: '', //商品优惠
    seckillGood: {}, // 秒杀信息
    showSku: {},
    freight: '', //运费
    slideUp: false,
    storeSlideUp: false,
    shareSlideUp: false, //分享弹窗 
    posterSlideUp: false, //生成海报保存到相册弹框 
    interval: null,
    countHtml: '',
    priceHtml: '',
    cacheSkuId: '',
    richTxt: '',
    skuList: [],
    limitNum: '', // 限购数
    behaviorId: '', //浏览足迹id
    isShowImg: true, //是否显示轮播图
    hasGoodsVideo: false,
    hasDetailVideo: false,
    videoObj: {},
    sidx: 1,
    detailPlay: false,
    pauseVideo: false,
    isShow:true,
    showCar: true
  },
  onLoad(opt) {
    let _this = this
    if (opt) {
      _this.setData({
        storeId: opt.storeId || '',
        shopId: opt.shopId || '',
        activityId: opt.activityId || '',
        activityType: opt.activityType || 7,
        timeStatus: opt.timeStatus || '',
        goodsId: opt.goodsId || '',
        userType: app.globalData.userType //根据userType显示佣金
      })
    }
    let _global = app.globalData
    _this.setData({
      memberFlag: _global.memberFlag,
      isIpx: _global.isIpx
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
  toHome:function(){
    wx.switchTab({
      url: '/pages/home/home',
    })
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
    let _this = this
    _this.setData({
      slideUp: false,
      isShow:true,
      showSku: {},
      showCar:true
    })
    app.checkUserId(_this.initData)
  },
  onHide() {
    let {
      goodsId,
      behaviorId
    } = this.data
    if (behaviorId) {
      _this.reanderZjLeave(goodsId)
    }
  },
  initData() {
    this.getShopDetail()
  },
  getShopDetail() {
    utils.globalShowTip(true)
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId,
      goodsId: _data.goodsId
    }
    let url = `${_global.baseUrl}/seckill-miniapp/activity/goods/detail/${params.shopId}/${params.storeId}/${params.activityId}/${params.goodsId}`
    utils.$http(url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopDetRender(res)
      }
    }).catch(res => {})
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
        return false
      }
      let gid = _rst.seckillGood.goodsId || _data.goodsId //商品ID
      let _price = _rst.seckillGood.priceDouble.toString().split('.')
      let memberPrice
      if (_rst.memberPriceDouble) {
        memberPrice = _rst.memberPriceDouble.toString().split('.')
      }
      _rst.seckillGood.startTime = utils.getTime(_rst.seckillGood.startTime)
      _this.setData({
        goodsId: gid,
        activityId: _rst.seckillGood.activityId,
        goodsDetail: _rst.goodsDetail || {},
        seckillGood: _rst.seckillGood || {},
        priceHtml: _price,
        memberPrice: memberPrice || '',
        memberLevel: _rst.memberLevel,
        memberRate: _rst.memberRate
      })
      _this.getGoodsVideo(_rst)
      _this.data.interval = setInterval(() => {
        if (_this.data.seckillGood.countDownSeconds >= 0) {
          _this.countDown(--_this.data.seckillGood.countDownSeconds)
        }
      }, 1000)
      let _sid = app.globalData.shopId
      let _storeId = app.globalData.storeId
      let baseId = _rst.goodsDetail.baseId
      let syncId = _rst.goodsDetail.syncId
      let stockFormId = _rst.goodsDetail.stockFormId || ''
      let attributeType = _rst.goodsDetail.attributeType || 0
      let activityId = _data.activityId
      let activityType = _data.activityType || 7
      let activityPrice = _rst.seckillGood.price
      _this.getEnvironment()
      _this.setProductPvuv()
      _this.getReduce(gid)
      _this.reanderZj(gid)
      _this.unReadMsgCount()
      _this.queryGoodsSkuBrokerage({ //查询商品sku店员销售佣金
        shopId: _sid,
        storeId: _storeId,
        goodsId: gid,
        stockFormId: stockFormId,
        attributeType: attributeType,
        activityId: activityId,
        activityType: activityType,
        activityPrice: activityPrice
      })
      _this.searchFreight({ //根据baseId查询运费
        shopId: _sid,
        storeId: _storeId,
        goodsBaseId: baseId
      })
      _this.searchYouhui({ //查询优惠信息 
        shopId: _sid,
        storeId: _storeId,
        activityId: _data.activityId || app.globalData.activityId,
        goodsId: gid,
      })
      _this.getContents({ //查询图文详情
        shopId: _sid,
        storeId: _storeId,
        goodsSyncId: syncId
      })
      _this.getSkuTree({ // 查询sku树
        shopId: _sid,
        storeId: _storeId,
        goodsId: gid
      })
      if (_this.data.timeStatus === 'false') {
        _this.getLimitNum({ // 查询限购数
          shopId: _sid,
          storeId: _storeId,
          activityId: _data.activityId || app.globalData.activityId,
          goodsId: gid,
          buyerId: app.globalData.buyerId
        })
      }
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
  reanderZj(goodsId) { //用户浏览足迹
    let _this = this
    let _data = this.data
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
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/goods/detail/entry/' + params.shopId + '/' + params.storeId + '/' + params.goodsId, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          behaviorId: res.result
        })
      }
    }).catch(error => {
      //utils.globalShowTip(false)
    })
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
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/goods/detail/leave/' + params.shopId + '/' + params.storeId + '/' + params.goodsId + '/' + params.behaviorId, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
      }
    }).catch(error => {})
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
  setProductPvuv() { // 保存商品pvuv
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let param = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      goodsId: _data.goodsId
    }
    let url = `${_global.baseUrl}/emallMiniApp/commons/setProductPvuv/${param.shopId}/${param.storeId}/${param.goodsId}`
    utils.$http(url, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        //_this.getShopDetail()
      }
    }).catch(res => {
      //utils.globalShowTip(false)
    })

  },
  countDown(num) {
    let _this = this
    _this.data.seckillGood.countDownSeconds = num
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
  queryGoodsSkuBrokerage(params) {
    let _this = this
    let url = '/emallMiniApp/goods/detail/queryGoodsSkuBrokerage/' + params.shopId + '/' + params.storeId + '/' + params.goodsId
    utils.$http(app.globalData.baseUrl + url, params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderBrokerage(res)
      }
    }).catch(res => {})
  },
  renderBrokerage(res) {
    if (res) {
      let rst = res.result
      this.setData({
        brokerage: rst
      })
    }
  },
  searchFreight(params) {
    let _this = this
    let url = '/emallMiniApp/goods/freight/' + params.shopId + '/' + params.storeId + '/' + params.goodsBaseId
    utils.$http(app.globalData.baseUrl + url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderFreight(res)
      }
    }).catch(res => {})
  },
  renderFreight(res) {
    if (res) {
      let rst = res.result
      this.setData({
        freight: rst
      })
    }
  },
  searchYouhui(params) {
    let _this = this
    let url = `/emallMiniApp/goods/detail/discounts/${params.shopId}/${params.storeId}/${params.goodsId}`
    utils.$http(app.globalData.baseUrl + url, {
      activityId: params.activityId,
      activityType: 7
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
  getContents(params) {
    let _this = this
    let url = '/emallMiniApp/goods/detail/contents/' + params.shopId + '/' + params.storeId + '/' + params.goodsSyncId
    utils.$http(app.globalData.baseUrl + url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderCnt(res)
      }
    }).catch(res => {})
  },
  renderCnt(res) {
    if (res) {
      this.setData({
        pictxt: res.result.replace(/<img[ \s]/g, '<img class="maxImg" ')
      })
    }
  },
  getSkuTree(params) {
    let _this = this
    let url = '/emallMiniApp/goods/detail/skuTree/' + params.shopId + '/' + params.storeId + '/' + params.goodsId
    utils.$http(app.globalData.baseUrl + url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderSkuTree(res)
      }
    }).catch(res => {
      console.log(res)
    })
  },
  renderSkuTree(res) {
    let arry = []
    let skuArry = []
    if (res) {
      let _rst = res.result
      for (let item in _rst.skuIdMap) {
        arry.push({
          key: item,
          skuId: _rst.skuIdMap[item]
        })
      }
      for (let item in _rst.skuMap) {
        skuArry.push(_rst.skuMap[item])
      }
      this.setData({
        optionList: _rst.showAttributeList,
        skuList: skuArry,
        attrLinkList: arry
      })
    }
  },
  getLimitNum(params) {
    let _this = this
    let url = '/seckill-miniapp/activity/goods/buyLimit/' + params.shopId + '/' + params.storeId + '/' + params.activityId + '/' + params.goodsId + '/' + params.buyerId
    utils.$http(app.globalData.baseUrl + url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderLimitNum(res)
      }
    }).catch(res => {})
  },
  renderLimitNum(res) {
    if (res) {
      this.setData({
        limitNum: res.result.buyLimit
      })
    }
  },
  selectAttr(evt) {
    let dst = evt.currentTarget.dataset
    let idx = dst.list
    let sidx = dst.sidx
    let _list = this.data.optionList
    let _attrLink = this.data.attrLinkList //返回的skuMap
    if ((_list[idx].cur || sidx == 0) && _list[idx].cur === sidx) {
      _list[idx].cur = ''
      this.eachList(_list)
    } else {
      _list[idx].cur = sidx
    }
    let isAll = false
    _list.forEach((itm) => {
      if (itm.cur !== '') {
        isAll = true
      }
    })
    let _sku = [] //最终选择的属性项
    if (isAll) {
      let _arr = [] //用户选择的对应项的skuId
      //包含已选属性arr
      let attArr = []
      let str = '' //当前选择属性的skuMap
      _list.forEach((itm) => {
        if (itm.cur || itm.cur === 0) {
          _arr.push(itm.attributeOptionList[itm.cur].optionId)
        }
      })
      str = _arr.join('@')
      _sku = _attrLink.filter((item) => {
        return item.key === str
      })
      if (_list.length === (_arr.length + 1) || _list.length === _arr.length) {
        _attrLink.forEach((item, index) => {
          let itemArr = item.key.split('@')
          if (utils.isContained(itemArr, _arr) || utils.minus(itemArr, _arr).length == 1) {
            attArr.push(item.skuId)
          }
        })
        let skuStock = [] //库存为0的属性
        this.data.skuList.forEach((item, index) => {
          if (attArr.indexOf(item.skuId) > -1) {
            if (item.stock === 0) {
              console.log(item)
              skuStock.push(item.skuId)
            }
          }
        })
        if (skuStock.length) { //拼接数组          
          let keyArr = [] //sku拼接对象skuMap对应库存为0的key值
          _attrLink.forEach((item, index) => {
            if (skuStock.indexOf(item.skuId) > -1) {
              keyArr.push(item.key)
            }
          })
          let optionId = []
          keyArr.forEach((item, index) => {
            let skuArr = item.split('@')
            let skuStr = utils.minus(skuArr, _arr)[0]
            optionId.push(skuStr)
          })
          _list.forEach((item, index) => {
            item.attributeOptionList.forEach((sitem, sindex) => {
              if (optionId.indexOf(sitem.optionId) > -1) {
                sitem.stock = true
              } else {
                sitem.stock = false
              }
            })
          })
        } else {
          this.eachList(_list)
        }
      } else {
        this.eachList(_list)
      }
    } else {
      this.eachList(_list)
    }
    let showSkuArry = this.data.skuList.filter(item => {
      if (_sku.length) {
        return item.skuId === _sku[0].skuId
      }
    })
    this.setData({
      optionList: _list,
      showSku: showSkuArry[0] || {}
    })
  },
  //遍历不置灰
  eachList: function(_list) {
    _list.forEach(function(item, index) {
      item.attributeOptionList.forEach(function(sitem, sindex) {
        sitem.stock = false
      })
    })
  },
  gotoOffer(evt) {
    this.setData({
      slideUp: true,
      pauseVideo: false,
      detailPlay: false,
      isShow:false,
      showCar:false
    })
  },
  setActivityClick() {
    let _this = this
    let _data = _this.data
    let param = {
      activityId: _data.activityId || app.globalData.activityId,
      buyerId: app.globalData.buyerId
    }
    let url = `${app.globalData.baseUrl}/seckill-miniapp/activity/setActivityClick`
    utils.$http(url, param, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        console.log(res)
      }
    }).catch(res => {
      console.log(res)
    })
  },
  gotoOrder(evt) {
    let _this = this
    let _data = _this.data
    let _skuId = _data.showSku.skuId ? _data.showSku.skuId : _data.skuList[0].skuId
    let _rem = parseInt(_data.showSku.stock)
    let formId = evt.detail.formId
    _this.setActivityClick()
    if (_this.data.optionList.length) {
      if (!_data.showSku.skuId) {
        wx.showModal({
          title: '温馨提示',
          content: '请选择商品属性！',
          success: function(res) {},
          showCancel: false
        })
        return false
      }
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
      number: _this.data.shopNum,
      skuId: _skuId,
      shopId: _data.shopId || app.globalData.shopId,
      activityId: _data.activityId,
      storeId: _data.storeId || app.globalData.storeId,
      goodsId: _data.goodsId
    })
  },
  orderVerify(params) {
    let url = `${app.globalData.baseUrl}/seckill-miniapp/ordered/verify/${params.shopId}/${params.storeId}/${params.activityId}/${params.goodsId}/${params.skuId}`
    utils.$http(url, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.orderVerifyRender(res)
      }
    }).catch(res => {})
  },
  orderVerifyRender(res) {
    let _data = this.data
    app.saveFormIdSecond(_data.formId)
    wx.navigateTo({
      url: '/pages/secondshop/orderInfor/orderInfor?skuId=' + _data.cacheSkuId + '&buyerId=' + app.globalData.buyerId + '&goodsId=' + (_data.goodsId || app.globalData.goodsId) + '&number=' + _data.shopNum + '&activityId=' + (_data.activityId || app.globalData.activityId) + '&storeId=' + (_data.storeId || app.globalData.storeId)
    })
  },
  verifyStores(params) {
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/userCenter/voucher/verifyStores', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.verifyStoresRender(res)
      }
    }).catch(res => {})
  },
  verifyStoresRender(res) {
    let _this = this
    _this.setData({
      storeList: res.result
    })
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
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.goodsDetail.stock) : _data.goodsDetail.stock
    let limit = _data.seckillGood.limitNum || 0
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
    this.setData({
      shopNum: evt.detail.value
    })
  },
  iptBlur(evt) {
    let _this = this
    let _data = _this.data
    let _v = parseInt(evt.detail.value || 1)
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.goodsDetail.stock) : _data.goodsDetail.stock
    let limit = _data.seckillGood.limitNum
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
      url: '/pages/mine/myOrder/myOrder'
    })
  },
  onShareAppMessage(res) {
    let _empId = app.getEmpId()
    let {
      activityId,
      goodsId,
      seckillGood,
      goodsDetail
    } = this.data
    let {
      storeId,
      imgUrl
    } = app.globalData
    let _url = '/pages/secondshop/productDetail/productDetail?storeId=' + storeId + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + activityId + '&activityType=7&goodsId=' + goodsId
    return {
      title: seckillGood.priceDouble + '元秒杀' + goodsDetail.goodsName,
      path: _url,
      imageUrl: imgUrl,
      success: function(res) {
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
    let {
      empObj
    } = this.data
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
    let {
      baseUrl,
      shopId,
      sessionKey
    } = app.globalData
    let url = `${baseUrl}/emallMiniApp/goods/getGoodsFilePaths/${shopId}/${this.data.goodsId}`
    utils.$http(url, {
      sessionId: sessionKey
    }).then(res => {
      if (res && res.result) {
        utils.globalShowTip(false)
        let _res = res.result
        this.setData({
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
  stopScroll() {
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
    let {
      id
    } = e.currentTarget.dataset
    let myVideo = wx.createVideoContext('myVideo')
    let myDetailVideo = wx.createVideoContext('myDetailVideo')
    if (id === 'myVideo') {
      if (myDetailVideo) {
        myDetailVideo.pause()
      }
      this.setData({
        isExit: true
      })
    }
    if (id === 'myDetailVideo' && myVideo) {
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