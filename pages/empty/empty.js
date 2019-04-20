const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {

  },
  onLoad(options) {
    let _this = this
    //扫码进来后页面显示加载中
    utils.globalShowTip(true)
    // 获取二维码的scene
    let scene = decodeURIComponent(options.scene)
    if (scene && scene !== 'undefined') {
      if (scene === '0') {
        //跳活动首页
        wx.switchTab({
          url: '/pages/home/home',
        })
      } else {
        _this.setData({
          scene: scene
        })
        _this.getMiniPage()
      }
    }
  },
  //获取小程序路径
  getMiniPage() {
    let _this = this
    let _gd = app.globalData
    let _appId = _gd.appId
    let _prm = {
      appId: _appId || '',
      scene: _this.data.scene
    }
    utils.$http(`${_gd.baseUrl}/emallMiniApp/wx/mini/miniPage/appId/${_prm.appId}/${_prm.scene}`, {}).then(res => {
      let _pageUrl = ''
      if (res && res.result) {
        _pageUrl = res.result
        if (!/^\//.test(_pageUrl)) { //判断是否以/开头
          _pageUrl = "/" + _pageUrl
        }
      } else {
        _pageUrl = '/pages/home/home'
      }
      /*
      if (_pageUrl.indexOf('storeId') != -1) {
        app.globalData.shareStoreId = utils.getStr(_pageUrl, 'storeId')
      }
      */
      let empId = _this.getParam(_pageUrl, 'empId')
      let storeId = _this.getParam(_pageUrl, 'storeId')
      if (empId) {
        app.globalData.shareEmpId = empId
      }
      if (storeId) {
        app.globalData.shareStoreId = storeId
      }
      app.globalData.unionId = ''
      wx.reLaunch({
        url: _pageUrl
      })
    }).catch(res => {})
  },
  getParam(url, name) {
    var value = (url || location.href).match(new RegExp('\\?(?:.+&)?' + name + '=(.*?)(?:&.*)?$'))
    return value ? value[1] : ''
  }
})