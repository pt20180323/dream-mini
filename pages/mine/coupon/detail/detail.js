// pages/mine/coupon/detail/detail.js
const utils = require('../../../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 自定义page对象CSS样式对象
    pageBackgroundColor: '',
    isSending: false,
    isShare: false,
    couponDet: {},
    storeList: [],
    currentTime: '',
    day: '', //代金券几天后可以使用
    longitude: '',
    latitude: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let _this = this
    let _data = _this.data
    if (opt) {
      _this.setData({
        shopId: opt.shopId,
        codeData: opt.codeData,
        cardId: opt.cardId
      })
      if (opt.isshare) {
        _this.setData({
          isShare: true
        })
      }
      app.checkUnionId(_this.initData)
    }
  },
  initData: function() {
    let _this = this
    let _data = _this.data
    _this.setData({
      cUserId: app.globalData.hyUserId
    })
    _this.getVoucherDetail()
  },
  //用户卡卷领取记录
  getVoucherDetail() {
    let _this = this
    let _data = _this.data
    let _param = {
      shopId: _data.shopId,
      codeData: _data.codeData,
      cardId: _data.cardId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/ticket/detail/' + _param.shopId + '/' + _param.codeData, _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.voucherDetail(res)
      }
    })
  },
  voucherDetail: function(res) {
    let _this = this
    let _data = _this.data
    let _rst = res.result
    let currentTime = new Date().getTime()
    if (_rst.isTransferSend === 0 || _rst.status !== 1 || _data.justSending) {
      wx.hideShareMenu()
    }
    if (_rst.cardType === 1) {
      wx.setNavigationBarTitle({
        title: '代金券'
      })
    } else if (_rst.cardType === 2) {
      wx.setNavigationBarTitle({
        title: '折扣券'
      })
    } else if (_rst.cardType === 3) {
      wx.setNavigationBarTitle({
        title: '礼品券'
      })
    }
    if (_rst.status === 1 && currentTime < _rst.verfyStartDate) {
      let day = parseInt((_rst.verfyStartDate - currentTime) / (1000 * 60 * 60 * 24))
      _this.setData({
        day: day
      })
    }
    _this.setData({
      couponDet: _rst,
      pageBackgroundColor: _rst.color,
      isOwner: _data.cUserId === _rst.hyUserId,
      isSending: _rst.status === 5 || _rst.status === 6,
      currentTime: currentTime
    })
    let _param = {
      shopId: _data.shopId,
      cardId: _data.cardId,
    }
    let params = {
      useStoreType: _rst.useStoreType
    }
    //获取当前的位置
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        params.longitude = longitude
        params.latitude = latitude
        _this.voucherDetailStore(_param, params)
      },
      fail: function(res) {
        _this.voucherDetailStore(_param, params)
      }
    })
  },
  voucherDetailStore: function (_param,params) {
    let _this = this
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/verifyStores/' + _param.shopId + '/' + _param.cardId, params,'',1).then(res => {
      if (res) {
        _this.setData({
          storeList: res.result
        })
      }
    })
  },
  sendCard: function() {
    let _this = this
    let _data = _this.data
    let _param = {
      shopId: _data.shopId || app.globalData.shopId,
      codeData: _data.codeData,
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/transferingCodeData', _param, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderSend(res)
      }
    })
  },
  renderSend: function(res) {
    this.setData({
      justSending: true
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(res) {
    let _this = this
    let _data = _this.data
    let _url = '/pages/mine/coupon/detail/detail?shopId=' + (_data.shopId || app.globalData.shopId) + '&codeData=' + _data.codeData + '&cardId=' + _data.cardId + '&isshare=true'
    return {
      title: _data.couponDet.cardName,
      path: _url,
      imageUrl: '/static/img/card_share.jpg',
      success: function(res) {
        _this.sendCard()
        // 转发成功
        _this.setData({
          isSending: true
        })
      },
      fail: function(res) {
        // 转发失败
        _this.setData({
          isSending: false
        })
      }
    }
  },
  receiveCard: function(evt) {
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
  receiveRender: function(res) {
    wx.showModal({
      title: '温馨提示',
      content: '领取成功！',
      success: function(res) {
        wx.switchTab({
          url: '/pages/mine/mine'
        })
      },
      showCancel: false
    })
  },
  toDetail: function() {
    let obj = JSON.stringify(this.data.couponDet)
    wx.navigateTo({
      url: '../couponDet/couponDet?couponDet=' + obj,
    })
  },
  toStoreList: function() {
    let obj = JSON.stringify(this.data.storeList)
    wx.navigateTo({
      url: '../store/store?storeList=' + obj,
    })
  },
  clickUse: function() {
    let obj = JSON.stringify(this.data.couponDet)
    wx.navigateTo({
      url: '../useCoupon/useCoupon?couponDet=' + obj,
    })
  },
  clickCall: function() {
    let _this = this
    wx.makePhoneCall({
      phoneNumber: _this.data.storeList[0].phone
    })
  }
})