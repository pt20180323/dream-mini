const utils = require('../../../../utils/util.js')
let app = getApp()
Page({
  data: {
    array: [],
    index: 0,
    date: '',
    today: new Date(),
    applyId: '',
    freight: '',
    singleNo: ''
  },
  onLoad: function (opt) {
    let _this = this
    let { applyId, isset } = opt
    if (applyId) _this.setData({applyId})
    app.checkUnionId(_this.getExp)
    if (Number(isset)) app.checkUnionId(_this.setExp()) // 修改快递信息
  },
  setExp() {
    let _this = this
    let { applyId } = _this.data
    let url = `${app.globalData.baseUrl}/emallMiniApp/refund/getDeliveryInfo/${applyId}`
    let _parame = {applyId}
    utils.$http(url, _parame).then(res => {
      let rst = res && res.result
      if (rst) {
        let { array, index } = _this.data
        utils.globalShowTip(false)
        array.map((item,i) => {
          if (rst.expressCompany == item) {
            index = i
          }
        })
        _this.setData({
          index,
          singleNo: rst.expressCode,
          freight: rst.freightMoney,
          date: utils.formatDay(rst.deliverDate, '-')
        })
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  getExp() {
    let _this = this
    let url = `${app.globalData.baseUrl}/emallMiniApp/chainOrderAfterSale/getExpressCompany/${_this.data.applyId}`
    let _parame = {
      applyId: _this.data.applyId
    }
    utils.$http(url, _parame).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          array: res.result
        })
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  bindPickerChange(e) {
    this.setData({
      index: e.detail.value
    })
  },
  bindDateChange(e) {
    this.setData({
      date: e.detail.value
    })
  },
  prompt(txt) {
    wx.showToast({
      title: txt,
      icon: 'none',
      duration: 1000,
      mask: true
    })
  },
  bindKeySingleNo: function (e) {
    this.setData({
      singleNo: e.detail.value
    })
  },
  bindKeyFreight: function (e) {
    this.setData({
      freight: e.detail.value
    })
  },
  submitInfo() {
    let _this = this
    let reg = /^[A-Za-z0-9]+$/
    if (!_this.data.singleNo) {
      _this.prompt("快递单号不能为空!")
      return
    }
    if (!reg.test(_this.data.singleNo)) {
      _this.prompt("快递单号有误，请重新填写!")
      return
    }
    if (!_this.data.freight) {
      _this.prompt("运费不能为空!")
      return
    }
    if (!_this.data.date) {
      _this.prompt("发货日期不能为空!")
      return
    }
    _this.getInfo()
  },
  getInfo() {
    let _this = this
    let url = `${app.globalData.baseUrl}/emallMiniApp/refund/saveDeliveryInfo`
    let _parame = {
      id: _this.data.applyId,
      deliverDate: _this.data.date,
      expressCode: _this.data.singleNo,
      expressCompany: _this.data.array[_this.data.index],
      freightMoney: _this.data.freight
    }
    console.log(_parame)
    utils.$http(url, _parame, 'POST', false, 'JSON').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.prompt("填写成功!")
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  }
})