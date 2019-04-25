const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isShowTextArea: true,
    formId: '',
    userAddr: {},
    orderGoodsInfo: {},
    orderInfo: {},
    request: {},
    elFreightVo: {}, // 运费
    storeAddrInfo: {}, //门店地址
    elExpressDeliveryVo: {}, //快递配送设置买家姓名手机号码
    shopDeliveryVo: {}, //商家配送设置买家姓名和手机号码
    storeDeliveryVo: {}, //用户到店设置买家姓名手机号码
    buyerName: '',
    buyerPhone: '',
    lmsg: '', //买家留言
    fulReduce: {}, // 满减金额信息
    storeDistr: false, //是否配有门店自提
    userDistr: false, //是否配有快递配送
    isGotStore: false, //是否有商家配送
    couponChked: true, //是否选择优惠券
    isSelfGoods: false, // 是否自提
    coupon: {},
    storeSlideUp: false,
    cashCouponFee: 0, //优惠抵扣
    fansIntegral: 0, // 粉丝积分
    integral: {}, // 积分信息
    isUseIntegral: true, //是否使用积分
    integralValue: false, //积分输入不是0或空值
    busiModelStore: {},
    cityStores: [], //到店门店列表
    vouchersList: [], // 代金券列表
    monthsList: [],
    daysList: [],
    multiArray: [],
    multiIndex: [],
    // 配送时间设置
    shopMonthsList: [],
    shopDaysList: [],
    shopHoursList: [],
    dayShopList: [],
    hourShopList: [],
    multiShopArray: [],
    multiShopIndex: [],
    isTimeOver: false, //是否过期
    shopInfo: {}, // 商家信息
    sendType: [],
    navTab: '', // 1快递配送 2用户到店 3商家配送
    calcAmount: {}, // 相关运费对象
    longitude: '',
    latitude: ''
  },
  onLoad(opt) {
    let _this = this
    wx.getLocation({
      success: res => this.setData({
        longitude: res.longitude,
        latitude: res.latitude
      })
    })
    if (opt) {
      _this.setData({
        activityId: opt.activityId,
        goodsId: opt.goodsId,
        storeId: opt.storeId,
        buyerId: opt.buyerId,
        prdNum: opt.number,
        teamId: opt.teamId || '',
        skuId: opt.skuId
      })
      app.checkUserId(_this.getOrderInfor)
    }
  },
  onShow() {
    let _this = this
    if (app.globalData.updateAddr) {
      _this.caclFreight()
      let navTab = _this.data.navTab
      if (navTab === 3) {
        _this.checkAddr(app.globalData.sendAddObj.addId || '').then(() => { })
      }
      _this.setData({
        userAddr: app.globalData.sendAddObj
      })
    }
    if (app.globalData.selectNo) {
      _this.setData({
        couponChked: false,
        cashCouponFee: 0,
        voucherCode: ''
      })
      app.globalData.voucherCode = '' //代金券失效
      _this.calcFulReduce()
    }
    if (app.globalData.voucherCode) {
      _this.setData({
        couponChked: true
      })
      _this.calcVoucher()
    } else if (_this.data.cashCouponFee === 0) {
      _this.setData({
        couponChked: false
      })
    }
    app.globalData.selectNo = ''
  },
  // 切换配送方式
  changeTab(evt) {
    let _dst = evt.target.dataset
    let _type = parseInt(_dst.type)
    let _data = this.data
    let _iscash = false
    let _this = this
    let _isIntegral = _data.isIntegral
    let _isself = false
    let _needname = false //是否需要输入姓名
    let _needphone = false //是否需要输入手机号码
    _data.navTab = _type
    if (_type === 1) { //快递配送
      _iscash = _data.orderInfo.isCashCoupon
      _needname = _data.elExpressDeliveryVo.requiredUserName
      _needphone = _data.elExpressDeliveryVo.requiredPhone
      _this.setData({
        isIntegral: _isIntegral,
        navTab: _type,
        isSelfGoods: _isself,
        flagName: _needname,
        flagPhone: _needphone,
        isCashCoupon: _iscash
      })
      if (_iscash) {
        _this.getCalcVoucher()
      } else {
        _this.setData({
          voucherCode: ''
        })
        _this.calcFulReduce()
      }
    } else if (_type === 3) { //商家配送
      if (_dst.addrid && _dst.addrid !== '') {
        _needname = _data.shopDeliveryVo.requiredUserName
        _needphone = _data.shopDeliveryVo.requiredPhone
        _this.checkAddr(_dst.addrid).then(() => {
          let _obj = _this.getYouhuiObj(_data.orderGoodsInfo)
          _iscash = _obj.isCashCoupon
          _isIntegral = _obj.isIntegral
          _this.setData({
            isIntegral: _isIntegral,
            navTab: _type,
            isSelfGoods: _isself,
            flagName: _needname,
            flagPhone: _needphone,
            isCashCoupon: _iscash
          })
          if (_iscash) {
            _this.getCalcVoucher()
          } else {
            _this.setData({
              voucherCode: ''
            })
            _this.calcFulReduce()
          }
        })
      }
    } else if (_type === 2) { //判断是否为门店自提
      _needname = _data.storeDeliveryVo.requiredUserName
      _needphone = _data.storeDeliveryVo.requiredPhone
      _isself = 2
      let _obj = _this.getYouhuiObj(_data.orderGoodsInfo)
      _iscash = _obj.isCashCoupon
      _isIntegral = _obj.isIntegral
      _this.setData({
        isIntegral: _isIntegral,
        navTab: _type,
        isSelfGoods: _isself,
        flagName: _needname,
        flagPhone: _needphone,
        isCashCoupon: _iscash
      })
      if (_iscash) {
        _this.getCalcVoucher()
      } else {
        _this.setData({
          voucherCode: ''
        })
        _this.calcFulReduce()
      }
    }
  },
  getYouhuiObj(arr) { //获取商品对应的支持活动优惠信息
    let _this = this
    let _data = _this.data
    let _type = _data.navTab
    let _arr = arr || []
    let obj = {
      isCashCoupon: false,
      isIntegral: false
    }
    _arr.forEach((item) => { //storeDeliverMonthDay:用户到店时间、shopDeliverMonthDay：商家配送时间
      if (_type === 3) { //商家配送
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isCashCoupon) {
          obj.isCashCoupon = true
        }
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isExchange) {
          obj.isIntegral = true
        }
      } else if (_type === 2) { //到店自提
        if (!item.storeDeliverTimeExpire && item.isCashCoupon) {
          obj.isCashCoupon = true
        }
        if (!item.storeDeliverTimeExpire && item.isExchange) {
          obj.isIntegral = true
        }
      }
    })
    return obj
  },
  // 商家配送检测地址
  checkAddr(addId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId:gData.storeId
    }
    let _params = {
      addId: addId || _data.userAddr.addId,
      goodsIdList: _data.goodsId || gData.goodsId
    }
    return new Promise(function (resolve, reject) {
      utils.$http(app.globalData.baseUrl + '/emallMiniApp/address/checkRegionTemplate/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
        if (res) {
          if (_this.checkAddrRender(res, addId)) {
            resolve()
          } else {
            reject()
          }
        }
      }).catch(() => { })
    })
  },
  checkAddrRender(res, addId) {
    let _this = this
    let _data = _this.data
    let _goods = _data.orderGoodsInfo
    if (res && res.result) {
      let arr = res.result
      let _part = arr.filter((item) => { //过滤部分匹配的商品
        return item.checkResult === 1
      })
      if (_part.length) {
        wx.navigateTo({
          url: `/pages/mine/address/new/new?deliveryType=${_data.navTab}&goodsId=${_data.goodsId}`
        })
        return false
      }
      let _pass = arr.filter((item) => { //获取匹配的商品
        return item.checkResult === 0
      })
      if (_pass.length) { //存在匹配的商品时，获取地址详情
        this.checkAddrDeatil(addId)
      }
      _goods.forEach((item, idx) => { //遍历下单的商品列表并插入地址匹配信息
        arr.forEach((sitem) => {
          if (sitem.goodsId === item.goodsId) {
            item.checkResult = sitem.checkResult
          }
        })
      })
      utils.globalShowTip(false)
      _this.setData({
        orderGoodsInfo: _goods,
        isCashCoupon: _this.getCashCoupon(_goods)
      })
    }
    return true
  },
  getCashCoupon(arr) { //遍历下单的商品中是否支持优惠券抵扣
    let _this = this
    let _data = _this.data
    let _type = _data.navTab
    let _arr = arr || []
    let isCashCoupon = false
    _arr.forEach((item) => { //storeDeliverMonthDay:用户到店时间、shopDeliverMonthDay：商家配送时间
      if (_type === 3) { //商家配送
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isCashCoupon) {
          isCashCoupon = true
        }
      } else if (_type === 2) { //到店自提
        if (!item.storeDeliverTimeExpire && item.isCashCoupon) {
          isCashCoupon = true
        }
      }
    })
    return isCashCoupon
  },
  checkAddrDeatil(addId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      addId: addId || _data.userAddr.addId,
      shopId:gData.shopId,
      storeId:gData.storeId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/address/detail/' + params.shopId + '/' + params.storeId + '/' + params.addId).then(res => {
      if (res && res.result) {
        _this.setData({
          userAddr: res.result
        })
        this.caclFreight(res.result.addId)
      }
    })
  },
  // 使用积分
  calcIntegral() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId:gData.storeId
    }
    utils.$http(app.globalData.baseUrl + '/seckill-miniapp/ordered/calcIntegral/' + params.shopId + '/' + params.storeId, {}, 'POST').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        _this.setData({
          integral: res.result
        })
        if (_data.isCashCoupon) {
          _this.getCalcVoucher()
        } else {
          _this.calcFulReduce()
        }
      }
    })
  },
  getCalcVoucher() { // 获取用户代金券
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let url = url = `${gData.baseUrl}/emallMiniApp/ordered/vouchers/${gData.shopId}/${gData.storeId}`
    utils.$http(url, {
      auto: 1
    }).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderVouchers(res)
      }
    })
  },
  renderVouchers(res) {
    let _rst = res.result
    if (_rst) {
      console.log(_rst)
      this.setData({
        voucherCode: _rst.cardCode
      })
      this.calcVoucher()
    } else {
      this.calcFulReduce()
    }
  },
  //使用代金券
  calcVoucher() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId:gData.storeId
    }
    let _params = {
      delivery: _data.navTab,
      addressId: _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(app.globalData.baseUrl + '/seckill-miniapp/ordered/calcVoucher/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
      if (res) {
        _this.voucherRender(res)
      }
    })
  },
  voucherRender(res) {
    utils.globalShowTip(false)
    if (res && res.result) {
      this.setData({
        coupon: res.result,
        cashCouponFee: res.result.cashCouponFee
      })
      this.calcFulReduce()
    }
  },
  // 计算满减金额
  calcFulReduce() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId:gData.storeId
    }
    let _params = {
      delivery: _data.navTab,
      addressId: _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(app.globalData.baseUrl + '/seckill-miniapp/ordered/calcFulReduce/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
      if (res) {
        _this.fulReduceRender(res)
      }
    })
  },
  fulReduceRender(res) {
    utils.globalShowTip(false)
    if (res && res.result) {
      this.setData({
        fulReduce: res.result
      })
      let _data = this.data
      if (_data.fulReduce.elFulReduceMoneyVos && _data.fulReduce.elFulReduceMoneyVos.length) {
        let htmlM = ''
        let htmlS = ''
        let htmlJ = ''
        let htmlY1 = ''
        let htmlZ1 = ''
        let htmlY2 = ''
        let htmlZ2 = ''
        for (let i = 0; i < _data.fulReduce.elFulReduceMoneyVos.length; i++) {
          let fulReduce = _data.fulReduce.elFulReduceMoneyVos[i]
          let fullUnit = fulReduce.fullUnit
          let preWay = fulReduce.preWay;
          if (fullUnit === 0 && preWay === 0) {
            htmlM = Number(fulReduce.realFullMoney)
            htmlJ = Number(fulReduce.actualMoney)
            htmlY1 = Number(fulReduce.moneyReductionDouble)
          } else if (fullUnit == 0 && preWay == 1) {
            htmlM = Number(fulReduce.realFullMoney)
            htmlJ = Number(fulReduce.actualMoney)
            htmlZ1 = Number(fulReduce.canDiscount)
          } else if (fullUnit == 1 && preWay == 0) {
            htmlS = Number(fulReduce.realFullCount)
            htmlJ = Number(fulReduce.actualMoney)
            htmlY2 = Number(fulReduce.moneyReductionDouble)
          } else if (fullUnit == 1 && preWay == 1) {
            htmlS = Number(fulReduce.realFullCount)
            htmlJ = Number(fulReduce.actualMoney)
            htmlZ2 = Number(fulReduce.canDiscount)
          }
        }
        this.setData({
          htmlM: htmlM,
          htmlS: htmlS,
          htmlJ: htmlJ,
          htmlY1: htmlY1,
          htmlY2: htmlY2,
          htmlZ1: htmlZ1,
          htmlZ2: htmlZ2
        })
      }
      if ((_data.navTab === 1 || _data.navTab === 3) && (_data.userAddr.addId || app.globalData.addId)) { //商家配送或快递配送时
        this.caclFreight() //计算订单运费
      } else {
        this.calcAmount()
      }
    }
  },
  // 计算订单运费
  caclFreight(addrId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId
    }
    let _params = {
      delivery: _data.navTab,
      addressId: addrId || gData.addId || _data.userAddr.addId,
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    if (_this.data.navTab !== 2) { //不是门店自提
      if (!_params.addressId) {
        wx.showModal({
          title: '温馨提示',
          content: '请选择收货地址！',
          success: function (res) {

          },
          showCancel: false
        })
        return false
      }
      utils.$http(app.globalData.baseUrl + '/seckill-miniapp/ordered/calcFreight/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
        if (res) {
          _this.freightRender(res)
        }
      })
    } else {
      this.calcAmount()
    }
  },
  freightRender(res) {
    utils.globalShowTip(false)
    if (res && res.result) {
      this.setData({
        elFreightVo: res.result
      })
      // 计算相关费用
      this.calcAmount()
    }
    app.globalData.updateAddr = false
  },
  calcAmount(addrId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId: gData.storeId
    }
    let _params = {
      delivery: _data.navTab,
      addressId: addrId || gData.addId || _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(app.globalData.baseUrl + '/seckill-miniapp/ordered/calcAmount/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
      if (res) {
        _this.amountRender(res)
      }
    })
  },
  amountRender(res) {
    utils.globalShowTip(false)
    if (res && res.result) {
      this.setData({
        calcAmount: res.result
      })
    }
  },
  getOrderInfor() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId:app.globalData.shopId,
      storeId:app.globalData.storeId,
      activityId: _data.activityId || app.globalData.activityId,
      goodsId: _data.goodsId || app.globalData.goodsId,
      skuId: _data.skuId || app.globalData.skuId,
    }
    let _params = {
      number: parseInt(_data.prdNum)
    }
    let url = `${app.globalData.baseUrl}/seckill-miniapp/ordered/confirm/${params.shopId}/${params.storeId}/${params.activityId}/${params.goodsId}/${params.skuId}`
    utils.$http(url, _params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.orderInforRender(res)
        _this.getShopInfo() // 获取商家信息
      }
    }).catch(error => {
      console.log(error)
    })
  },
  orderInforRender(res) {
    let _this = this
    let _data = _this.data
    if (res && res.result) {
      let _rst = res.result
      // 设置到店时间
      let monthArr = []
      let dayList = []
      // 设置收货时间
      let shopMonthArr = []
      let shopDayList = []
      let shopHourList = []
      // 处理配送方式
      for (let item in _rst.deliveryPayWayMap) {
        _data.sendType.push(parseInt(item))
        if (item === '1') {
          _this.setData({
            userDistr: true
          }) // 有快递配送
        }
        if (item === '2') {
          _this.setData({
            storeDistr: true
          }) // 有用户到店
        }
        if (item === '3') {
          _this.setData({
            isGotStore: true
          }) // 有商家配送
        }
      }
      // 设置提货时间
      if (_rst.storeDeliveryVo && _rst.storeDeliveryVo.monthDays) {
        let _stDate = JSON.parse(_rst.storeDeliveryVo.monthDays)[0]
        if (_stDate) {
          _this.setData({
            isStoreTimeOver: false
          })
          monthArr = _stDate.storeMonthList
          let monthDay = _stDate.monthDays
          _data.monthsList = monthArr
          _data.monthDay = monthDay
          dayList = _this.renderMonthDays(monthArr, monthArr[0], monthDay)
          _data.daysList = dayList
        } else {
          _this.setData({
            isStoreTimeOver: true
          })
        }
      }
      // 设置商家配送 收货时间
      if (_rst.shopDeliveryVo && _rst.shopDeliveryVo.deliverMonthDayList) {
        let _shopDate = _rst.shopDeliveryVo.deliverMonthDayList[0]
        if (_shopDate) {
          _this.setData({
            isTimeOver: false
          })
          shopMonthArr = _shopDate.deliverMonths
          let monthDay = _shopDate.deliverMonthDays
          let hourList = _shopDate.deliverMonthDayTimes
          _data.shopMonthsList = shopMonthArr
          _data.shopDaysList = monthDay
          _data.shopHoursList = hourList
          shopDayList = _this.renderMonthDays(shopMonthArr, shopMonthArr[0], monthDay)
          shopHourList = _this.renderHours(hourList)
          _data.dayShopList = shopDayList
          _data.hourShopList = shopHourList
        } else {
          _this.setData({
            isTimeOver: true
          })
        }
      }
      let storeIds = []
      if (_rst.storeDeliveryVo) {
        storeIds = _rst.storeDeliveryVo.selectStoreIds
      }
      _this.setData({
        navTab: _data.sendType[0],
        multiArray: [monthArr, dayList],
        multiShopArray: [shopMonthArr, shopDayList, shopHourList],
        selectStoreIds: storeIds,
        orderGoodsInfo: _rst.elLinecarVoList,
        elFreightVo: _rst.freightDouble, //运费
        orderInfo: _rst,
        //request: _rst.request,
        storeDeliveryVo: _rst.storeDeliveryVo || {},
        elExpressDeliveryVo: _rst.elExpressDeliveryVo || {},
        shopDeliveryVo: _rst.shopDeliveryVo || {},
        //storeAddrInfo: _rst.storeAddrInfo,
        userAddr: _rst.elAddressVo || {},
        fansIntegral: _rst.fansIntegral, //粉丝拥有积分数
        isCashCoupon: _rst.isCashCoupon, // 是否使用优惠券
        isSysDelivery: _rst.isSysDelivery, // 是否有系统配送
        isIntegral: _rst.isIntegral, //是否可以使用积分
      })
      // 配送方式默认显示第一种为高亮 如果第一种为门店自提 则做标记
      if (_data.sendType[0] === 2) {
        this.setData({
          flagName: _data.storeDeliveryVo.requiredUserName,
          flagPhone: _data.storeDeliveryVo.requiredPhone
        })
        _this.setData({
          isSelfGoods: 2
        })
      }
      if (_this.data.sendType[0] === 1) {
        this.setData({
          flagName: _data.elExpressDeliveryVo.requiredUserName,
          flagPhone: _data.elExpressDeliveryVo.requiredPhone
        })
      }
      if (_this.data.sendType[0] === 3) {
        this.setData({
          flagName: _data.shopDeliveryVo.requiredUserName,
          flagPhone: _data.shopDeliveryVo.requiredPhone
        })
      }
      //如果支持积分 调用积分的接口  获取积分相关信息
      if (_data.isIntegral) {
        _this.calcIntegral()
      } else if (_data.isCashCoupon) { //获取可使用的代金券
        _this.getCalcVoucher()
      } else { //计算满减
        _this.calcFulReduce()
      }
    }
  },
  // 获取门店信息
  getShopInfo() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId:app.globalData.shopId,
      storeId:app.globalData.storeId
    }
    let url = `${app.globalData.baseUrl}/emallMiniApp/shop/store/base/${params.shopId}/${params.storeId}`
    utils.$http(url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopInforRender(res)
      }
    })
  },
  shopInforRender(res) {
    let _this = this
    if (res) {
      _this.setData({
        shopInfo: res.result
      })
    }
  },
  renderMonthDays(sMonthList, val, cache) {
    let sDaysList = []
    let _this = this
    for (let i = 0; i < sMonthList.length; i++) {
      if (sMonthList[i] === val) {
        sDaysList = this.getMonthDays(cache, sMonthList[i])
        break
      }
    }
    return sDaysList
  },
  getMonthDays(arr, str) {
    let _arr = []
    for (let i = 0; i < arr.length; i++) {
      for (let key in arr[i]) {
        if (str === key) {
          _arr = arr[i][key]
          break
        }
      }
    }
    return _arr
  },
  renderHours(hourList) {
    return this.getHours(hourList)
  },
  getHours(hourList) {
    let _startArr = []
    let _endArr = []
    let _Arr = []
    let str = ''
    _startArr = hourList.split(';')[0].split(',')
    _endArr = hourList.split(';')[1].split(',')
    for (let i = 0; i < _startArr.length; i++) {
      for (let j = 0; j < _endArr.length; j++) {
        if (i === j) {
          str = _startArr[i] + '-' + _endArr[j]
          _Arr.push(str)
        }
      }
    }
    let newArr = _Arr.reverse()
    return newArr
  },
  findArrival(page) { //到店门店查询
    let _this = this
    let _data = _this.data
    let {
      longitude,
      latitude
    } = this.data
    let str = ''
    if (_this.data.selectStoreIds && _this.data.selectStoreIds.length) {
      str = _this.data.selectStoreIds.join(',')
      console.log(str)
    }
    let params = {
      shopId:app.globalData.shopId,
      storeId:app.globalData.storeId,
      pageNo: page || 1
    }
    let _params = {
      goodsIds: _data.goodsId || [],
      storeIds: str,
      city: _data.userAddr.city || '', //城市id
      longitude,
      latitude
    }
    console.log(params)
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/store/list/location/' + params.shopId + '/' + params.storeId + '/' + params.pageNo, _params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.arrivalRender(res)
      }
    })
  },
  arrivalRender(res) {
    let _this = this
    if (res) {
      let _rst = res.result
      _this.setData({
        cityStores: _rst
      })
    }
  },
  submitHandle(evt) {
    let formId = evt.detail.formId
    this.setData({
      formId: formId
    })
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    if (_data.orderNo && _data.orderNo !== '') {
      wx.redirectTo({
        url: `/pages/payment/payment?orderNo=${_data.orderNo}`
      })
      return false
    }
    let param = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: _data.buyerId || gData.buyerId,
      activityId: _data.activityId,
      goodsId: _data.goodsId,
      skuId: _data.skuId,
      formId: formId,
      'number': _data.prdNum,
      delivery: _data.navTab,
      voucherCode: _data.voucherCode ? _data.voucherCode : (_data.couponChked ? _data.coupon.voucherCode : ''),
      addressId: gData.addId || _data.userAddr.addId || '',
      lmsg: _data.lmsg || gData.lmsg || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0,
      storeDisNo: gData.shareEmpId || ''
    }
    let _goods = _data.orderGoodsInfo
    let navTab = _this.data.navTab
    if (navTab == 3) {
      if (_goods.length > 0) {
        _goods.forEach(function (item, index) {
          if (item.checkResult == 2) {
            return
          }
        })
      }
    }
    if (param.delivery === 2) {
      if (_data.isStoreTimeOver) {
        wx.showModal({
          title: '温馨提示',
          content: '所有商品门店自提都过期，请选择其它配送方式！',
          success: function (res) {

          },
          showCancel: false
        })
        return false
      }
      // 判断是否选择门店
      let arriStoreId = _data.busiModelStore.id
      if (!arriStoreId || arriStoreId === '') {
        wx.showModal({
          title: '温馨提示',
          content: '请选择提货门店！',
          success: function (res) { },
          showCancel: false
        })
        return false
      }
      param.arriveStoreId = arriStoreId
      param.arriveStoreName = _data.busiModelStore.name
      let arrivalDate = (_data.multiArray[0][_data.multiIndex[0]] || '') + (_data.multiArray[1][_data.multiIndex[1]] || '')
      if (arrivalDate === '') {
        wx.showModal({
          title: '温馨提示',
          content: '请选择提货日期！',
          success: function (res) {

          },
          showCancel: false
        })
        return false
      }
      param.userStoreTime = arrivalDate
      // 判断买家姓名和手机号是否必填
      if (_data.storeDeliveryVo && _data.storeDeliveryVo.requiredUserName) {
        let _name = _data.buyerName
        if (!_this.chkName(_name)) {
          return false
        }
        param.userName = _name
      }
      if (_data.storeDeliveryVo && _data.storeDeliveryVo.requiredPhone) {
        let _phone = _data.buyerPhone
        if (!_this.chkPhone(_phone)) {
          return false
        }
        param.userTelphone = _phone
      }
    } else if (param.delivery === 1) {
      if (!param.addressId || param.addressId === '') {
        wx.showModal({
          title: '温馨提示',
          content: '请添加收货人地址！',
          success: function (res) {
            wx.navigateTo({
              url: '/pages/mine/address/new/new',
            })
          },
          showCancel: false
        })
        return false
      }
      if (_data.elExpressDeliveryVo.requiredUserName) {
        let _name = _data.buyerName
        if (!_this.chkName(_name)) {
          return false
        }
        param.userName = _name
      }
      if (_data.elExpressDeliveryVo.requiredPhone) {
        let _phone = _data.buyerPhone
        if (!_this.chkPhone(_phone)) {
          return false
        }
        param.userTelphone = _phone
      }
    } else if (param.delivery === 3) {
      if (_data.isTimeOver) {
        wx.showModal({
          title: '温馨提示',
          content: '商品配送时间过期，请选择其它配送方式！',
          success: function (res) {

          },
          showCancel: false
        })
        return false
      }
      if (!param.addressId || param.addressId === '') {
        wx.showModal({
          title: '温馨提示',
          content: '请添加收货人地址！',
          success: function (res) {
            wx.navigateTo({
              url: '/pages/mine/address/new/new',
            })
          },
          showCancel: false
        })
        return false
      }
      if (_data.shopDeliveryVo.requiredUserName) {
        let _name = _data.buyerName
        if (!_this.chkName(_name)) {
          return false
        }
        param.userName = _name
      }
      if (_data.shopDeliveryVo.requiredPhone) {
        let _phone = _data.buyerPhone
        if (!_this.chkPhone(_phone)) {
          return false
        }
        param.userTelphone = _phone
      }
      let shopDateTime = (_data.multiShopArray[0][_data.multiShopIndex[0]] || '') + (_data.multiShopArray[1][_data.multiShopIndex[1]] || '') + ' ' + (_data.multiShopArray[2][_data.multiShopIndex[2]] || '')
      if (shopDateTime === ' ') {
        wx.showModal({
          title: '温馨提示',
          content: '请选择配送时间！',
          success: function (res) {

          },
          showCancel: false
        })
        return false
      }
      param.shopDateTime = shopDateTime
    }
    _this.submitOrder(param)
  },
  submitOrder(params) {
    let _this = this
    let gData = app.globalData
    if (_this.data.isSubmitting) {
      return false
    }
    _this.data.isSubmitting = true
    utils.globalShowTip(true)
    utils.$http(gData.baseUrl + '/seckill-miniapp/ordered/submit/' + params.shopId + '/' + params.storeId, params, 'POST').then(res => {
      if (res && res.result) {
        const returnCode = parseInt(res.code);
        if (returnCode !== 0) {
          utils.globalShowTip(false)
          wx.showModal({
            title: '温馨提示',
            content: res.data.message || '网络异常，请稍后重试！',
            success: function (res) {
              _this.data.isSubmitting = false
            },
            showCancel: false
          })
        } else if (returnCode === 0) { //1表示接口成功调用
          _this.data.isSubmitting = false
          _this.submitRender(res.result)
        }
      }
    }).catch(err => {
      /*
      utils.globalShowTip(false)
      wx.showModal({
        title: '温馨提示',
        content: '订单提交失败，请稍候再试！',
        success: function (res) {
          _this.data.isSubmitting = false
        },
        showCancel: false
      })
      */
    })
  },
  submitRender(res) {
    let _this = this
    let _rst = res
    let _data = _this.data
    if (_rst) {
      _this.setData({
        orderNo: _rst.orderNo
      })
      if (_rst.status === 0) {
        wx.redirectTo({
          url: `/pages/payment/payment?orderNo=${_rst.orderNo || _data.orderNo}`
        })
        //_this.toPay(_rst)
      } else {
        wx.redirectTo({
          url: `/pages/mine/orderDetail/orderDetail?orderNo=${_rst.orderNo || _data.orderNo}`
        })
      }
    }
  },
  buyerPhoneIpt(evt) {
    this.setData({
      buyerPhone: evt.detail.value
    })
  },
  buyerNameIpt(evt) {
    this.setData({
      buyerName: evt.detail.value
    })
  },
  buyerMsgIpt(evt) {
    this.setData({
      lmsg: evt.detail.value
    })
  },
  chkPhone(phone) {
    let _phone = phone.replace(/\s| /g, '')
    if (!_phone.length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入买家手机号码',
        success: function (res) { },
        showCancel: false
      })
      return false
    }
    return true
  },
  chkName(name) {
    let _name = name.replace(/\s| /g, '')
    if (!_name.length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入买家姓名',
        success: function (res) { },
        showCancel: false
      })
      return false
    }
    return true
  },
  toggleStore(evt) {
    let _this = this
    let dst = evt.currentTarget.dataset
    let isshow = false
    if (dst.type === 'open') {
      _this.setData({
        isShowTextArea: false
      })
      isshow = true
      if (!_this.data.cityStores.length) {
        _this.findArrival()
      }
    } else {
      _this.setData({
        isShowTextArea: true
      })
      utils.globalShowTip(false)
    }
    _this.setData({
      storeSlideUp: isshow
    })
  },
  togSubList(evt) {
    let dst = evt.currentTarget.dataset
    let plist = dst.plist
    let pidx = dst.pidx
    plist.forEach((item, idx) => {
      if (idx === pidx) {
        item.open = !item.open
      } else {
        item.open = false
      }
    })
    this.setData({
      cityStores: plist
    })
  },
  selectStore(evt) {
    let dst = evt.currentTarget.dataset
    if (dst) {
      this.setData({
        busiModelStore: dst.item,
        storeSlideUp: false,
        isShowTextArea: true
      })
      utils.globalShowTip(false)
    }
  },
  bindMultiPickerChange(e) {
    console.log(e)
    let _time = e.target.dataset.time
    if (_time === 'shop') {
      this.setData({
        multiShopIndex: e.detail.value,
        cacheShopIndex: e.detail.value
      })
    } else if (_time === 'store') {
      this.setData({
        multiIndex: e.detail.value,
        cacheStoreIndex: e.detail.value
      })
    }
  },
  bindMultiPickerColumnChange(e) {
    console.log(e)
    let _this = this
    let _data = _this.data
    let _val = e.detail.value
    let _time = e.target.dataset.time
    if (_time === 'shop') { //设置商家配送时间
      _data.multiShopIndex[e.detail.column] = _val
      console.log(_data.multiShopIndex)
      switch (e.detail.column) {
        case 0:
          let _dayArr = _this.renderMonthDays(_data.shopMonthsList, _data.shopMonthsList[_val], _data.shopDaysList)
          _this.setData({
            multiShopArray: [_data.shopMonthsList, _dayArr, _this.data.hourShopList],
            multiShopIndex: [_val, _data.multiShopIndex[1] || 0, 0]
          })
          console.log(_this.data.multiShopArray)
          break
        case 1:
          console.log('2---')
          _this.setData({
            multiShopIndex: [_data.multiShopIndex[0] || 0, _val, _data.multiShopIndex[2] || 0]
          })
          console.log(_this.data.multiShopArray)
          break
        case 2:
          console.log('3---')
          _this.setData({
            multiShopIndex: [_data.multiShopIndex[0] || 0, _data.multiShopIndex[1] || 0, _val]
          })
          break
        default:
          break
      }
    } else if (_time === 'store') { //设置提货日期
      _data.multiIndex[e.detail.column] = _val
      console.log(_data.multiIndex)
      switch (e.detail.column) {
        case 0:
          let _dayArr = _this.renderMonthDays(_data.monthsList, _data.monthsList[_val], _data.monthDay)
          console.log(_dayArr)
          _this.setData({
            multiArray: [_data.monthsList, _dayArr],
            multiIndex: [_val, _data.multiIndex[1] || 0]
          })
          console.log(_this.data.multiArray)
          console.log(_this.data.multiIndex)
          break;
        case 1:
          _this.setData({
            multiIndex: [_data.multiIndex[0] || 0, _val]
          })
          break
      }
    }
  },
  multiCancel(e) {
    let _this = this
    let _data = _this.data
    let _time = e.target.dataset.time
    if (_time === 'shop') {
      let _dayArr = _this.renderMonthDays(_data.shopMonthsList, _data.shopMonthsList[((_data.cacheShopIndex && _data.cacheShopIndex[0]) ? _data.cacheShopIndex[0] : 0)], _data.shopDaysList)
      _this.setData({
        multiShopArray: [_data.shopMonthsList, _dayArr, _this.data.hourShopList],
        multiShopIndex: _data.cacheShopIndex || []
      })
    } else if (_time === 'store') {
      let _dayArr = _this.renderMonthDays(_data.monthsList, _data.monthsList[((_data.cacheStoreIndex && _data.cacheStoreIndex[0]) ? _data.cacheStoreIndex[0] : 0)], _data.monthDay)
      _this.setData({
        multiArray: [_data.monthsList, _dayArr],
        multiIndex: _data.cacheStoreIndex || []
      })
    }
  },
  useIntegral(evt) {
    let _this = this
    let dst = evt.currentTarget.dataset
    let isshow = false
    let integral = _this.data.integral //积分相关信息
    let fansIntegral = _this.data.fansIntegral //拥有的积分
    if (fansIntegral < integral.limitIntegral) { //已有积分不满足限制积分数
      wx.showToast({
        title: `积分${integral.limitIntegral}以上才能参与本单抵扣，目前仅有积分${fansIntegral}`,
        icon: 'none',
        mask: true,
        duration: 3000
      })
      return
    }
    if (dst.type === 'open') {
      _this.setData({
        isShowTextArea: false
      })
      isshow = true
    } else {
      _this.setData({
        isShowTextArea: true
      })
      utils.globalShowTip(false)
    }
    _this.setData({
      integraSlideUp: isshow
    })
  },
  radioChange(e) {
    let _this = this
    let value = parseInt(e.detail.value) //0 不使用积分  1使用积分
    if (value === 0) {
      _this.data.integral.integral = 'no'
      _this.setData({
        isUseIntegral: false,
        integral: _this.data.integral,
        integraSlideUp: false,
        isShowTextArea: true
      })
      _this.calcAmount()
    }
    if (value === 1) {
      _this.setData({
        isUseIntegral: true
      })
    }
  },
  bindKeyInput(e) {
    let _this = this
    let value = e.detail.value.trim()
    let integral = _this.data.integral
    if (value === "0") {
      value = parseInt(value)
    }
    if (value) {
      integral.integral = parseInt(value)
      _this.setData({
        integral: integral,
        integralValue: false
      })
    } else {
      _this.setData({
        integralValue: true //输入的是空值或0
      })
    }
  },
  submitIntegral(e) { //积分输入框提交
    let formId = e.detail.formId
    let _this = this
    let integral = _this.data.integral
    let fansIntegral = _this.data.fansIntegral //拥有积分
    let isUseIntegral = _this.data.isUseIntegral //使用积分
    let integralValue = _this.data.integralValue
    app.saveFormIdSecond(formId)
    //积分输入为空  或者 0  或者小于0  或者大于最大可使用积分  或者大于当前已有积分  或者抵扣值大于订单待付金额
    if (isUseIntegral) {
      if (integralValue) {
        wx.showToast({
          title: `输入积分必须大于0`,
          icon: 'none',
          mask: true,
          duration: 2000
        })
        return
      } else {
        if (integral.integral === 'no') {
          wx.showToast({
            title: `输入积分必须大于0`,
            icon: 'none',
            mask: true,
            duration: 2000
          })
          return
        }
        if (integral.integral > integral.maxIntegral) {
          wx.showToast({
            title: `输入积分不能大于订单最大只用积分`,
            icon: 'none',
            mask: true,
            duration: 2000
          })
          return
        }
        if (integral.integral > fansIntegral) {
          wx.showToast({
            title: `输入积分不能大于当前已有积分`,
            icon: 'none',
            mask: true,
            duration: 2000
          })
          return
        }
      }
      _this.calcAmount()
      _this.setData({
        integraSlideUp: false,
        isShowTextArea: true
      })
    }
  }
})