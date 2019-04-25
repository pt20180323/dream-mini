const utils = require('../../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isIpx: false,
    couponList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    this.setData({
      hyId: opt.cusId || ''
    })
    app.checkUserId(this.getCouponList)
  },
  //获取优惠券列表
  getCouponList: function(pageNo) {
    let _this = this
    let _global = app.globalData
    _this.setData({
      pageNo: pageNo || 1,
      isIpx:_global.isIpx
    })
    let params = {}
    let couponId = _this.data.couponId
    if(couponId){
      params.cardId = couponId
      _this.data.couponId = couponId
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/cardListData/' + _global.shopId + '/' + _global.storeId +'/' +  _this.data.pageNo, params, 'POST').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        _this.setData({
          hasNextPage: result.hasNextPage
        })
        if (_this.data.pageNo === 1) {
          _this.setData({
            couponList: result.result
          })
        } else {
          _this.setData({
            couponList: _this.data.couponList.concat(result.result)
          })
        }
        if (!_this.data.couponList.length) {
          _this.setData({
            isshowEmpty: true
          })
        } else {
          _this.setData({
            isshowEmpty: false
          })
        }
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  onReachBottom: function() {
    let _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getCouponList(_this.data.pageNo + 1)
    }
  },
  //单项选择
  check: function(e) {
    let {index} = e.currentTarget.dataset
    let {couponList} = this.data
    couponList.forEach((item, idx) => {
      if (idx === index) {
        item.isSelect = !item.isSelect
        this.data.couponId = item.isSelect ? item.id : ''
        this.data.cardType = item.type
      } else {
        item.isSelect = false
      }
    })
    this.setData({
      couponList: couponList
    })
  },
  //保存优惠券
  sureBtn: function() {
    let couponId = this.data.couponId
    let cardType = this.data.cardType
    if (!couponId) {
      wx.showToast({
        title: '请选择一个优惠券',
        icon:'none'
      })
    } else {
      let params = {
        type: 2,
        byOperator: couponId,
        hyId:this.data.hyId
      }
      app.recordServiceData(params.type,params.byOperator,params.hyId)
      wx.navigateTo({
        url: '/pages/account/account?couponId=' + couponId + '&cardType=' + cardType
      })
    }
  },
  //去优惠券详情
  toCoupon:function(e){
    let {shopId} = app.globalData
    let {id} = e.currentTarget.dataset
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + shopId + '&cardId=' + id
    wx.navigateTo({
      url:url
    })
  }
})