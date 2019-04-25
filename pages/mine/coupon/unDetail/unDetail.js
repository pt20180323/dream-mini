const utils = require('../../../../utils/util.js')
let app = getApp()
Page({
  data: {
    pageBackgroundColor: '',
    isSending: false, //是否发送
    isReceive: false //是否领取
  },
  onLoad(opt) {
    let _this = this
    let _data = _this.data
    if (opt) {
      _this.setData({
        isCustom: opt.isCustom || '',
        shopId: opt.shopId || '',
        cardId: opt.cardId || ''
      })
    }
  },
  onShow(){
    app.checkUserId(this.initData)
  },
  initData(){
    this.getVoucherDetail()
  },
  getVoucherDetail() {
    let _this = this
    let _data = _this.data
    let _gd = app.globalData
    let _param = {
      shopId: _data.shopId || _gd.shopId,
      cardId: _data.cardId
    }
    utils.$http(_gd.baseUrl + '/emallMiniApp/voucher/detail/' + _param.shopId + '/' + _param.cardId, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.voucherDetail(res)
      }
    })
  },
  voucherDetail(res) {
    let _this = this
    let _data = _this.data
    let _rst = res.result

    if (_rst.type === 1) {
      wx.setNavigationBarTitle({
        title: '代金券'
      })
    } else if (_rst.type === 2) {
      wx.setNavigationBarTitle({
        title: '折扣券'
      })
    } else if (_rst.type === 3) {
      wx.setNavigationBarTitle({
        title: '礼品券'
      })
    }
    _this.setData({
      couponDet: _rst,
      pageBackgroundColor: _rst.color,
    })
    let _param = {
      shopId: _data.shopId || app.globalData.shopId,
      cardId: _data.cardId,
    }
    let params = {
      useStoreType: _rst.useStoreType
    }
    //获取当前的位置
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        params.longitude = longitude
        params.latitude = latitude
        _this.voucherDetailStore(_param, params)
      },
      fail(res) {
        _this.voucherDetailStore(_param, params)
      }
    })
  },
  voucherDetailStore(_param, params) {
    let _this = this
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/verifyStores/' + _param.shopId + '/' + _param.cardId, params, '', 1).then(res => {
      if (res) {
        _this.setData({
          storeList: res.result
        })
      }
    })
  },
  //领取卡卷
  clickReceive() {
    let _this = this
    let _global = app.globalData
    let coupon = _this.data.couponDet
    let params = {
      shopId: _this.data.shopId || _global.shopId,
      storeId: _global.storeId,
      cardCommId: _this.data.cardId,
      cardType: coupon.type
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/receive/' + params.shopId + '/' + params.storeId + '/' + params.cardCommId + '/' + params.cardType, {}, 'POST').then(res => {
      utils.globalShowTip(false)
      _this.setData({
        isReceive: true
      })
      _this.initData()
      setTimeout(() => {
        wx.addCard({
          cardList: JSON.parse(res.result),
          success(res) {
            console.log(res.cardList) // 卡券添加结果
          },
          complete(res) {
            console.log(res)
          },
          fail(res) {
            console.log(res)
          }
        })
      }, 2000)
    }).catch(error => {
      // utils.globalShowTip(false)
    })
  },
  toDetail() {
    let obj = JSON.stringify(this.data.couponDet)
    wx.navigateTo({
      url: '../couponDet/couponDet?couponDet=' + obj,
    })
  },
  toStoreList() {
    let obj = JSON.stringify(this.data.storeList)
    wx.navigateTo({
      url: '../store/store?storeList=' + obj,
    })
  },
  onShareAppMessage(res) {
    let _this = this
    let _data = _this.data
    let _url = 'pages/mine/coupon/unDetail/unDetail?shopId=' + (_data.shopId || app.globalData.shopId) + '&cardId=' + _data.cardId + '&isCustom=true'
    _this.setData({
      isSending: true
    })
    return {
      title: _data.couponDet.name,
      path: _url,
      imageUrl: '/static/img/card_share.jpg',
      success(res) {
        // 转发成功
      },
      fail(res) {
        // 转发失败
      }
    }
    _this.initData()
  },
  clickCall() {
    let _this = this
    wx.makePhoneCall({
      phoneNumber: _this.data.storeList[0].phone
    })
  }
})