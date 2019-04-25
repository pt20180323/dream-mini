const utils = require('../../../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coupon: '',
    goods: '',
    storeObj: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let _this = this
    _this.setData({
      goodsId: opt.goodsId,
      empId: opt.empId,
      cardId: opt.cardId
    },()=>{
      app.checkUserId(_this.initData)
    })
   
  },
  initData: function() {
    let _this = this
    _this.getStore()
    _this.getCoupon().then(function() {
      _this.getGoods()
    })
  },
  //查询顾问门店信息
  getStore() {
    let _this = this
    let _global = app.globalData
    let params = {
      shopId: _this.data.shopId,
      storeId: _this.data.storeId,
      empId: _this.data.empId
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/emp/info/' + _global.shopId + '/' + _global.storeId + '/' + _this.data.empId, {},'',1).then(res => {
      if (res && res.result) {
        let result = res.result
        _this.setData({
          storeObj: result
        })
      }
    }).catch(error => {})
  },
  //获取优惠券详情
  getCoupon() {
    let _this = this
    let _global = app.globalData
    return new Promise(function(resolve, reject) {
      utils.$http(_global.baseUrl + '/emallMiniApp/voucher/detail/' + _global.shopId + '/' + _this.data.cardId, {}).then(res => {
        utils.globalShowTip(false)
        if (res && res.result) {
          let result = res.result
          _this.setData({
            coupon: result
          })
          resolve()
        }
      }).catch(error => {
        utils.globalShowTip(false)
      })
    })
  },
  //获取商品详情
  getGoods() {
    let _this = this
    let _global = app.globalData
    let {
      coupon,
      goodsId
    } = _this.data
    utils.$http(_global.baseUrl + '/emallMiniApp/goods/detail/' + _global.shopId + '/' + _global.storeId + '/' + goodsId, {}).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        if (coupon.type == 1) {
          if (result.minSalePriceDouble > coupon.conditionAmount) {
            let couponPrice = utils.strip(result.minSalePriceDouble - coupon.amount)
            if (couponPrice >= 0) {
              result.couponPrice = couponPrice
            } else {
              result.couponPrice = 0
            }
          }
        } else if (coupon.type == 2) {
          let couponPrice = utils.strip(result.minSalePriceDouble * coupon.discountAmount)
          if (utils.strip(result.minSalePriceDouble - couponPrice) < coupon.discountLimit) {
            result.couponPrice = couponPrice
          } else {
            result.couponPrice = utils.strip(result.minSalePriceDouble - coupon.discountLimit)
          }
        } else {
          result.couponPrice = result.minSalePriceDouble
        }
        _this.setData({
          goods: result
        })
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  //商品详情
  toDetail() {
    let goods = this.data.goods
    let atype = goods.activityType
    let goodsId = goods.id
    let activivtyId = goods.activityId
    let shopId = goods.shopId
    let storeId = goods.storeId
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&storeId=' + storeId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId + '&storeId=' + storeId + '&shopId=' + shopId
      })
    }
  },
  //领取卡卷
  receiveCoupon() {
    let _this = this
    let _global = app.globalData
    let {
      coupon,
      cardId
    } = _this.data
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/receive/' + _global.shopId + '/' + _global.storeId + '/' + cardId + '/' + coupon.type, {}, 'POST').then(res => {
      utils.globalShowTip(false)
      wx.showToast({
        title: '领取成功,进入商品详情',
        showCancel: false,
        duration: 3000,
        mask: true
      })
      setTimeout(() => {
        _this.toDetail()
      }, 3000)
    }).catch(error => {})
  },
  //去优惠券详情
  toCouponDet: function(e) {
    let _global = app.globalData
    let coupon = this.data.coupon
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&cardId=' + coupon.id + '&isCustom=true'
    wx.navigateTo({
      url: url
    })
  }
})