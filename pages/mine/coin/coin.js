const utils = require('../../../utils/util.js')
let app = getApp()

Page({
  data: {
  },
  onLoad(opt) {
    let _this = this
    if (opt.integral) {
      _this.setData({
        integral: opt.integral
      })
    }else if(opt.idCard){
      _this.setData({
        idCard: opt.idCard
      })
    }
    app.checkUserId(this.initWeb)
  },
  initWeb() {
    utils.globalShowTip(false)
    let _this = this
    let _global = app.globalData
    let _url
    if (_this.data.integral) {
      _url = `${_global.fansBaseUrl}/wap/integral/welcome/${_global.shopId}?openId=${_global.wxOpenId}&_environment=wxminiapp&_r=${new Date().getTime()}&wxMiniAppId=${_global.appId}&wxMiniOpenId=${_global.openId}`
    } else if (_this.data.idCard) {
      _url = `${_global.fansBaseUrl}/wap/member/welcome/${_global.shopId}?openId=${_global.wxOpenId}&_environment=wxminiapp&_r=${new Date().getTime()}&wxMiniAppId=${_global.appId}&wxMiniOpenId=${_global.openId}`
    } else {
      _url = `${_global.fansBaseUrl}/wap/stored/welcome/${_global.shopId}?openId=${_global.wxOpenId}&_environment=wxminiapp&_r=${new Date().getTime()}&wxMiniAppId=${_global.appId}&wxMiniOpenId=${_global.openId}`
    }
    this.setData({
      coinSrc: _url
    })
  }
})