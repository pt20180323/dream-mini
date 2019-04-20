const utils = require('../../../../utils/util.js')
Page({
  data: {
    storeList: []
  },
  onLoad(opt) {
    let obj = JSON.parse(opt.storeList)
    this.setData({
      storeList: obj
    })
  },
  showAddr: function(e) {
    let _this = this
    let dataSet = e.currentTarget.dataset
    let latitude = dataSet.latitude
    let longitude = dataSet.longitude
    utils.globalShowTip(true)
    wx.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: dataSet.name,
      address: dataSet.address,
      scale: 28,
      success:function(){
        utils.globalShowTip(false)
      }
    })
  }
})