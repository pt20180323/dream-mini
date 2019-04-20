const utils = require('../../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isLoaded: false
  },
  onLoad(opt) {
    if (opt) {
      this.setData({
        selected: opt.addId || '',
        deliveryType: opt.deliveryType || 1,
        goodsId: opt.goodsId || ''
      })
    }
  },
  onShow(){
    let _global = app.globalData
    let _this = this
    if (_global.updateAddr) {
      _this.setData({
        selected: _global.addId
      })
    }
    console.log(_this.data.list)
    if (!_this.data.list || !_this.data.list.length) {
      app.globalData.addId = ''
      app.globalData.updateAddr = false
      app.globalData.sendAddObj = ''
    }
    app.checkUnionId(this.initData)
  },
  initData() {
    let _global = app.globalData
    utils.$http(`${_global.baseUrl}/emallMiniApp/address/list/${_global.shopId}/${_global.storeId}`, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.listRender(res)
      }
    })
  },
  listRender(res) {
    console.log(res)
    let _rst = res.result
    this.setData({
      list: _rst,
      isLoaded: true
    })
  },
  selectAddr(e){
    let _this = this
    let _dts = e.currentTarget.dataset
    if (_dts.defect) {
      utils.globalToast('地址不完善，不可选择！', 'none')
      return false
    }
    let addId = _dts.aid
    let addrInfo = _dts.item
    _this.setData({
      selected: addId
    })
    app.globalData.addId = addId
    app.globalData.updateAddr = true
    app.globalData.sendAddObj = addrInfo
    wx.navigateBack({
      delta: 1
    })
  }
})