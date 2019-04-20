const utils = require('../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    serviceData: [
      { name: '退货', id: 10, disabled: true, content: '未收到货或已收到货，需要退换已收到的货物'},
      { name: '换货', id: 20, disabled: true, content: '已收到货，需要更换已收到的货'},
      { name: '维修', id: 30, disabled: true, content: '在保质期内，商品出现问题需要维修'}
    ],
    GiftData: null, // 赠品及附件列表
    saleData: null // 详情列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {
    let { orderNo, detailNo } = opt
    console.log(opt)
    this.setData({orderNo, detailNo})
    console.log(this.data)
    // 获取售后申请详情
    app.checkUnionId(this.getToOrderAfterSale)
  },
  // 获取售后申请详情GET
  getToOrderAfterSale () {
    let that = this
    let { storeId, baseUrl } = app.globalData
    let { orderNo, detailNo, serviceData} = that.data
    utils.$http(`${baseUrl}/emallMiniApp/chainAfterSale/toOrderAfterSale/${storeId}/${orderNo}/${detailNo}`, {}).then(res => {
      utils.globalShowTip(false)
      let _rst = res && res.result
      if (_rst) {
        let Explist = _rst.customerExpectList
        if (Explist && Explist.length) {
          serviceData.map(item => {
            // 判断 返回数据里支持什么服务
            if (Explist.includes(item.id)) {
              // 如果有参数，就取消禁用
              item.disabled = false
            }
          })
        }
        that.setData({
          saleData: _rst,
          serviceData
        })
        // 获取订单明细对应的附件和赠品
        that.getGiftInfo()
      }
    })
  },
  // 获取订单明细对应的附件和赠品 GET /chainAfterSale/queryOrdersGiftInfo/{orderNo}/{detailNo
  getGiftInfo () {
    let that = this
    let { baseUrl } = app.globalData
    let { orderNo, detailNo } = that.data
    utils.$http(`${baseUrl}/emallMiniApp/chainAfterSale/queryOrdersGiftInfo/${orderNo}/${detailNo}`, {}).then(res => {
      utils.globalShowTip(false)
      let _rst = res && res.result
      if (_rst) {
        console.log(_rst)
        that.setData({
          GiftData: _rst
        })
      }
    })
  },
  goHandle(e) {
    let { isdisabled, id } = e.currentTarget.dataset
    let {GiftData, saleData} = this.data
    // 如果显示禁用就不跳转
    if (isdisabled) return false
    let detData = Object.assign({}, saleData, GiftData)
    // 把当前详情信息存到本地缓存
    wx.setStorage({
      key: 'detData',
      data: detData,
      success() {
        wx.redirectTo({ url: `./handleDetails/handleDetails?id=${id}`})
      }
    })
  }
})