const utils = require('../../utils/util.js')
//获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    expresList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    let orderNo = options.orderNo;
    utils.$http(app.globalData.baseUrl + "/emallMiniApp/orders/getExpressTraceInfoByExpressOrderNo/" + orderNo).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.expresList(res)
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  expresList: function (res) {
    console.log(res)
    this.setData({
      expresList: res.result,
    })
    console.log(this.data.expresList);
  },
})