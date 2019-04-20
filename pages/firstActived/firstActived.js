const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
  
  },
  onLoad(opt){
    let _this = this
    let _global = app.globalData
    _global.isActive = true
    if (opt.bindEmpId && opt.bindEmpId !== '') {
      app.globalData.bindEmpId = opt.bindEmpId
    }
    app.checkUnionId(()=>{
      utils.globalShowTip(false)
      if (parseInt(app.globalData.bindStatus)) {
        wx.setStorageSync('_isNeedLoadB', true)
        _this.setData({
          actived: true
        })
        _global.isActive = false
      }else{
        wx.showToast({
          title: '激活失败',
          icon: 'none',
          duration: 3000,
          mask: true
        })
      }
    })
  },
  gotoIndex(){
    let _this = this
    let _global = app.globalData
    let _url = `pages/index/index`
    console.log(_url)
    wx.navigateToMiniProgram({
      appId: _global.jumpAppId,
      path: _url,
      extraData: {
        'type': 'zhiyuan'
      },
      envVersion: 'develop',
      success(res) {
        console.log('jumped suc')
      },
      fail(res) {
        console.log(res)
      }
    })
  }
})