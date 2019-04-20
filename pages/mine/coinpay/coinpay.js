Page({
  data: {

  },
  onLoad(opt){
    wx.requestPayment({
      timeStamp: opt.timeStamp,
      nonceStr: opt.nonceStr,
      'package': 'prepay_id=' + opt.prepayId,
      signType: opt.signType,
      paySign: opt.paySign,
      success(res){
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1000
        })
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1200)
      },
      fail(res){
        console.log(res)
        wx.navigateBack({
          delta: 1
        })
      }
    })
  }
})