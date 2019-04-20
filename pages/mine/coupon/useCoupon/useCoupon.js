// pages/mine/coupon/useCoupon/useCoupon.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageBackgroundColor: '',
    couponDet: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {
    let obj = JSON.parse(opt.couponDet)
    if (obj.cardType === 1) {
      wx.setNavigationBarTitle({
        title: '代金券'
      })
    } else if (obj.cardType === 2) {
      wx.setNavigationBarTitle({
        title: '折扣券'
      })
    } else if (obj.cardType === 3) {
      wx.setNavigationBarTitle({
        title: '礼品券'
      })
    }
    this.setData({
      couponDet: obj,
      pageBackgroundColor: obj.color
    })
  },
  cancel: function () {
    wx:wx.navigateBack({
      delta: 1
    })
  }
})