const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    formId: '',
    orderStatus: 0,
    orderInfo: {},
    rechargeSlide: false
  },
  onLoad (opt) {
    let _this = this
    console.log(opt)
    if (opt.orderNo) {
      let orderNo = opt.orderNo
      _this.setData({
        orderNo: orderNo
      })
    }
    if (opt.detNo && opt.detNo !== 'undefined' && opt.detNo !== 'null') {
      _this.setData({
        detNo: opt.detNo
      })
    }
  },
  onShow () {
    let _this = this
    //查询订单详情
    app.checkUnionId(_this.initData) 
  },
  initData(){
    let _this = this
    //检查登录环境  微信还是企业微信
    _this.getEnvironment()
    _this.getDetail()
    app.unReadMsgCount().then(res => {
      _this.setData({
        empObj: res
      })
    })
  },
  //处理电商用户从企业微信中进入电商不允许下单
  getEnvironment: function () {
    let _this = this
    if (app.globalData.environment) {
      _this.setData({
        environment: app.globalData.environment
      })
    }
  },
  toexpress(evt) {
    console.log(evt)
    let orderNo = evt.currentTarget.dataset.orderNo
    wx.navigateTo({
      url: '/pages/expressDelivery/expressDelivery?orderNo=' + orderNo
    })
  },
  toCertiticate: function () {
    wx.navigateTo({
      url: '/pages/secondshop/certificate/certificate?orderNo=' + this.data.orderInfo.orderNo
    })
  },
  getDetail: function () {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let _param = {
      storeId: _global.storeId,
      orderNo: _data.orderNo
    }
    let data = {}
    if (_data.detNo) {
      data.detailNo = _data.detNo
    }
    let url = `${app.globalData.baseUrl}/emallMiniApp/orders/orderDetail/${_param.storeId}/${_param.orderNo}`
    utils.$http(url, data).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderDetail(res)
      }
    })
  },
  renderDetail: function (res) {
    let _this = this
    let orderInfo = res.result.orders
    let refundInfo = res.result.refundSetting
    let refundObj = res.result.refund
    let nowTime = new Date().getTime() // 当前日期转化为毫秒
    let editTime = orderInfo.editTime //订单完成时间
    let refundTime = refundInfo.finishDay * 24 *3600 * 1000 //已完成几天内可退 
    //格式化支付取消时间
    orderInfo.payTimeFormat = utils.milliSecondToDate(orderInfo.payTimeCountDown)
    orderInfo.payTimeCountDown = parseInt(orderInfo.payTimeCountDown / 60) 
    orderInfo.prepaid = 1
    _this.formatTime(orderInfo)
    // 判断几种订单状态
    let _status = 0
    switch (orderInfo.status) {
      case 0:
        if (orderInfo.payWay === 3 || orderInfo.payWay === 4) {
          orderInfo.status = '待发货'
          _status = 2
        } else {
          orderInfo.status = '待付款'
          _status = 0
        }
        break
      case 1:
        orderInfo.status = '已关闭' // 被商家取消
        _status = 1
        break
      case 2:
        if (orderInfo.orderType === 2) {
          orderInfo.status = '待收货' // 已付款 未发货 门店自提
          _status = 3
        } else {
          orderInfo.status = '待发货' // 已付款 未发货
          _status = 2
        }
        break
      case 3:
        orderInfo.status = '待收货' // 已发货
        _status = 3
        break
      case 4:
        orderInfo.status = '已完成' // 已签收 已完成
        let refundFlag = (nowTime - editTime) > refundTime //判断是否超过退款时间
        console.log(refundFlag)
        _status = 4
        _this.setData({refundFlag})
        break
      case 5:
        orderInfo.status = '已关闭' // 被用户取消
        _status = 5
        break
      case 6:
        orderInfo.status = '退款中' // 待商家同意退款
        _status = 6
        break
      case 7:
        orderInfo.status = '退款中' // 待买家退货
        _status = 7
        break
      case 8:
        orderInfo.status = '退款中' //等待商家收货
        _status = 8
        break
      case 9:
        orderInfo.status = '退款完成' //退款成功
        _status = 9
        break
      case 10:
        orderInfo.status = '已关闭' //超时取消
        _status = 10
        break
      case 11:
        orderInfo.status = '已付定金' // 已付定金
        _status = 11
        break
    }
    _this.setData({
      orderStatus: _status,
      orderInfo: orderInfo,
      refundInfo: refundInfo,
      refundObj: refundObj
    })
    
  },
  formatTime: function (obj) {
    obj.createTime = utils.getTime(obj.createTime)
    if (obj.payTime) {
      obj.payTime = utils.getTime(obj.payTime)
    }
    obj.editTime = utils.getTime(obj.editTime)
  },
  setFormId: function (evt) {
    let formId = evt.detail.formId
    let dst = evt.target.dataset
    let ord = dst.orderno
    if (ord && ord !== '') {
      this.cancleOrder(ord)
    }
    app.saveFormIdSecond(formId)
  },
  // 取消订单
  cancleOrder: function (no) {
    let _this = this
    let _param = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      orderNo: no
    }
    wx.showModal({
      title: '提示',
      content: `确定要取消${_param.orderNo}的订单吗?`,
      success: function (res) {
        if (res.confirm) {
          // utils.globalShowTip(true)
          let url = `${app.globalData.baseUrl}/emallMiniApp/orders/cancelOrder/${_param.shopId}/${_param.storeId}/${_param.orderNo}`
          utils.$http(url, {}, 'POST').then(res => {
            const returnCode = parseInt(res.code)
            if (returnCode === 0) {
              _this.renderCancle(res)
            }
          }).catch(error => {
            utils.globalShowTip(false)
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    }) 
  },
  renderCancle: function (res) {
    let _this = this
    utils.globalShowTip(false)
    wx.redirectTo({
      url: '../orderList/orderList'
    })
  },
  // 删除订单
  delOrder: function () {
    let _this = this
    let _param = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      orderNo: _this.data.orderInfo.orderNo
    }
    wx.showModal({
      title: '提示',
      content: `确定要删除${ _param.orderNo}的订单吗?`,
      success: function (res) {
        if (res.confirm) {
          utils.globalShowTip(true)
          let url = `${app.globalData.baseUrl}/emallMiniApp/orders/deleteOrder/${_param.shopId}/${_param.storeId}/${_param.orderNo}`
          utils.$http(url, {}, 'POST').then(res => {
            const returnCode = parseInt(res.code)
            if (returnCode === 0) {
              _this.renderDel(res)
            }
          }).catch(error => {
            utils.globalShowTip(false)
          })
        } else if (res.cancel) {
          console.log('用户点击删除订单')
        }
      }
    })
  },
  renderDel: function (res) {
    let _this = this
    utils.globalShowTip(false)
    wx.redirectTo({
      url: '../orderList/orderList'
    })
  },
  // 确认收货
  confirmReceipt: function () {
    let _this = this
    let _param = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      orderNo: _this.data.orderInfo.orderNo
    }
    let url = `${app.globalData.baseUrl}/emallMiniApp/orders/confirmDeliveryOrder/${_param.shopId}/${_param.storeId}/${_param.orderNo}`
    utils.$http(url, {}, 'POST').then(res => {
      const returnCode = parseInt(res.code)
      if (returnCode === 0) {
        _this.renderConfirm(res)
      }
    })
  },
  renderConfirm: function (res) {
    let _this = this
    utils.globalShowTip(false)
    wx.showToast({
      title: '确认收货成功',
      icon: 'success',
      duration: 2000,
      success: function (res) {
        console.log(res)
        wx.navigateTo({
          url: '../orderList/orderList'
        })
      }
    })
  },
  //提醒发货
  remindGood: function () {
    let _this = this
    let name = _this.data.empObj.empName
    wx.navigateTo({
      url: '/pages/chat/chat?name=' + name + '&orderInfo=' + JSON.stringify(_this.data.orderInfo) + '&remind=' + true
    })
  },
  gotoPay(evt){
    app.saveFormId(evt.detail.formId)
    wx.navigateTo({
      url: `/pages/payment/payment?orderNo=${this.data.orderInfo.orderNo}`
    })
  },
  //退款
  toRefund: function (e) {
    let {orderNo} = this.data.orderInfo
    let { detNo, single } = e.currentTarget.dataset
    // single-是否单品退款
    console.log(single)
    console.log(detNo)
    console.log(orderNo)
    wx.navigateTo({
      url: `/pages/mine/refund/refund?orderNo=${orderNo}${single?`&detNo=${detNo}`:''}`
    })
  },
  //退货
  toRegood(e) {
    let { orderInfo, detNo} = this.data
    wx.navigateTo({
      url: '/pages/mine/refund/regoods/regoods?orderNo=' + orderInfo.orderNo + '&detNo=' + detNo,
    })
  },
  //查看退款记录
  toRecord: function (e) {
    let formId = e.detail.formId
    app.saveFormIdSecond(formId)
    let { orderInfo, detNo } = this.data
    wx.navigateTo({
      url: '/pages/mine/refund/record/record?orderNo=' + orderInfo.orderNo + '&detNo=' + detNo,
    })
  },
  toChat(){
    let _this = this
    let phone = _this.data.empObj.storePhone //没有导购会返回电话号
    let name = _this.data.empObj.empName
    if (phone) {
      wx.showModal({
        title: '门店电话',
        content: phone,
        confirmText: '拨打',
        showCancel: true,
        success: function (res) {
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
      url: '/pages/chat/chat?name=' + name + '&orderInfo=' + JSON.stringify(_this.data.orderInfo)
    })
  },
  toDetail(e) {
    let atype = e.currentTarget.dataset.activitytype
    let goodsId = e.currentTarget.dataset.goodsid
    let activivtyId = e.currentTarget.dataset.activityid
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId
      })
    }
  },
  //虚拟商品储值卡充值
  toRecharge(e){
    let _this = this
    let rtype = e.currentTarget.dataset.type
    let topUpBuyerId = e.currentTarget.dataset.buyerId
    let orderDetailNo = e.currentTarget.dataset.detailNo
    if (rtype) {
      _this.setData({
        rechargeSlide: false
      })
    } else {
      _this.setData({
        rechargeSlide: true,
        orderDetailNo: orderDetailNo,
        topUpBuyerId: topUpBuyerId
      })
    }
  },
  toConfirm(){
    let _this = this
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      orderDetailNo: _this.data.orderDetailNo,
      topUpBuyerId: _this.data.topUpBuyerId
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/virtualGoods/charge/' + params.shopId + '/' + params.storeId + '/' + params.orderDetailNo + '/' + params.topUpBuyerId, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          rechargeSlide: false
        })
        _this.getDetail()
      }
    })
  },
  //领取
  toRecive(e) {
    let _this = this
    let ctype = e.currentTarget.dataset.type
    let detailNo = e.currentTarget.dataset.detailNo
    let voucherId = e.currentTarget.dataset.voucherId
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      detailNo: detailNo,
      voucherId: voucherId
    }
    let _url = ''
    if (ctype === 'hycard') {
      _url = `${_global.baseUrl}/emallMiniApp/voucher/drawVoucher/${params.shopId}/${params.storeId}/${params.detailNo}/${params.voucherId}`
      utils.$http(_url, params, 'POST').then(res => {
        let _rst = res.result
        if (_rst && _rst.cardListJson) {
          utils.globalShowTip(false)
          let cardListJson = JSON.parse(res.result.cardListJson)
          _this.callAddWxCard(cardListJson, detailNo)
        }
      })
    } else {
      _url = `${_global.baseUrl}/emallMiniApp/voucher/addWxCard/${params.shopId}/${params.storeId}/${params.detailNo}/${params.voucherId}`
      utils.$http(_url, params, 'POST').then(res => {
        let _rst = res.result
        if (_rst && _rst.cardListJson) {
          utils.globalShowTip(false)
          let cardListJson = JSON.parse(res.result.cardListJson)
          if (_rst.isAddWxCard) {
            _this.callAddWxCard(cardListJson, detailNo)
          } else {
            _this.openWxCard(cardListJson)
          }
        }
      })
    }
  },
  callAddWxCard(cardListJson, detailNo) {
    let _this = this
    wx.addCard({
      cardList: cardListJson,
      success(res) {
        console.log(res.cardList) // 卡券添加结果
        _this.updateVirtualGoodsResend(detailNo)
      }
    })
  },
  updateVirtualGoodsResend(detailNo) {
    let _global = app.globalData
    let _this = this
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/updateVirtualGoodsResend/' + detailNo, {}, 'POST').then(res => {
      utils.globalShowTip(false)
      _this.getDetail()
    })
  },
  openWxCard(cardListJson) {
    let _this = this
    wx.openCard({
      cardList: cardListJson,
      success(res) {
        console.log(res) // 卡券添加结果
        _this.getDetail()
      }
    })
  },
  gotoCoin() {
    wx.navigateTo({
      url: '/pages/mine/coin/coin',
    })
  },
  gotoCoupon() {
    wx.navigateTo({
      url: '/pages/mine/coupon/index',
    })
  }
})