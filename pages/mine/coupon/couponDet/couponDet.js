// pages/mine/coupon/couponDet/couponDet.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponDet: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {
    let obj = JSON.parse(opt.couponDet)
    console.log(obj)
    if (obj.cardType === 1) {
      wx.setNavigationBarTitle({
        title: '代金券详情'
      })
    } else if (obj.cardType === 2) {
      wx.setNavigationBarTitle({
        title: '折扣券详情'
      })
    } else if (obj.cardType === 3) {
      wx.setNavigationBarTitle({
        title: '礼品券详情'
      })
    }
    this.setData({
      couponDet: obj
    })
  }
})