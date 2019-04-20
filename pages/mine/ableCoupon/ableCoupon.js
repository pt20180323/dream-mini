const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isshowEmpty: false,
    couponList: []
  },
  onLoad: function (opt) {
    let _this = this
    //type=7  秒杀 普通购买  type=12 抱团
    _this.setData({
      optype: parseInt(opt.type)
    })
    if (app.globalData.ableCoupon && app.globalData.ableCoupon.length) {
      _this.setData({
        couponList: app.globalData.ableCoupon
      })
    } else {
      app.checkUnionId(_this.getCalcVoucher)
    }
  },
  // 获取用户代金券
  getCalcVoucher: function () {
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let url = ''
    let params = {
      shopId: _data.shopId || gData.shopId,
      storeId: _data.storeId || gData.storeId,
      buyerId: _data.buyerId || app.globalData.buyerId
    }
    
    if (_data.optype === 7) { //秒杀 普通购买
      url = `${gData.baseUrl}/seckill-miniapp/ordered/vouchers/${params.shopId}/${params.storeId}`
    }
    if (_data.optype === 12) { //抱团
      url = `${gData.baseUrl}/elshop/teamShop/confirm/vouchers`
    }
    utils.$http(url, params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderVouchers(res)
      }
    })
  },
  renderVouchers: function (res) {
    let _this = this
    if (res) {
      let rst = res.result
      _this.setData({
        couponList: rst || []
      })
      if (!_this.data.couponList.length) {
        _this.setData({
          isshowEmpty: true
        })
      }
    }
  },
  selectCoupon: function (evt) {
    let _this = this
    let _list = _this.data.couponList
    let dst = evt.target.dataset
    let idx = parseInt(dst.idx)
    if (dst.able === 'no') {
      _this.setData({
        selectNo: true
      })
      app.globalData.selectNo = dst.able
      _this.setData({
        couponList: _list
      })
      wx.navigateBack({
        delta: 1
      })
      return false
    }
    app.globalData.selectNo = false
    if (parseInt(dst.able) === 0) {
      return false
    }
    app.globalData.voucherCode = dst.code
    _list.forEach(function (itm, i) {
      if (idx === i) {
        itm.selected = true
      } else {
        itm.selected = false
      }
    })
    _this.setData({
      couponList: _list
    })
    //app.globalData.ableCoupon = _list
    wx.navigateBack({
      delta: 1
    })
  }
})