// pages/AfterSale/serviceSale/serviceSale.js
const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    aftersale:{},
    applyId:'',
    num:2,
    txt:'展开'
  },
  goExpressInfo() {
    wx.navigateTo({ url: `../expressInfo/expressInfo?applyId=${this.data.applyId}`})
  },
  onLoad: function (opt) {
    let _this = this
    if (opt.applyId) {
      _this.setData({
        applyId: opt.applyId
      })
    }
    app.checkUserId(_this.initData)
  },
  initData() {
    let _this = this
    let url = `${app.globalData.baseUrl}/emallMiniApp/chainOrderAfterSale/details/${_this.data.applyId}`
    let _parame = {
      applyId: _this.data.applyId
    }
    utils.$http(url, _parame).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          aftersale: res.result
        })
        console.log(_this.data.aftersale.serviceTrackInfoVos.length)
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  switchList(){
    console.log("111")
    let _this = this
    if (_this.data.txt == '展开'){
      _this.setData({
        txt:'收起',
        num: _this.data.aftersale.serviceTrackInfoVos.length
      })
    }else {
      _this.setData({
        txt: '展开',
        num: 2
      })
    }
  },
  cancelApp() {
    let _this = this
    let url = `${app.globalData.baseUrl}/emallMiniApp/chainOrderAfterSale/cancelApply/${_this.data.applyId}`
    let _parame = {
      applyId: _this.data.applyId
    }
    utils.$http(url, _parame).then(res => {
      if (res && res.result == true) {
        utils.globalShowTip(false)
        _this.initData()
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  }
})