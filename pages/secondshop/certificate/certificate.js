const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
  },
  onLoad: function (options) {
    let _this = this
    var orderNo = options.orderNo;
    console.log(orderNo);
    let _param = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      ordersNo: orderNo
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/orders/takeDelivery/' + _param.shopId + '/' + _param.storeId + '/' + _param.ordersNo, {}).then(res => {
      if (res) {
        console.log(res)
        utils.globalShowTip(false)
        _this.renderCertiticate(res)
        _this.getStoreDetail(res)
      }
    })
  },
  renderCertiticate: function (res) {
    let _this = this
    console.log(res);
    for (var i = 0; i < res.result.ordersDetails.length; i++) {
      var skuN = '';
      if (res.result.ordersDetails[i].modelType) {
        let aa = new Array();
        aa = res.result.ordersDetails[i].modelType.split('|');
        if (aa != null && aa != '') {
          if (aa[0] != null && aa[0] != '') {
            skuN = aa[0];
            res.result.ordersDetails[i].skuN = skuN;

          }
        }
      }
    }
    _this.setData({
      vo: res.result
    })
  },
  getStoreDetail(res) {
    let _this = this
    let _global = app.globalData
    let rst = res.result
    let _param = {
      shopId: _global.shopId,
      storeId: rst.arriveStoreId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/store/show/store/' + _param.shopId + '/' + _param.storeId, {}).then(res => {
      if (res) {
        let _rst = res.result
        utils.globalShowTip(false)
        _this.setData({
          storeDetailInfo: _rst
        })
      }
    })
  },
  showAddr: function (e) {
    let _this = this
    let _data = _this.data
    let _storeDetailInfo = _data.storeDetailInfo
    let latitude = _storeDetailInfo.tencentLat
    let longitude = _storeDetailInfo.tencentLng
    utils.globalShowTip(true)
    wx.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: _storeDetailInfo.name,
      address: _storeDetailInfo.fullCircleName + _storeDetailInfo.address,
      scale: 28,
      success: function () {
        utils.globalShowTip(false)
      }
    })
  }
})