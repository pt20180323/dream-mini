const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isSending: false,
    isShare: false,
    couponDet: {},
    storeList: [],
    shopId: '',
    cardId: '',
  },
  onLoad: function (opt) {
    let _this = this
    let _data = _this.data
    if (opt) {
      _this.setData({
        shopId: opt.shopId,
        codeData: opt.cdata,
        cardId: opt.cId
      })
      if (opt.isshare) {
        _this.setData({
          isShare: true
        })
      }
      app.checkUnionId(_this.initData)
    }
  },
  initData: function () {
    let _this = this
    let _data = _this.data
    _this.setData({
      cUserId: app.globalData.hyUserId
    })
    let _param = {
      shopId: _data.shopId,
      codeData: _data.codeData,
      cardId: _data.cardId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/ticket/detail/' + _param.shopId + '/' + _param.codeData, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.voucherDetail(res)
      }
    })
    // utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/detail/' + _param.shopId + '/' + _param.cardId, _param).then(res => {
    //   if (res) {
    //     utils.globalShowTip(false)
    //     _this.voucherDetail(res)
    //   }
    // })
  },
  receiveCard: function (evt) {
    let _this = this
    let _data = _this.data
    let _param = {
      transferHyUserId: _data.couponDet.hyUserId,
      hyUserId: app.globalData.hyUserId,
      shopId: _data.shopId,
      codeData: _data.codeData,
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/receiveTransfer', _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.receiveRender(res)
      }
    })
  },
  receiveRender: function (res) {
    wx.showModal({
      title: '温馨提示',
      content: '领取成功！',
      success: function (res) {
        wx.switchTab({
          url: '/pages/mine/mine'
        })
      },
      showCancel: false
    })
  },
  voucherDetail: function (res) {
    let _this = this
    let _data = _this.data
    let _rst = res.result
    if (_rst.isTransferSend !== 1) {
      wx.hideShareMenu()
    }
    _this.setData({
      couponDet: _rst,
      isOwner: _data.cUserId === _rst.hyUserId,
      isSending: _rst.status === 5 || _rst.status === 6
    })
    console.log(res)
    let _param = {
      shopId: _data.shopId,
      cardId: _data.cardId,
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/verifyStores/' + _param.shopId + '/'  + _param.cardId, _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.voucherDetailStore(res)
      }
    })
  },
  voucherDetailStore: function (res) {
    let _this = this
    //console.log(res);
    _this.setData({
      storeList: res.result
    })
  },
  sendCard: function () {
    let _this = this
    let _data = _this.data
    let _param = {
      shopId: _data.shopId,
      codeData: _data.codeData,
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/transferingCodeData', _param, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderSend(res)
      }
    })
  },
  renderSend: function (res) {
    console.log(res)
    this.setData({
      justSending: true
    })
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      // console.log(res.target)
    }
    let _this = this
    let _data = _this.data
    let _url = '/pages/secondshop/couponDet/couponDet?shopId=' + _data.shopId + '&cdata=' + _data.codeData + '&cId=' + _data.cardId + '&isshare=true'
    return {
      title: _data.couponDet.cardName,
      path: _url,
      imageUrl: '/static/img/card_share.jpg',
      success: function (res) {
        _this.sendCard()
        // 转发成功
        _this.setData({
          isSending: true
        })
      },
      fail: function (res) {
        // 转发失败
        _this.setData({
          isSending: false
        })
      }
    }
  }
})