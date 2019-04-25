const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isShowTextArea: true,
    formId: '',
    elTeamshopTeamDetailVo: {},
    orderSubmitResponse: {},
    userAddr: {},
    orderGoodsInfo: {},
    orderInfo: {},
    request: {},
    elFreightVo: {},
    storeAddrInfo: {},
    elExpressDeliveryVo: {}, //快递配送设置买家姓名手机号码
    storeDeliveryVo: {}, //用户到店设置买家姓名手机号码
    shopDeliveryVo: {}, //商家配送设置买家姓名和手机号码
    lmsg: '', //买家留言
    buyerName: '',
    buyerPhone: '',
    teamId: '',
    storeDistr: false, //是否配有门店自提
    userDistr: false, //是否配有快递配送
    isGotStore: true, //是否自提
    couponChked: false, //是否选择优惠券
    coupon: {},
    storeSlideUp: false,
    cashCouponFee: 0, //优惠抵扣
    busiModelStore: {},
    cityStores: [], //到店门店列表
    sendType: 2, //配送方式：1=快递配送，2=门店自提
    monthsList: [],
    daysList: [],
    multiArray: [],
    multiIndex: [],
    shopMonthsList: [],
    shopDaysList: [],
    shopHoursList: [],
    dayShopList: [],
    hourShopList: [],
    multiShopArray: [],
    multiShopIndex: [],
    isTimeOver: false, //是否过期
    calcAmount: {},
    fansIntegral: 0, // 粉丝积分
    integral: {}, // 积分信息
    shopInfo:{}, //商家信息
    isUseIntegral: true, //是否使用积分
    integralValue: false, //积分输入不是0或空值
    longitude: '',
    latitude: ''
  },
  onLoad(opt) {
    let _this = this
    wx.getLocation({ success: res => this.setData({ longitude: res.longitude, latitude: res.latitude }) })
    if (opt) {
      _this.setData({
        cashCouponFee: 0,
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
      if (_this.data.sendType === 3) {
        _this.checkAddr(app.globalData.sendAddObj.addId || '').then(() => { })
      }
      _this.setData({
        userAddr: app.globalData.sendAddObj
      })
    }
    if (app.globalData.selectNo) { //卡券券号
      _this.setData({
        couponChked: false,
        cashCouponFee: 0,
        voucherCode: ''
      })
      app.globalData.voucherCode = ''
      this.calcAmount()
    }
    console.log(app.globalData.voucherCode)
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
  // 获取门店信息
  getShopInfo() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId
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
  sendTab(evt) {
    let _dst = evt.target.dataset
    let _type = parseInt(_dst.type)
    let _data = this.data
    let _iscash = _data.orderInfo.isCashCoupon
    let _isIntegral = _data.isIntegral
    let isGot = true
    if (_type === 1) {  //快递配送
      isGot = false
      this.setData({
        isIntegral: _isIntegral,
        sendType: _type,
        isCashCoupon: _iscash,
        isGotStore: isGot
      })
      if (_iscash) {
        this.getCalcVoucher()
      } else {
        this.setData({
          voucherCode: ''
        })
        this.calcFulReduce()
      }
    } else if (_type === 3){ //商家配送
      if (_dst.addrid && _dst.addrid !== '') {
        this.checkAddr(_dst.addrid).then(() => {
          let _obj = this.getYouhuiObj(_data.orderGoodsInfo)
          _iscash = _obj.isCashCoupon
          _isIntegral = _obj.isIntegral
          this.setData({
            isIntegral: _isIntegral,
            sendType: _type,
            isCashCoupon: _iscash,
            isGotStore: isGot
          })
          if (_iscash) {
            this.getCalcVoucher()
          } else {
            this.setData({
              voucherCode: ''
            })
            this.calcFulReduce()
          }
        })
      } else {
        this.setData({
          sendType: _type
        })
      }
    } else { //门店自提
      this.setData({
        isIntegral: _isIntegral,
        sendType: _type,
        isGotStore: isGot,
        isCashCoupon: _iscash
      })
      if (_iscash) {
        this.getCalcVoucher()
      } else {
        this.setData({
          voucherCode: ''
        })
        this.calcFulReduce()
      }
    }
  },
  getOrderInfor() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      activityId: _data.activityId,
      goodsId: _data.goodsId,
      teamId: _data.teamId,
      skuId: _data.skuId,
      'number': _data.prdNum,
      buyerId: app.globalData.buyerId
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/confirmOrder', params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.orderInforRender(res)
        _this.getShopInfo()
      }
    }).catch(res => {
      //utils.globalShowTip(false)
    })
  },
  orderInforRender(res) {
    let _this = this
    let _data = _this.data
    if (res && res.result) {
      let _rst = res.result
      //提货时间
      let monthArr = []
      let dayList = []
      // 收货时间
      let shopMonthArr = []
      let shopDayList = []
      let shopHourList = []
      // 设置提货时间
      if (_rst.storeDeliveryVo && _rst.storeDeliveryVo.monthDays) {
        let _stDate = JSON.parse(_rst.storeDeliveryVo.monthDays)[0]
        if (_stDate) {
          _this.setData({
            isTimeOver: false
          })
          monthArr = _stDate.storeMonthList
          let monthDay = _stDate.monthDays
          _data.monthsList = monthArr
          _data.monthDay = monthDay
          dayList = _this.renderMonthDays(monthArr, monthArr[0], monthDay)
          _data.daysList = dayList
        } else {
          _this.setData({
            isTimeOver: true
          })
        }
      }
      // 设置商家配送收货时间
      if (_rst.shopDelivery && _rst.shopDelivery.deliverMonthDayList) {
        let _shopDate = _rst.shopDelivery.deliverMonthDayList[0]
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
      _this.setData({
        businessModel: _rst.businessModel,
        multiArray: [monthArr, dayList],
        multiShopArray: [shopMonthArr, shopDayList, shopHourList],
        selectStoreIds: _rst.selectStoreIds || [],
        orderGoodsInfo: _rst.orderGoodsInfo,
        elFreightVo: _rst.elFreightVo || {},
        orderInfo: _rst.orderInfo,
        request: _rst.request,
        storeDistr: _rst.storeDistr, // 是否设置门店自提
        isGotStore: _rst.storeDistr,
        userDistr: _rst.userDistr, // 是否设置快递配送
        shopDistr: _rst.shopDistr, //是否设置商家配送
        sendType: _rst.storeDistr ? 2 : (_rst.userDistr ? 1 : (_rst.shopDistr ? 3: '')),
        storeDeliveryVo: _rst.storeDeliveryVo || {},
        elExpressDeliveryVo: _rst.elExpressDeliveryVo || {},
        shopDeliveryVo: _rst.shopDelivery || {},
        storeAddrInfo: _rst.storeAddrInfo,
        userAddr: _rst.userAddr || {},
        isCashCoupon: _rst.orderInfo.isCashCoupon, //是否可以使用现金券
        fansIntegral: _rst.orderInfo.fansIntegral, //粉丝拥有积分数
        isIntegral: _rst.orderInfo.isIntegral //是否使用积分
      })
      //如果支持积分 调用积分的接口  获取积分相关信息
      if (_data.isIntegral) {
        _this.calcIntegral()
      }
      if (_data.isCashCoupon) {//获取可使用的代金券
        _this.getCalcVoucher()
      } 
      if (!_data.isIntegral && !_data.isCashCoupon) {//计算满减        
        _this.calcFulReduce()
      }
    }
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
  renderMonthDays(sMonthList, val, cache) {
    let sDaysList = []
    let _this = this
    for (let i = 0; i < sMonthList.length; i++) {
      if (sMonthList[i] === val) {
        sDaysList = this.getMonthDays(cache, sMonthList[i])
        break
      }
    }
    /*
    _this.setData({
      multiIndex: [_this.data.multiIndex[0] || 0, _this.data.multiIndex[1] || 0]
    })
    */
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
  getFirstStore() {
    let _this = this
    let _data = _this.data
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      businessModel: _data.businessModel, //0:直营模式,1加盟模式
      selectStoreIds: _data.selectStoreIds
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/getStoresByGoodsId', params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.firstStoreRender(res)
      }
    })
  },
  firstStoreRender(res) {
    console.log(res)
    if (res && res.result) {
      this.setData({
        busiModelStore: res.result
      })
    }
  },
  findArrival(page) { //到店门店查询
    let _this = this
    let _data = _this.data
    let { longitude, latitude } = _data
    let params = {
      shopId: _data.shopId || app.globalData.shopId,
      storeId: app.globalData.storeId,
      businessModel: _data.businessModel, //0:直营模式,1加盟模式
      goodsids: _data.goodsId,
      selectStoreIds: _data.selectStoreIds || [],
      circlename: '', //商圈名
      city: '', //城市id
      latlng: '', //维度
      pageNo: page || 1,
      longitude,
      latitude
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/store/list/location/' + params.shopId + '/' + params.storeId + '/' + params.pageNo, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.arrivalRender(res)
      }
    })
  },
  arrivalRender(res) {
    console.log(res)
    let _this = this
    if (res) {
      let _rst = res.result
      _this.setData({
        cityStores: _rst
      })
    }
  },
  submitHandle(evt) {
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
      teamId: _data.teamId,
      'number': _data.prdNum,
      delivery: _data.sendType,
      lmsg: _data.lmsg || gData.lmsg || '',
      voucherCode: _data.voucherCode ? _data.voucherCode : (_data.couponChked ? _data.coupon.voucherCode : ''),
      integral: !_data.isUseIntegral ? 0 : (_data.integral.integral || 0),
      empId: gData.empId || '',
      businessModel: _data.businessModel,
      addressId: gData.addId || _data.userAddr.addId || '',
      storeDisNo: gData.shareEmpId || ''
    }
    if (param.delivery === 2) {
      if (_data.isTimeOver) {
        wx.showModal({
          title: '温馨提示',
          content: '所有商品门店自提都过期，请选择其它配送方式！',
          success(res) {

          },
          showCancel: false
        })
        return false
      }
      if (_data.businessModel === 0) {
        let arriStoreId = _data.busiModelStore.id
        if (!arriStoreId || arriStoreId === '') {
          wx.showModal({
            title: '温馨提示',
            content: '请选择提货门店！',
            success(res) {},
            showCancel: false
          })
          return false
        }
        param.arriveStoreId = arriStoreId
        param.arriveStoreName = _data.busiModelStore.name
      } else {
        param.arriveStoreId = _data.storeAddrInfo.storeId
        param.arriveStoreName = _data.storeAddrInfo.storeName
      }
      let arrivalDate = (_data.multiArray[0][_data.multiIndex[0]] || '') + (_data.multiArray[1][_data.multiIndex[1]] || '')
      if (arrivalDate === '') {
        wx.showModal({
          title: '温馨提示',
          content: '请选择提货日期！',
          success(res) {

          },
          showCancel: false
        })
        return false
      }
      param.userStoreTime = arrivalDate
      if (_data.storeDeliveryVo.requiredUserName) {
        let _name = _data.buyerName
        if (!_this.chkName(_name)) {
          return false
        }
        param.userName = _name
      }
      if (_data.storeDeliveryVo.requiredPhone) {
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
          success(res) {
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
    } else if (param.delivery === 3) {//商家配送
      if (_data.isTimeOver) {
        wx.showToast({
          title: '商品配送时间过期，请选择其它配送方式！',
          icon: 'none',
          mask: true,
          duration: 1500
        })
        return false
      }
      if (_data.orderGoodsInfo.checkResult && _data.orderGoodsInfo.checkResult === 2) {
        wx.showModal({
          title: '温馨提示',
          content: '商品的配送范围与您的地址不匹配！',
          success(res) { },
          showCancel: false
        })
        return false
      }
      if (!param.addressId || param.addressId === '') {
        wx.showToast({
          title: '请添加收货人地址！',
          icon: 'none',
          mask: true,
          duration: 1500
        })
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/mine/address/new/new',
          })
        }, 1500)
        return false
      }
      let shopDateTime = (_data.multiShopArray[0][_data.multiShopIndex[0]] || '') + (_data.multiShopArray[1][_data.multiShopIndex[1]] || '') + ' ' + (_data.multiShopArray[2][_data.multiShopIndex[2]] || '')
      if (shopDateTime === ' ') {
        wx.showModal({
          title: '温馨提示',
          content: '请选择收货时间！',
          success(res) {},
          showCancel: false
        })
        return false
      }
      param.shopDateTime = shopDateTime
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
    utils.$http(gData.baseUrl + '/elshop/teamShop/submitOrder', params, 'POST').then(res => {
      if (res && res.result) {
        const returnCode = parseInt(res.code);
        if (returnCode !== 0) {
          utils.globalShowTip(false)
          _this.data.isSubmitting = false
        } else if (returnCode === 0) { //1表示接口成功调用
          _this.data.isSubmitting = false
          _this.submitRender(res)
        }
      }
    }).catch(err => {
      _this.data.isSubmitting = false
    })
  },
  submitRender(res) {
    let _this = this
    let _rst = res.result
    let _data = _this.data
    if (_rst) {
      if (_rst.amountDouble && _rst.amountDouble > 0) {
        _this.setData({
          orderNo: _rst.orderNo
        })
        //_this.toPay(_rst)
        wx.redirectTo({
          url: `/pages/payment/payment?orderNo=${_rst.orderNo || _data.orderNo}`
        })
      } else {
        _this.setData({
          teamId: _rst.teamId
        })
        _this.toTeamDet(_rst)
      }
    }
  },
  toTeamDet(obj) {
    wx.navigateTo({
      url: '/pages/teamshop/teamDetail/teamDetail?teamId=' + (obj.teamId || this.data.teamId)
    })
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
        success(res) {},
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
        success(res) {},
        showCancel: false
      })
      return false
    }
    return true
  },
  toggleStore(evt) {
    let dst = evt.currentTarget.dataset
    let _this = this
    let isshow = false
    if (_this.data.businessModel === 1) {
      console.log(_this.data.businessModel)
      return false
    }
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
    console.log(dst)
    if (dst) {
      this.setData({
        busiModelStore: dst.item,
        storeSlideUp: false,
        isShowTextArea: true
      })
    }
  },
  bindMultiPickerChange(e) {
    let _this = this
    let _dst = e.currentTarget.dataset
    let _time = _dst.time
    let _data = _this.data
    let _val = e.detail.value
    if (_time === 'shop') {
      _this.setData({
        multiShopIndex: _val,
        cacheShopIndex: _val
      })
    } else if (_time === 'store') {
      console.log(_time)
      this.setData({
        multiIndex: e.detail.value,
        cacheIdex: e.detail.value
      })
    }
  },
  bindMultiPickerColumnChange(e) {
    let _this = this
    let _data = _this.data
    let _val = e.detail.value
    let _dst = e.currentTarget.dataset
    let _time = _dst.time
    if (_time === 'shop') {//设置商家配送时间
      _data.multiShopIndex[e.detail.column] = _val
      switch (e.detail.column) {
        case 0:
          let _dayArr = _this.renderMonthDays(_data.shopMonthsList, _data.shopMonthsList[_val], _data.shopDaysList)
          _this.setData({
            multiShopArray: [_data.shopMonthsList, _dayArr, _this.data.hourShopList],
            multiShopIndex: [_val, _data.multiShopIndex[1] || 0, 0]
          })
          break
        case 1:
          _this.setData({
            multiShopIndex: [_data.multiShopIndex[0] || 0, _val, _data.multiShopIndex[2] || 0]
          })
          break
        case 2:
          _this.setData({
            multiShopIndex: [_data.multiShopIndex[0] || 0, _data.multiShopIndex[1] || 0, _val]
          })
          break
        default:
          break
      }
    } else if (_time === 'store') {//设置提货日期
      _data.multiIndex[e.detail.column] = _val
      switch (e.detail.column) {
        case 0:
          let _dayArr = _this.renderMonthDays(_data.monthsList, _data.monthsList[_val], _data.monthDay)
          _this.setData({
            multiArray: [_data.monthsList, _dayArr],
            multiIndex: [_val, _data.multiIndex[1] || 0]
          })
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
      let _dayArr = _this.renderMonthDays(_data.monthsList, _data.monthsList[((_data.cacheIdex && _data.cacheIdex[0]) ? _data.cacheIdex[0] : 0)], _data.monthDay)
      _this.setData({
        multiArray: [_data.monthsList, _dayArr],
        multiIndex: _data.cacheIdex || []
      })
    }
  },
  multiCancel(e) {
    let _this = this
    let _data = _this.data
    console.log(_data.cacheIdex)
    let _dayArr = _this.renderMonthDays(_data.monthsList, _data.monthsList[((_data.cacheIdex && _data.cacheIdex[0]) ? _data.cacheIdex[0] : 0)], _data.monthDay)
    _this.setData({
      multiArray: [_data.monthsList, _dayArr],
      multiIndex: _data.cacheIdex || []
    })
  },
  getYouhuiObj(goods) {//获取商品对应的支持活动优惠信息
    let _this = this
    let _data = _this.data
    let _type = _data.sendType
    let _goods = goods || {}
    let obj = {
      isCashCoupon: false,
      isIntegral: false
    }
    if (_type === 3) {//商家配送
      if (_goods.checkResult === 0 && !_goods.shopDeliverTimeExpire && _goods.isCashCoupon) {
        obj.isCashCoupon = true
      }
      if (_goods.checkResult === 0 && !_goods.shopDeliverTimeExpire && _goods.isExchange) {
        obj.isIntegral = true
      }
    } else if (_type === 2) {//到店自提
      if (!_goods.storeDeliverTimeExpire && _goods.isCashCoupon) {
        obj.isCashCoupon = true
      }
      if (!_goods.storeDeliverTimeExpire && _goods.isExchange) {
        obj.isIntegral = true
      }
    }
    return obj
  },
  // 1.使用积分
  calcIntegral() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId:gData.shopId,
      storeId: gData.storeId,
      buyerId: gData.buyerId,
      goodsId: _data.goodsId,
      skuId: _data.skuId,
      number: _data.prdNum,
      activityId: _data.activityId || '',
      teamId: _data.teamId || ''
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/confirm/calcIntegral', params, 'POST').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        _this.setData({
          integral: res.result
        })
        if (_data.userAddr && _data.userAddr.addId) {
          _this.caclFreight(_data.userAddr.addId)
        } else {
          _this.calcAmount()
        }
      }
    })
  },
  //2.获取用户代金券
  getCalcVoucher() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: gData.buyerId,
      goodsId: _data.goodsId,
      skuId: _data.skuId,
      number: _data.prdNum,
      activityId: _data.activityId || '',
      teamId: _data.teamId || '',
      auto: 1
    }
    let url = url = `${gData.baseUrl}/elshop/teamShop/confirm/vouchers`
    utils.$http(url, params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderGetVouchers(res)
      }
    })
  },
  renderGetVouchers(res) {
    let _rst = res.result
    if (_rst) {
      this.setData({
        voucherCode: _rst.cardCode
      })
      this.calcVoucher()
    } else {
      this.calcFulReduce()
    }
  },
  //3.使用代金券
  calcVoucher() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: gData.buyerId,
      goodsId: _data.goodsId,
      skuId: _data.skuId,
      number: _data.prdNum,
      activityId: _data.activityId || '',
      teamId: _data.teamId || '',
      delivery: _data.sendType,
      addressId: gData.addId || _data.userAddr.addId,
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0,
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/confirm/calcVoucher', params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.voucherRender(res)
      }
    })
  },
  voucherRender(res) {
    if (res && res.result) {
      this.setData({
        coupon: res.result,
        cashCouponFee: res.result.cashCouponFee
      })
      this.calcAmount()
    }
  },
  // 4.计算满减金额
  calcFulReduce() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: gData.buyerId,
      delivery: _data.sendType,
      addressId: gData.addId || _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/confirm/calcFulReduce', params, 'POST').then(res => {
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
      let _redMoneyVos = _data.fulReduce.elFulReduceMoneyVos
      if (_redMoneyVos && _redMoneyVos.length) {
        let htmlM = ''
        let htmlS = ''
        let htmlJ = ''
        let htmlY1 = ''
        let htmlZ1 = ''
        let htmlY2 = ''
        let htmlZ2 = ''
        for (let i = 0; i < _redMoneyVos.length; i++) {
          let fulReduce = _redMoneyVos[i]
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
      if ((_data.sendType === 1 || _data.sendType === 3) && (_data.userAddr.addId || app.globalData.addId)) {//商家配送或快递配送时
        this.caclFreight() //计算订单运费
      } else {
        this.calcAmount()
      }
    }
  },
  //5.计算运费
  caclFreight(addrId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      delivery: 1,
      addressId: addrId || gData.addId || _data.userAddr.addId,
      buyerId: _data.buyerId || gData.buyerId
    }
    utils.$http(app.globalData.baseUrl + '/elshop/teamShop/calcFreight', params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.freightRender(res)
      }
    })
  },
  freightRender(res) {
    if (res && res.result) {
      this.setData({
        elFreightVo: res.result.elFreightVo
      })
    }
    this.calcAmount()
    app.globalData.updateAddr = false
  },
  //6.计算相关金额
  calcAmount(addrId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId:gData.buyerId,
      delivery: _data.sendType,
      addressId: addrId || gData.addId || _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(gData.baseUrl + '/elshop/teamShop/confirm/calcAmount', params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          calcAmount: res.result
        })
      }
    })
  },
  // 商家配送检测地址
  checkAddr(addId) {
    let _prm = new Promise((resolve, reject) => {
      let _this = this
      let _data = _this.data
      let gData = app.globalData
      // 路径上的参数
      let params = {
        shopId: gData.shopId,
        storeId: gData.storeId
      }
      // ?携带参数
      let datas = {
        addId: addId || _data.userAddr.addId,
        goodsIdList: _data.goodsId || gData.goodsId || ''
      }
      utils.$http(app.globalData.baseUrl + '/elshop/address/checkRegionTemplate/' + params.shopId + '/' + params.storeId, datas, 'POST').then(res => {
        if (res) {
          if (_this.checkAddrRender(res, addId)) {
            resolve()
          } else {
            reject()
          }
        }
      }).catch(() => { })
    })
    return _prm
  },
  checkAddrRender(res, addId) {
    let _this = this
    let _data = _this.data
    let _goods = _data.orderGoodsInfo
    console.log(_goods)
    if (res && res.result) {
      let arr = res.result
      let _part = arr.filter((item) => {//过滤部分匹配的商品
        return item.checkResult === 1
      })
      if (_part.length) {
        wx.navigateTo({
          url: `/pages/mine/address/new/new?deliveryType=${_data.navTab}&goodsId=${_data.goodsId}`
        })
        return false
      }
      let _pass = arr.filter((item) => {//获取匹配的商品
        return item.checkResult === 0
      })
      if (_pass.length) {//存在匹配的商品时，获取地址详情
        this.checkAddrDeatil(addId)
      }
      _goods.checkResult = arr[0].checkResult
      utils.globalShowTip(false)
      _this.setData({
        orderGoodsInfo: _goods,
        isCashCoupon: _this.getCashCoupon(_goods)
      })
    }
    return true
  },
  checkAddrDeatil(addId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      addId: addId || _data.userAddr.addId,
      shopId: gData.shopId,
      storeId: gData.storeId
    }
    utils.$http(app.globalData.baseUrl + '/elshop/address/detail/' + params.shopId + '/' + params.storeId + '/' + params.addId).then(res => {
      if (res && res.result) {
        _this.setData({
          userAddr: res.result
        })
        _this.caclFreight(res.result.addId)
      }
    })
  },
  getCashCoupon(goods) {//下单的商品是否支持优惠券抵扣
    let _this = this
    let _data = _this.data
    let _type = _data.navTab
    let _goods = goods || {}
    let isCashCoupon = false
    if (_type === 3) {//商家配送
      if (_goods.checkResult === 0 && !_goods.shopDeliverTimeExpire && _goods.isCashCoupon) {
        isCashCoupon = true
      }
    } else if (_type === 2) {//到店自提
      if (!_goods.storeDeliverTimeExpire && _goods.isCashCoupon) {
        isCashCoupon = true
      }
    }
    return isCashCoupon
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
  //积分输入框提交
  submitIntegral(e) {
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
  },
})