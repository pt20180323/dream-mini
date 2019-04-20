const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    currentPageTab: 1,
    hasNext: false,
    issubmitting: false,
    isEmpty: false,
    list: [],
    navTab: 1,  // 1:拼团中,4:拼团成功-未完成 5:拼团成功-已完成,3:拼团失败
    unfinishedOrder: false,
    finishedOrder: false
  },
  onLoad(opt) {
    console.log(opt)
    let _this = this
    if (opt) {
      _this.setData({
        navTab: opt.type ? parseInt(opt.type) : 1   //抱团成功的不传2  传4或5
      })
    }
    let _data = _this.data
    let _global = app.globalData
    if (_global.isOrdCancle) {
      _global.isOrdCancle = false
    }
    _data.isAgainRender = true
    app.checkUnionId(_this.initData)
  },
  onShow() {

  },
  onHide() {
    //解决从抱团成功已完成的订单-点击详情  返回订单列表后已完成的订单显示在待收货里
    let _this = this
    let _data = _this.data
    if (_data.navTab === 5) {
      _this.setData({
        navTab: 4
      })
    }
  },
  onUnload() {
    //解决从抱团成功已完成的订单-点击详情  返回订单列表后已完成的订单显示在待收货里
    let _this = this
    let _data = _this.data
    if (_data.navTab === 5) {
      _this.setData({
        navTab: 4
      })
    }
  },
  initData() {
    let _this = this
    _this.getEnvironment()
    //_this.getOrderNum()
  },
  //处理电商用户从企业微信中进入电商不允许下单
  getEnvironment: function () {
    let _this = this
    if (app.globalData.environment) {
      _this.setData({
        environment: app.globalData.environment
      })
    }
  },
    //TODO 抱团购
  //获取订单数量
  // getOrderNum() {
  //   let _this = this
  //   let _global = app.globalData
  //   let param = {
  //     shopId: _global.shopId,
  //     buyerId: _global.buyerId,
  //     status: 4
  //   }
  //   utils.$http(_global.baseUrl + '/elshop/my/getMyOrderNum', param).then(res => {
  //     if (res) {
  //       utils.globalShowTip(false)
  //       _this.renderTeamOrderTotal(res.result)
  //     }
  //   }).catch(res => {})
  // },
  renderTeamOrderTotal(res) {
    let _this = this
    let _data = _this.data
    _this.setData({
      teamOrder: res,
      unfinishedOrder: res.orderNum ? true : false,
      finishedOrder: !res.orderNum && res.succeed ? true : false
    })
    if ((_data.navTab === 4 || _data.navTab === 5) && !res.unfinished) {
      _this.setData({
        navTab: 5
      },()=>{
        _this.getList()
      })
    } else {
      _this.getList()
    }
  },
  getList() {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    let curPage = 1
    if (_data.isAgainRender) {
      _data.list = []
      _data.isAgainRender = false
      curPage = 1
    } else {
      curPage = _data.currentPageTab
    }
    if (_data.teamOrder.orderNum === 4) {

    }
    let _param = {
      pageSize: 3,
      pageNum: curPage,
      status: idx,
      buyerId: app.globalData.buyerId,
      shopId: app.globalData.shopId
    }
    utils.$http(app.globalData.baseUrl + '/elshop/my/getOrder', _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderList(res)
      }
    }).catch(res => {
      utils.globalShowTip(false)
      console.log(res)
    })
  },
  renderList: function (res) {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    let _list = res.result.resultList || []
    let _rst = res.result
    _this.setData({
      totalNums: _rst.orderNum || 0,
      list: _this.data.list.concat(_list),
      hasNext: _rst.hasNext,
      issubmitting: false
    }, () => {
      _this.setData({
        isEmpty: !_data.list.length
      })
    })
  },
  changeTab(evt) {
    let _this = this
    let _data = _this.data
    let dts = evt.target.dataset
    let teamOrder = _data.teamOrder
    if (parseInt(dts.type) === 2) { //首页是抱团成功的单
      if (teamOrder && teamOrder.orderNum) {
        //有未完成的单
        _this.setData({
          navTab: 4
        })
      } else {
        //全都是已完成的单
        _this.setData({
          navTab: 5
        })
      }
    } else {
      _this.setData({
        navTab: parseInt(dts.type)
      })
    }
    _this.setData({
      isAgainRender: true,
      currentPageTab: 1
    })
    if (_data.teamOrder && _data.teamOrder.orderNum) {
      _this.setData({
        unfinishedOrder: true,
        finishedOrder: false
      })
    } else {
      _this.setData({
        unfinishedOrder: false,
        finishedOrder: true
      })
    }
    _this.getList()
  },
  onScrollLower: function (event) {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    if (!_this.data.hasNext) { //没有下一页
      return false
    }
    if (_this.data.issubmitting) {
      return false
    }
    _this.setData({
      currentPageTab: ++_data.currentPageTab,
      issubmitting: true
    })
    _this.getList()
  },
  toDetail: function (event) {
    var productId = event.currentTarget.dataset.productId;
    wx.navigateTo({
      url: '../orderDet/orderDet?orderNo=' + productId
    })
  },
  cancleOrder: function (no) {
    let _this = this
    let _param = {
      buyerId: app.globalData.buyerId,
      storeId: app.globalData.storeId,
      orderNo: no
    }
    if (_this.data.isCancling) {
      return false
    }
    _this.data.isCancling = true
    utils.globalShowTip(true)
    wx.request({
      url: app.globalData.baseUrl + '/elshop/my/cancelOrders',
      data: _param,
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (res) {
        if (res && res.data) {
          const returnCode = parseInt(res.data.code);
          if (returnCode !== 0) {
            utils.globalShowTip(false)
            _this.data.isCancling = false
            wx.showToast({
              title: res.data.message || '网络异常，请稍后重试！',
              icon: 'none',
              mask: true,
              //image: '',
              duration: 1000
            })
            return false
            wx.showModal({
              title: '温馨提示',
              content: res.data.message || '网络异常，请稍后重试！',
              success: function (res) {

              },
              showCancel: false
            })
          } else if (returnCode === 0) { //1表示接口成功调用
            _this.renderCancle(res.data)
          }
        }
      },
      fail: function (error) {
        wx.showModal({
          title: '温馨提示',
          content: '取消订单失败，请稍候再试！',
          success: function (res) {
            _this.data.isCancling = false
          },
          showCancel: false
        })
      }
    })
  },
  renderCancle: function (res) {
    let _this = this
    _this.data.isCancling = false
    utils.globalShowTip(false)
    if (res.result && parseInt(res.result.flag) === 1) {
      _this.data.isAgainRender = true
      _this.getList()
    }
  },
  setFormId: function (evt) {
    console.log(evt)
    let formId = evt.detail.formId
    let dst = evt.target.dataset
    let ord = dst.orderno
    if (ord && ord !== '') {
      this.cancleOrder(ord)
    }
    app.saveFormId(formId)
  },
  showOrder(e) {
    let _this = this
    let _dst = e.currentTarget.dataset
    let idx = parseInt(_dst.idx)
    let unfinishedOrder = _this.data.unfinishedOrder
    let finishedOrder = _this.data.finishedOrder
    console.log(idx, _this.data.unfinishedOrder)
    _this.setData({
      unfinishedOrder: idx === 4 ? (unfinishedOrder ? false : true) : false,
      finishedOrder: idx === 5 ? (finishedOrder ? false : true) : false,
      navTab: idx,
      list: [],
      isAgainRender: true,
      currentPageTab: 1
    })
    _this.getList()
  },
  //提醒发货
  remindGood() {
    let _this = this
    let _param = {
      shopId: app.globalData.shopId
    }
    let url = `${app.globalData.baseUrl}/emallMiniApp/shop/base/${_param.shopId}`
    utils.$http(url, {}).then(res => {
      const returnCode = parseInt(res.code)
      if (returnCode === 0) {
        _this.renderRemind(res)
      }
    })
  },
  renderRemind(res) {
    let _this = this
    utils.globalShowTip(false)
    if (res) {
      wx.makePhoneCall({
        phoneNumber: res.result.phone
      })
    }
  },
  // 确认收货
  confirmReceipt(e) {
    let _this = this
    let _global = app.globalData
    let _dst = e.currentTarget.dataset
    let _param = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      orderNo: _dst.orderNo
    }
    let url = `${_global.baseUrl}/emallMiniApp/orders/confirmDeliveryOrder/${_param.shopId}/${_param.storeId}/${_param.orderNo}`
    utils.$http(url, {}, 'POST').then(res => {
      const returnCode = parseInt(res.code)
      if (returnCode === 0) {
        _this.renderConfirm(res)
      }
    })
  },
  renderConfirm: function (res) {
    let _this = this
    utils.globalShowTip(false)
    wx.showToast({
      title: '确认收货成功',
      icon: 'success',
      duration: 2000,
      success: function (res) {
        _this.setData({
          list:[]
        })
        _this.initData()
      }
    })
  }
})