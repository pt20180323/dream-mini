const utils = require('../../utils/util.js')
const app = getApp()
Page({
  data: {},
  onLoad(opt) {
  },
  authorizeBtn() {
    let that = this
    if (wx.openSetting) {
      wx.openSetting({
        success: function (res) {
          res.authSetting = {
            "scope.userInfo": true,
            "scope.userLocation": true
          }
          wx.switchTab({ url: '/pages/home/home' })
        }
      })
    } else {
      wx.showModal({
        title: '授权提示',
        content: '小程序需要您的微信授权才能使用',
      })
    }
  },
  onGotUserInfo: function (e) {
    let _dt = e.detail
    let _msg = _dt.errMsg
    let _gd = app.globalData
    _gd.code = ''
    if (_msg === 'getUserInfo:ok') {
      let _page = _gd.authToPage
      let _url = _page.indexOf('/') !== 0 ? ('/' + _page) : _page
      wx.reLaunch({
        url: _url
      })
    }
  }
})