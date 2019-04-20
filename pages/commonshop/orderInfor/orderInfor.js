const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    voucherCode: '',
    isShowTextArea: true,
    formId: '',
    userAddr: {},
    orderGoodsInfo: null,
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
    isUseIntegral: true, // 是否使用积分
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
    shopInfo: {},// 商家信息
    sendType: [],
    navTab: '', // 1快递配送 2用户到店 3商家配送
    calcAmount: {}, // 相关运费对象
    longitude: '',
    latitude: '',
    selfskuId: null, // 当前点击的商品skuId
    selfgoodsId: null, // 当前点击的商品ID
    Iscoupons: false, // 优惠券弹出框是否显示
    VoucherVoList: null, // 后台返回的优惠券数据列表
    couponList: null, //优惠券弹出框展示的数据列表
    isPaidMember: false, // 是否是会员
    IsVoucherCount: false // 是否有优惠券
  },
  onLoad(opt) {
    console.log(opt)
    let _this = this
    wx.getLocation({ success: res => this.setData({ longitude: res.longitude, latitude: res.latitude }) })
    if (opt) {
      _this.setData({
        iscart: parseInt(opt.iscart) || 0,
        goodsId: opt.goodsId || '',
        storeId: opt.storeId || '',
        buyerId: opt.buyerId || '',
        prdNum: opt.number || 0,
        skuId: opt.skuId || '',
        addId: opt.addid || ''
      })
      // app.checkUnionId(_this.getOrderInfor)
    }
  },
  // 优惠券选择按钮
  checkCoupon (e) {
    let { cardcode='', parentId=''} = e.currentTarget.dataset
    console.log(cardcode)
    let that = this, { VoucherVoList, Iscoupons, selfgoodsId, selfskuId } = that.data
    if (!cardcode) return
    // 循环整个优惠券列表
    VoucherVoList.map(Voitem => {
      Voitem.voucherVoList.map(item => {
        // 相同cardCode的优惠券
        if (item.cardCode == cardcode) {
          // 如果没有上级商品ID，就把优惠券设为选中，并添加上级商品ID
          if (!item.parentskuId) {
            item.checked = true
            item.parentskuId = selfskuId
            Iscoupons = false
            that.setData({
              voucherCode: item.cardCode
            })
            // // 防止重复调用
            if (Voitem.skuId == selfskuId) {
              // 使用优惠券
              that.calcVoucher()
            }
          }
        } else {
          // 其余不相同cardCode的优惠券
          // 如果有上级商品ID，
          if (item.parentskuId) {
            // 判断是否是当前上级，如果是，就先取消掉
            if (item.parentskuId === selfskuId) {
              item.checked = false
              item.parentskuId = ''
            }
            // 如果不是当前上级的，就不用取消也不用设置
          } else {
            // 如果没有上级ID，也需要取消掉
            item.checked = false
            item.parentskuId = ''
          }
        }
      })
    })
    console.log(VoucherVoList)
    that.setData({VoucherVoList,Iscoupons})
  },
  //使用优惠券
  calcVoucher() {
    let _this = this
    let _data = _this.data
    let { shopId, storeId, baseUrl } = app.globalData
    console.log(_data.voucherCode)
    let _params = {
      delivery: _data.navTab,
      addressId: _data.userAddr.addId || '',
      voucherCode: _data.voucherCode || '',
      goodsId: _data.selfgoodsId,
      skuId: _data.selfskuId
      // integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0 积分兑换-暂时不用
    }
    utils.$http(baseUrl + '/emallMiniApp/ordered/calcVoucher2/' + shopId + '/' + storeId, _params, 'POST').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let { orderGoodsInfo } = _data
        // 把获取到的优惠券价格赋值到商品上
        orderGoodsInfo.map(item => {
          if (item.skuId == _data.selfskuId) {
            item.cashCouponFee = res.result.voucherFee
          }
        })
        _this.setData({
          coupon: res.result,
          orderGoodsInfo: orderGoodsInfo
        })
        // 计算满减
        _this.calcFulReduce()
      }
    })
  },
  // 获取优惠券列表
  getCoupons () {
    let that = this, { orderGoodsInfo } = that.data
    let { baseUrl, shopId, storeId} = app.globalData
    // 订单商品goodsId集合
    console.log(orderGoodsInfo)
    let ids = []
    orderGoodsInfo.map(item => {
      ids.push({
        goodsId: item.goodsId,
        skuId: item.skuId,
      })
    })
    let _data = { goods: JSON.stringify(ids)||'' }
    // loadGoodsSkuVouchers
    utils.$http(`${baseUrl}/emallMiniApp/ordered/loadGoodsSkuVouchers/${shopId}/${storeId}`, _data, 'POST').then(res => {
      let _rst = res && res.result && res.result.goodsVoucherVoList
      if (_rst) {
        utils.globalShowTip(false)
        console.log(_rst)
        _rst.map(item => {
          item.voucherVoList.map(items => {
            items.checked = false
            items.Amounts = items.conditionAmount && (items.conditionAmount / 100).toFixed(2)
          })
        })
        // 判断商品下属是否有优惠券
        orderGoodsInfo.map(item => {
          let rstList = _rst.filter(items => item.skuId === items.skuId)
          item.IsVoList = rstList[0].voucherVoList.length || false
        })
        that.setData({
          VoucherVoList: _rst,
          IsVoucherCount: res.result && res.result.voucherCount || false,
          orderGoodsInfo: orderGoodsInfo
        })
        console.log(orderGoodsInfo)
        console.log(res)
      }
    }).catch(() => { })
  },
  // 优惠券弹出按钮
  couponsClick (e) {
    let { gdsid, skuid} = e.currentTarget.dataset
    let that = this, { VoucherVoList } = that.data
    console.log(skuid)
    let selfCoupon = VoucherVoList && VoucherVoList.filter(item => item.skuId === skuid)
    console.log(selfCoupon)
    that.setData({
      couponList: selfCoupon && selfCoupon[0] && selfCoupon[0].voucherVoList
    })
    this.setData({
      selfgoodsId: gdsid,
      selfskuId: skuid,
      Iscoupons: true
    })
  },
  NoCoupons() {
    this.setData({
      Iscoupons: false
    })
  },
  onShow() {
    let _this = this
    let {
      storeId,
      shopId,
      baseUrl,
      sendAddObj,
      updateAddr
    } = app.globalData
    if (updateAddr) {
      if (_this.data.navTab == 3) {
        _this.checkAddr(sendAddObj.addId || '').then(() => { })
      }
      _this.setData({
        userAddr: sendAddObj,
        addId: sendAddObj.addId
      })
      app.checkUnionId(_this.getOrderInfor)
    } else {
      utils.$http(baseUrl + '/emallMiniApp/address/getDefault/' + shopId + '/' + storeId, {}).then(res => {
        if (res) {
          utils.globalShowTip(false)
          let _rst = res.result
          console.log(_rst)
          if (_rst) {
            _this.setData({
              addId: _rst.addId,
              userAddr: _rst
            })
            if (_this.data.navTab == 3) {
              _this.checkAddr(_rst.addId || '').then(() => { })
            }
            app.checkUnionId(_this.getOrderInfor)
          } else {
            wx.showModal({
              title: '完善地址',
              content: '抱歉, 请完善地址信息后再来购买~',
              success: (e) => {
                if (e.confirm) {
                  wx.navigateTo({
                    url: '../../mine/address/select/select',
                  })
                } else if (e.cancel) {
                  console.log(e.cancel)
                  wx.navigateBack({delta: 1})
                }
              }
            })
          }
        }
      }).catch((res) => { })
    }
    if (app.globalData.selectNo) {//选择不使用优惠券的情况
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
        couponChked: true,
        voucherCode: app.globalData.voucherCode
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
    let _isIntegral = _data.isIntegral
    let _isself = false
    let _needname = false  //是否需要输入姓名
    let _needphone = false  //是否需要输入手机号码
    _data.navTab = _type
    if (_type === 1) { //快递配送
      _iscash = _data.orderInfo.isCashCoupon
      _needname = _data.elExpressDeliveryVo.requiredUserName
      _needphone = _data.elExpressDeliveryVo.requiredPhone
      this.setData({
        isIntegral: _isIntegral,
        navTab: _type,
        isSelfGoods: _isself,
        flagName: _needname,
        flagPhone: _needphone,
        isCashCoupon: _iscash
      })
      if (_iscash) {
        this.getCoupons()
      } else {
        this.setData({
          voucherCode: ''
        })
        this.calcFulReduce()
      }
    } else if (_type === 3) { //商家配送      
      if (_dst.addrid && _dst.addrid !== '') {
        _needname = _data.shopDeliveryVo.requiredUserName
        _needphone = _data.shopDeliveryVo.requiredPhone
        this.checkAddr(_dst.addrid).then(() => {
          let _obj = this.getYouhuiObj(_data.orderGoodsInfo)
          _iscash = _obj.isCashCoupon //this.getCashCoupon(_data.orderGoodsInfo)
          _isIntegral = _obj.isIntegral
          this.setData({
            isIntegral: _isIntegral,
            navTab: _type,
            isSelfGoods: _isself,
            flagName: _needname,
            flagPhone: _needphone,
            isCashCoupon: _iscash
          })
          if (_iscash) {
            this.getCoupons()
          } else {
            this.setData({
              voucherCode: ''
            })
            this.calcFulReduce()
          }
        })
      } else {
        this.setData({
          navTab: _type
        })
      }
    } else if (_type === 2) { //判断是否为门店自提
      _needname = _data.storeDeliveryVo.requiredUserName
      _needphone = _data.storeDeliveryVo.requiredPhone
      _isself = 2
      let _obj = this.getYouhuiObj(_data.orderGoodsInfo)
      _iscash = _obj.isCashCoupon //this.getCashCoupon(_data.orderGoodsInfo)
      _isIntegral = _obj.isIntegral
      this.setData({
        isIntegral: _isIntegral,
        navTab: _type,
        isSelfGoods: _isself,
        flagName: _needname,
        flagPhone: _needphone,
        isCashCoupon: _iscash
      })
      if (_iscash) {
        this.getCoupons()
      } else {
        this.setData({
          voucherCode: ''
        })
        this.calcFulReduce()
      }
    }
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
      let _params = {
        addId: addId || _data.userAddr.addId,
        goodsIdList: _data.goodsId || gData.goodsId || ''
      }
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
    return _prm
  },
  checkAddrRender(res, addId) {
    let _this = this
    let _data = _this.data
    let _goods = _data.orderGoodsInfo
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
      _goods.forEach((item, idx) => {//遍历下单的商品列表并插入地址匹配信息
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
  checkAddrDeatil(addId) {
    let _this = this
    let { baseUrl, shopId, storeId} = app.globalData
    let selfAddId = addId || _this.data.userAddr.addId
    utils.$http(baseUrl + '/emallMiniApp/address/detail/' + shopId + '/' + storeId + '/' + selfAddId).then(res => {
      let _rst = res && res.result
      if (_rst) {
        _this.setData({
          userAddr: _rst
        })
        _this.caclFreight(_rst.addId)
      }
    })
  },
  // 使用积分
  // calcIntegral() {
  //   let _this = this
  //   let _data = _this.data
  //   let gData = app.globalData
  //   let params = {
  //     shopId: gData.shopId,
  //     storeId: gData.storeId
  //   }
  //   utils.$http(app.globalData.baseUrl + '/emallMiniApp/ordered/calcIntegral/' + params.shopId + '/' + params.storeId, {}, 'POST').then(res => {
  //     utils.globalShowTip(false)
  //     if (res && res.result) {
  //       _this.setData({
  //         integral: res.result
  //       })
  //       if (_data.isCashCoupon) {
  //         _this.getCalcVoucher()
  //       } else {
  //         _this.calcFulReduce()
  //       }
  //     }
  //   })
  // },
  // getCalcVoucher() {// 获取用户代金券
  //   let _this = this
  //   let _data = _this.data
  //   let gData = app.globalData
  //   let url = url = `${gData.baseUrl}/emallMiniApp/ordered/vouchers/${gData.shopId}/${gData.storeId}`
  //   utils.$http(url, { auto: 1 }).then(res => {
  //     if (res) {
  //       utils.globalShowTip(false)
  //       _this.renderVouchers(res)
  //     }
  //   })
  // },
  // renderVouchers(res) {
  //   let _rst = res.result
  //   if (_rst) {
  //     console.log(_rst)
  //     this.setData({
  //       voucherCode: _rst.cardCode || ''
  //     })
  //     this.calcVoucher()
  //   } else {
  //     this.calcFulReduce()
  //   }
  // },
  //使用代金券
  // calcVoucher() {
  //   let _this = this
  //   let _data = _this.data
  //   let { shopId, storeId, voucherCode, baseUrl} = app.globalData
  //   let _params = {
  //     delivery: _data.navTab,
  //     addressId: _data.userAddr.addId || '',
  //     voucherCode: voucherCode || _data.voucherCode || '',
  //     integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
  //   }
  //   utils.$http(baseUrl + '/emallMiniApp/ordered/calcVoucher/' + shopId + '/' + storeId, _params, 'POST').then(res => {
  //     if (res) {
  //       _this.voucherRender(res)
  //     }
  //   })
  // },
  // voucherRender(res) {
  //   utils.globalShowTip(false)
  //   if (res && res.result) {
  //     this.setData({
  //       coupon: res.result,
  //       cashCouponFee: res.result.cashCouponFee
  //     })
  //   }
  // },
  // 计算满减金额
  calcFulReduce() {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId: gData.storeId
    }
    let _intNum = _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    if (!_data.isUseIntegral) {
      _intNum = 0
    }
    let _params = {
      delivery: _data.navTab,
      addressId: _data.userAddr.addId || '',
      // voucherCode: gData.voucherCode || _data.voucherCode || '',
      // integral: _intNum
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/ordered/calcFulReduce/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
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
      if ((_data.navTab === 1 || _data.navTab === 3) && (_data.userAddr.addId || app.globalData.addId)) {//商家配送或快递配送时
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
    if (_this.data.navTab !== 2) {
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
      utils.$http(app.globalData.baseUrl + '/emallMiniApp/ordered/calcFreight/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
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
  // 计算相关费用
  calcAmount(addrId) {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      shopId: gData.shopId,
      storeId:  gData.storeId
    }
    let _params = {
      delivery: _data.navTab,
      addressId: addrId || gData.addId || _data.userAddr.addId || '',
      voucherCode: gData.voucherCode || _data.voucherCode || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/ordered/calcAmount/' + params.shopId + '/' + params.storeId, _params, 'POST').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        this.setData({
          calcAmount: res.result
        })
      }
      // 代金券失效
      // app.globalData.voucherCode = false
    })
  },
  getOrderInfor() {
    let _this = this
    let _data = _this.data
    let { baseUrl, shopId, storeId, goodsId, skuId} = app.globalData
    let params = {
      shopId:  shopId,
      storeId: storeId,
      goodsId: _data.goodsId || goodsId,
      skuId: _data.skuId || skuId
    }
    console.log(_data.addId)
    console.log(1111111111)
    let _params = {
      'addId': _data.addId
    }
    if (!_data.iscart) _params.number = _data.prdNum
    let url = `${baseUrl}/emallMiniApp/ordered/confirm/${params.shopId}/${params.storeId}/${params.goodsId}/${params.skuId}`
    if (_data.iscart) { //购物车下单调用接口
      url = `${baseUrl}/emallMiniApp/ordered/confirm/settle/${params.shopId}/${params.storeId}`
    }
    utils.$http(url, _params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.orderInforRender(res)
      }
    }).catch(res => {
      console.log(res.code)
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
          })// 有用户到店
        }
        if (item === '3') {
          _this.setData({
            isGotStore: true
          }) // 有商家配送
        }
      }
      let _evolist = _rst.elLinecarVoList //确认订单购物车列表
      let storeIds = []
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
        if (_rst.storeDeliveryVo) {
          storeIds = _rst.storeDeliveryVo.selectStoreIds
        }
        if (_rst.storeDeliveryVo && !_rst.storeDeliveryVo.storeTimeIntersection) { //提货时间无交集时
          _evolist = _this.renderStoreEvoList(_evolist)
        }
      }
      // 设置商家配送收货时间
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
      if (_rst.shopDeliveryVo && !_rst.shopDeliveryVo.deliverTimeIntersection) { //商家配送时间无交集时
        _evolist = _this.renderEvoList(_evolist)
      }
      _this.setData({
        navTab: _data.sendType[0] || 4, //4系统配送
        multiArray: [monthArr, dayList],
        multiShopArray: [shopMonthArr, shopDayList, shopHourList],
        selectStoreIds: storeIds,
        orderGoodsInfo: _evolist,
        elFreightVo: _rst.freightDouble, //运费
        orderInfo: _rst,
        rxpireLinecarList: _rst.expireLinecarResponseList || [],
        storeDeliveryVo: _rst.storeDeliveryVo || {},
        elExpressDeliveryVo: _rst.elExpressDeliveryVo || {},
        shopDeliveryVo: _rst.shopDeliveryVo || {},
        fansIntegral: _rst.fansIntegral, //粉丝拥有积分数
        isCashCoupon: _rst.isCashCoupon, // 快递配送：是否可以使用现金券
        isSysDelivery: _rst.isSysDelivery, // 是否有系统配送
        isIntegral: _rst.isIntegral, //快递配送：是否可以使用积分
        shopIsIntegral: _rst.shopIsIntegral, //商家配送：是否可以使用积分
        storeIsIntegral: _rst.storeIsIntegral, //用户到店：是否可以使用积分 
        isPaidMember: _rst.paidMember // 是否是会员
      })
      // 配送方式默认显示第一种为高亮 如果第一种为门店自提 则做标记
      if (_data.sendType[0] === 2) {
        _this.setData({
          flagName: _data.storeDeliveryVo.requiredUserName,
          flagPhone: _data.storeDeliveryVo.requiredPhone,
          isSelfGoods: 2,
          isCashCoupon: _this.getCashCoupon(_evolist)
        })
        // 获取商家信息
        _this.getShopInfo()
      }
      if (_data.sendType[0] === 1) {
        _this.setData({
          flagName: _data.elExpressDeliveryVo.requiredUserName,
          flagPhone: _data.elExpressDeliveryVo.requiredPhone
        })
      }
      if (_data.sendType[0] === 3) {
        _this.setData({
          flagName: _data.shopDeliveryVo.requiredUserName,
          flagPhone: _data.shopDeliveryVo.requiredPhone
        })
      } _rst
      if (_data.isCashCoupon) {//获取可使用的代金券
        // 获取优惠券列表
        _this.getCoupons()
      }
      // 计算满减
      _this.calcFulReduce()
      //如果支持积分 调用积分的接口  获取积分相关信息
      // if (_data.isIntegral) {
      //   _this.calcIntegral()
      // } else if (_data.isCashCoupon) {//获取可使用的代金券
      //   _this.getCalcVoucher()
      // } else {//计算满减        
      //   _this.calcFulReduce()
      // }
    }
  },
  getYouhuiObj(arr) {//获取商品对应的支持活动优惠信息
    let _this = this
    let _data = _this.data
    let _type = _data.navTab
    let _arr = arr || []
    let obj = {
      isCashCoupon: false,
      isIntegral: false
    }
    _arr.forEach((item) => {//storeDeliverMonthDay:用户到店时间、shopDeliverMonthDay：商家配送时间
      if (_type === 3) {//商家配送
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isCashCoupon) {
          obj.isCashCoupon = true
        }
        console.log(item.checkResult, parseInt(item.checkResult) === 0, !item.shopDeliverTimeExpire, item.isExchange, item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isExchange)
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isExchange) {
          obj.isIntegral = true
        }
      } else if (_type === 2) {//到店自提
        //console.log(!item.storeDeliverTimeExpire && item.isCashCoupon, !item.storeDeliverTimeExpire, item.isCashCoupon)
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
  getCashCoupon(arr) {//遍历下单的商品中是否支持优惠券抵扣
    let _this = this
    let _data = _this.data
    let _type = _data.navTab
    let _arr = arr || []
    let isCashCoupon = false
    _arr.forEach((item) => {//storeDeliverMonthDay:用户到店时间、shopDeliverMonthDay：商家配送时间
      if (_type === 3) {//商家配送
        if (item.checkResult === 0 && !item.shopDeliverTimeExpire && item.isCashCoupon) {
          isCashCoupon = true
        }
      } else if (_type === 2) {//到店自提
        console.log(!item.storeDeliverTimeExpire && item.isCashCoupon, !item.storeDeliverTimeExpire, item.isCashCoupon)
        if (!item.storeDeliverTimeExpire && item.isCashCoupon) {
          isCashCoupon = true
        }
      }
    })
    return isCashCoupon
  },
  renderEvoList(arr) {//商家配送渲染购物车商品列表对应的时间
    let _this = this
    let _arr = arr
    _arr.forEach((item, idx) => {
      /*
      item.shopDeliverMonthDay = {
        deliverMonthDayTimes: '15:00,07:00;21:00,10:00',
        deliverMonthDays: [{ '2018年08月': ["12号", "13号", "14号", "15号", "16号", "17号", "18号"] }],
        deliverMonths: ["2018年08月"],
        mtIndex: []
      }
      */
      let _md = item.shopDeliverMonthDay
      if (_md) {
        let _month = _md.deliverMonths //对应的年月
        let _mdl = _md.deliverMonthDays
        let _mdt = _md.deliverMonthDayTimes
        let _day = _this.renderMonthDays(_month, _month[0], _mdl) //当前月份对应的天数
        let _hour = _this.renderHours(_mdt) //对应的时间段
        _md.mtIndex = []
        _md.mdList = [_month, _day, _hour]
      }
    })
    return _arr
  },
  renderStoreEvoList(arr) {//门店自提渲染购物车商品列表对应的时间
    let _this = this
    let _arr = arr
    _arr.forEach((item, idx) => {
      let _md = item.storeDeliverMonthDay
      if (_md) {
        let _month = _md.storeMonthList //对应的年月
        let _mdl = _md.monthDays
        let _day = _this.renderMonthDays(_month, _month[0], _mdl) //当前月份对应的天数
        _md.mtIndex = []
        _md.mdList = [_month, _day]
      }
    })
    return _arr
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
  findArrival(page, idx) {//到店门店查询
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let { longitude, latitude } = this.data
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      pageNo: page || 1
    }
    let _params = {
      storeIds: [],
      city: _data.userAddr.city || '',//城市id
      longitude,
      latitude
    }
    if (_data.selectStoreIds && _data.selectStoreIds.length) {
      _params.storeIds = _data.selectStoreIds.join(',')
    }
    if (idx || idx === 0) {//无交集时
      let _goods = _data.orderGoodsInfo
      _params.goodsIds = _goods[idx].goodsId
    } else {
      _params.goodsIds = _data.goodsId || []
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/store/list/location/' + params.shopId + '/' + params.storeId + '/' + params.pageNo, _params, 'POST').then(res => {
      if (res) {
        console.log(res.data)
        utils.globalShowTip(false)
        _this.arrivalRender(res, idx)
      }
    })
  },
  arrivalRender(res, idx) {
    let _this = this
    if (res) {
      let _rst = res.result
      if (idx || idx === 0) {//无交集时
        let _goods = _this.data.orderGoodsInfo
        _goods[idx].userStores = _rst
        _this.setData({
          _goods_idx: idx,
          orderGoodsInfo: _goods
        })
      } else {
        _this.setData({
          cityStores: _rst
        })
      }
    }
  },
  submitHandle(evt) {
    let formId = evt.detail.formId || ''
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
    let _goods = _data.orderGoodsInfo
    console.log(_goods)
    if (!_goods || (_goods && !_goods.length)){
      utils.globalToast('暂无可支付商品！', 'none')
      return false
    }
    let param = {
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: _data.buyerId || gData.buyerId,
      goodsId: _data.goodsId || _goods[0].goodsId,
      skuId: _data.skuId || _goods[0].skuId,
      formId: formId,
      'number': _data.prdNum || _goods[0].numbers,
      delivery: _data.navTab,
      voucherCode: _data.voucherCode ? _data.voucherCode : (_data.couponChked ? _data.coupon.voucherCode : ''),
      addressId: gData.addId || _data.userAddr.addId || '',
      lmsg: _data.lmsg || gData.lmsg || '',
      empId: app.getEmpId() || '',
      integral: _data.integral.integral === 'no' ? 0 : _data.integral.integral || 0,
      storeDisNo: gData.shareEmpId || ''
    }
    if (param.delivery === 2) {//门店自提
      let _storeDeliveryVo = _data.storeDeliveryVo
      if (_data.isStoreTimeOver) {
        wx.showToast({
          title: '所有商品门店自提都过期，请选择其它配送方式！',
          icon: 'none',
          mask: true,
          duration: 1500
        })
        return false
      }
      let _gp = []//多商品时参数
      if (_goods.length > 1) {//多个商品
        if (!_storeDeliveryVo.storeIntersection) {//提货门店无交集
          let _gstore = _goods.filter((item) => {//过滤未选择提货门店的商品
            return !item.busiModelStore
          })
          if (_gstore.length) {//商品没选择提货门店
            wx.showToast({
              title: '请选择提货门店！',
              icon: 'none',
              mask: true,
              duration: 1500
            })
            return false
          }
          _goods.forEach((item, idx) => {
            _gp[idx] = _gp[idx] || {}
            _gp[idx].linecarId = item.linecarId
            _gp[idx].goodsId = item.goodsId
            _gp[idx].arriveStoreId = item.busiModelStore.id
            _gp[idx].arriveStoreName = item.busiModelStore.name
          })
        } else {//多个商品提货门店有交集
          let arriStoreId = _data.busiModelStore.id
          if (!arriStoreId || arriStoreId === '') {
            wx.showToast({
              title: '请选择提货门店！',
              icon: 'none',
              mask: true,
              duration: 1500
            })
            return false
          }
          param.arriveStoreId = arriStoreId
          param.arriveStoreName = _data.busiModelStore.name
          _goods.forEach((item, idx) => {
            _gp[idx] = _gp[idx] || {}
            _gp[idx].linecarId = item.linecarId
            _gp[idx].goodsId = item.goodsId
            _gp[idx].arriveStoreId = arriStoreId
            _gp[idx].arriveStoreName = _data.busiModelStore.name
          })
        }

        if (!_storeDeliveryVo.storeTimeIntersection) {//多个商品提货时间无交集 
          let _garr = _goods.filter((item) => {//过滤未选择提货货时间的商品
            return item.storeDeliverMonthDay && !item.storeDeliverMonthDay.mtIndex.length
          })
          if (_garr.length) {//商品没选择提货时间
            wx.showToast({
              title: '请选择提货时间！',
              icon: 'none',
              mask: true,
              duration: 1500
            })
            return false
          }
          _goods.forEach((item, idx) => {
            let _shopMd = item.storeDeliverMonthDay
            if (_shopMd) {
              let _mdList = _shopMd.mdList
              let _mtIndex = _shopMd.mtIndex
              _gp[idx] = _gp[idx] || {}
              _gp[idx].linecarId = item.linecarId
              _gp[idx].goodsId = item.goodsId
              _gp[idx].userStoreTime = (_mdList[0][_mtIndex[0]] || '') + (_mdList[1][_mtIndex[1]] || '')
            }
          })
        } else {//多个商品提货时间有交集
          let arrivalDate = (_data.multiArray[0][_data.multiIndex[0]] || '') + (_data.multiArray[1][_data.multiIndex[1]] || '')
          if (arrivalDate === '') {
            wx.showModal({
              title: '温馨提示',
              content: '请选择提货日期！',
              success(res) { },
              showCancel: false
            })
            return false
          }
          param.userStoreTime = arrivalDate
          _goods.forEach((item, idx) => {
            let _shopMd = item.storeDeliverMonthDay
            if (_shopMd) {
              _gp[idx] = _gp[idx] || {}
              _gp[idx].linecarId = item.linecarId
              _gp[idx].goodsId = item.goodsId
              _gp[idx].userStoreTime = arrivalDate
            }
          })
        }
        param.goodsDeliver = JSON.stringify(_gp)
      } else {//单个商品        
        let arriStoreId = _data.busiModelStore.id
        if (!arriStoreId || arriStoreId === '') {//判断是否选择门店
          wx.showToast({
            title: '请选择提货门店！',
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        param.arriveStoreId = arriStoreId
        param.arriveStoreName = _data.busiModelStore.name

        let arrivalDate = (_data.multiArray[0][_data.multiIndex[0]] || '') + (_data.multiArray[1][_data.multiIndex[1]] || '')
        if (arrivalDate === '') {//判断是否选择提货日期
          wx.showToast({
            title: '请选择提货日期！',
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        param.userStoreTime = arrivalDate
      }
      // 判断买家姓名和手机号是否必填
      if (_storeDeliveryVo && _storeDeliveryVo.requiredUserName) {
        let _name = _data.buyerName
        if (!_this.chkName(_name)) {
          return false
        }
        param.userName = _name
      }
      if (_storeDeliveryVo && _storeDeliveryVo.requiredPhone) {
        let _phone = _data.buyerPhone
        if (!_this.chkPhone(_phone)) {
          return false
        }
        param.userTelphone = _phone
      }
    } else if (param.delivery === 1) {//快递配送
      if (!param.addressId || param.addressId === '') {
        wx.showToast({
          title: '请选择收货地址！',
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
      let _gp = []//多商品时参数
      if (_goods.length > 1 && !_data.shopDeliveryVo.deliverTimeIntersection) {//多个商品无交集        
        let _garr = _goods.filter((item) => {//过滤未选择收货时间的商品
          return item.checkResult === 0 && item.shopDeliverMonthDay && !item.shopDeliverMonthDay.mtIndex.length
        })
        if (_garr.length) {//商品没选择收货时间
          wx.showToast({
            title: '请选择收货时间！',
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        _goods.forEach((item) => {
          if (item.checkResult === 0) {
            let _shopMd = item.shopDeliverMonthDay
            if (_shopMd) {
              let _mdList = _shopMd.mdList
              let _mtIndex = _shopMd.mtIndex
              _gp.push({
                linecarId: item.linecarId,
                goodsId: item.goodsId,
                shopDateTime: (_mdList[0][_mtIndex[0]] || '') + (_mdList[1][_mtIndex[1]] || '') + ' ' + (_mdList[2][_mtIndex[2]] || '')
              })
            }
          }
        })
        param.goodsDeliver = JSON.stringify(_gp)
      } else {//单个商品或者多个商品有交集
        let shopDateTime = (_data.multiShopArray[0][_data.multiShopIndex[0]] || '') + (_data.multiShopArray[1][_data.multiShopIndex[1]] || '') + ' ' + (_data.multiShopArray[2][_data.multiShopIndex[2]] || '')
        if (shopDateTime === ' ') {
          wx.showToast({
            title: '请选择收货时间！',
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        param.shopDateTime = shopDateTime
        if (_goods.length > 1) {//多个商品
          _goods.forEach((item) => {
            if (item.checkResult === 0) {
              let _shopMd = item.shopDeliverMonthDay
              if (_shopMd) {
                _gp.push({
                  linecarId: item.linecarId,
                  goodsId: item.goodsId,
                  shopDateTime: shopDateTime
                })
              }
            }
          })
          param.goodsDeliver = JSON.stringify(_gp)
        }
      }
    }
    _this.submitOrder(param)
  },
  submitOrder(params) {
    let _this = this
    let gData = app.globalData
    console.log(_this.data.isSubmitting)
    if (_this.data.isSubmitting) {
      return false
    }
    _this.data.isSubmitting = true
    utils.globalShowTip(true)
    utils.$http(gData.baseUrl + '/emallMiniApp/ordered/submit/' + params.shopId + '/' + params.storeId, params, 'POST').then(res => {
      if (res && res.result) {
        const returnCode = parseInt(res.code);
        if (returnCode !== 0) {
          utils.globalShowTip(false)
          wx.showModal({
            title: '温馨提示',
            content: res.data.message || '网络异常，请稍后重试！',
            success(res) {
              _this.data.isSubmitting = false
            },
            showCancel: false
          })
        } else if (returnCode === 0) { //1表示接口成功调用
          _this.data.isSubmitting = false
          _this.submitRender(res.result)
        }
      }
    }).catch(res => {
      /*
      utils.globalShowTip(false)
      wx.showModal({
        title: '温馨提示',
        content: res.message || '订单提交失败，请稍候再试！',
        success(res) {
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
        success: function (res) {
        },
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
        success: function (res) {
        },
        showCancel: false
      })
      return false
    }
    return true
  },
  toggleStore(evt) {
    let _this = this
    let _data = _this.data
    let _goods = _data.orderGoodsInfo
    let dst = evt.currentTarget.dataset
    let idx = parseInt(dst.idx)
    let isshow = false
    if (dst.type === 'open') {
      _this.setData({
        isShowTextArea: false
      })
      isshow = true
      if (_data.storeDeliveryVo.storeIntersection) {//到店门店有交集时
        if (!_data.cityStores.length) {
          _this.findArrival()
        }
      } else {//无交集时，点击单个商品选择提货门店
        if (!_goods.userStores || !_goods.userStores.length) {//单前商品没有提货门店时
          _this.findArrival(1, idx)
        }
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

  useIntegral(evt) {
    let _this = this
    let dst = evt.currentTarget.dataset
    let isshow = false
    let integral = _this.data.integral  //积分相关信息
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
      _this.calcFulReduce()
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
      _this.calcFulReduce()
      _this.setData({
        integraSlideUp: false,
        isShowTextArea: true
      })
    }
  },

  togSubList(evt) {
    let dst = evt.currentTarget.dataset
    let plist = dst.plist
    let pidx = dst.pidx
    let goodsidx = parseInt(dst.goods)
    plist.forEach((item, idx) => {
      if (idx === pidx) {
        item.open = !item.open
      } else {
        item.open = false
      }
    })
    if (goodsidx || goodsidx === 0) {//无交集时
      let _goods = this.data.orderGoodsInfo
      _goods[goodsidx].userStores = plist
      this.setData({
        orderGoodsInfo: _goods
      })
    } else {
      this.setData({
        cityStores: plist
      })
    }
  },
  selectStore(evt) {
    let dst = evt.currentTarget.dataset
    let goodsidx = parseInt(dst.goods)
    let item = dst.item
    if (goodsidx || goodsidx === 0) {//无交集时
      let _goods = this.data.orderGoodsInfo
      _goods[goodsidx].busiModelStore = item
      this.setData({
        orderGoodsInfo: _goods,
        storeSlideUp: false,
        isShowTextArea: true
      })
    } else {
      this.setData({
        busiModelStore: item,
        storeSlideUp: false,
        isShowTextArea: true
      })
    }
  },
  bindMultiPickerChange(e) {
    let _this = this
    let _dst = e.currentTarget.dataset
    let _time = _dst.time
    let _idx = parseInt(_dst.list)
    let _data = _this.data
    let _goods = _data.orderGoodsInfo
    let _val = e.detail.value
    if (_time === 'shop') {
      if (_idx || _idx === 0) {//通过商品列表点击选择时间
        _goods[_idx].shopDeliverMonthDay.mtIndex = _val
        _goods[_idx].shopDeliverMonthDay.mtIndexCache = _val
        _this.setData({
          orderGoodsInfo: _goods
        })
      } else {
        _this.setData({
          multiShopIndex: _val,
          cacheShopIndex: _val
        })
      }
    } else if (_time === 'store') {
      if (_idx || _idx === 0) {//通过商品列表点击选择时间
        _goods[_idx].storeDeliverMonthDay.mtIndex = _val
        _goods[_idx].storeDeliverMonthDay.mtIndexCache = _val
        _this.setData({
          orderGoodsInfo: _goods
        })
      } else {
        this.setData({
          multiIndex: _val,
          cacheStoreIndex: _val
        })
      }
    }
  },
  bindMultiPickerColumnChange(e) {
    let _this = this
    let _data = _this.data
    let _val = e.detail.value
    let _dst = e.currentTarget.dataset
    let _time = _dst.time
    let _idx = parseInt(_dst.list)
    if (_time === 'shop') {//设置商家配送时间
      if (_idx || _idx === 0) {//无交集时，通过商品列表点击选择时间
        let _goods = _data.orderGoodsInfo
        let _gmd = _goods[_idx].shopDeliverMonthDay //当前点击的商品
        _gmd.mtIndex[e.detail.column] = _val
        switch (e.detail.column) {
          case 0:
            let _months = _gmd.deliverMonths
            let _dayArr = _this.renderMonthDays(_months, _months[_val], _gmd.deliverMonthDays)
            let _tiems = _gmd.mdList[2] || []
            _gmd.mdList = [_months, _dayArr, _tiems]
            _gmd.mtIndex = [_val, _gmd.mtIndex[1] || 0, 0]
            break
          case 1:
            _gmd.mtIndex = [_gmd.mtIndex[0] || 0, _val, _gmd.mtIndex[2] || 0]
            break
          case 2:
            _gmd.mtIndex = [_gmd.mtIndex[0] || 0, _gmd.mtIndex[1] || 0, _val]
            break
          default:
            break
        }
        _this.setData({
          orderGoodsInfo: _goods
        })
      } else {//时间有交集
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
      }
    } else if (_time === 'store') {//设置提货日期
      if (_idx || _idx === 0) {//无交集时，通过商品列表点击选择时间
        let _goods = _data.orderGoodsInfo
        let _gmd = _goods[_idx].storeDeliverMonthDay //当前点击的商品
        _gmd.mtIndex[e.detail.column] = _val
        switch (e.detail.column) {
          case 0:
            let _months = _gmd.storeMonthList
            let _dayArr = _this.renderMonthDays(_months, _months[_val], _gmd.monthDays)
            _gmd.mdList = [_months, _dayArr]
            _gmd.mtIndex = [_val, _gmd.mtIndex[1] || 0]
            break
          case 1:
            _gmd.mtIndex = [_gmd.mtIndex[0] || 0, _val]
            break
          default:
            break
        }
        _this.setData({
          orderGoodsInfo: _goods
        })
      } else {//时间有交集
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
  }
})