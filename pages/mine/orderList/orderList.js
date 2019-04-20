const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    list: [],
    navTab: 0, // 0:待付款,2:待发货,3:待收货,4:已完成,6:退款 -1:全部
    isshowEmpty: false,
    loading:false,
    isLastPage:false,
    noMsg:'暂无订单'
  },
  onLoad(opt) {
    let _this = this
    if (opt) {
      this.setData({
        navTab: opt.type ? parseInt(opt.type) : 0
      })
    }
    _this.getEnvironment()
    app.checkUnionId(_this.getList)
  },
  // 整单退款按钮
  toRefund(e) {
    let { orderno } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mine/refund/refund?orderNo=${orderno}`
    })
  },
  //处理电商用户从企业微信中进入电商不允许下单
  getEnvironment() {
    let _this = this
    if (app.globalData.environment) {
      _this.setData({
        environment: app.globalData.environment
      })
    }
  },
  getList(pageNo) {
    let _this = this
    _this.data.pageNo = pageNo || 1
    let {
      storeId,
      shopId,
      baseUrl
    } = app.globalData
    let {
      navTab
    } = _this.data
    let url = `${baseUrl}/emallMiniApp/orders/orderCenter/list/${shopId}/${storeId}/${navTab}/${_this.data.pageNo}`
    if (navTab == 6) {
      url = `${baseUrl}/emallMiniApp/orders/orderCenter/list/refund/${shopId}/${storeId}/${_this.data.pageNo}`
    }
    utils.$http(url, {},'',_this.data.loading).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderList(res)
      }
    })
  },
  renderList(res) {
    let _this = this
    let navTab = parseInt(this.data.navTab)
    let _list = res.result.result
    _this.setData({
      isLastPage:!res.result.hasNextPage,
      loading:false
    })
    console.log(_list)
    // 把订单状态值转换为文本提示
    _list.map(item => {
      let text = ''
      switch (item.status) {
        case 0: text = '待付款'
          break;
        case 1: text = '商家取消'
          break;
        case 2: text = '已付款'
          break;
        case 3: text = item.orderType === 1 && '快递配送' || item.orderType === 2 && '门店自提' || item.orderType === 3 && '商家配送' || '已发货'
          break;
        case 4: 
          text = item.orderType !== 2 && item.refundType != 2 && '已签收' || item.orderType === 2 && '已提货' || '已完成'
          if (item.refundStatus == 1) {
            if (item.detailStatus == 6) text = '等待商家同意'
            if (item.detailStatus == 7) text = '等待买家退货'
            if (item.detailStatus == 8) text = '等待商家收货'
            if (item.detailStatus == 9) text = '退款完成'
          }
          break;
        case 5: text = '用户取消'
          break;
        case 6:
          text = item.refundStatus == 1 && item.detailStatus == 6 && '等待商家同意' || item.refundStatus == 0 && '退款失败' || '等待商家同意退款'
          break;
        case 7: text = '等待买家退货'
          break;
        case 8: text = '等待商家收货'
          break;
        case 9: text = '退款完成'
          break;
        case 10: text = '超时取消'
          break;
        case 20: text = '待商户审核'
          break;
        case 28: text = '企业审核通过'
          break;
        case 29: text = '企业审核拒绝'
          break;
        case 71: text = '待平台审核'
          break;
        case 72: text = '平台审核通过'
          break;
        case 73: text = '平台审核拒绝'
          break;
        case 74: text = '待用户发货'
          break;
        case 75: text = '待商户收货'
          break;
        case 76: text = '已收货'
          break;
        case 80: text = '退款成功'
          break;
        case 90: text = '用户取消(退款关闭)'
          break;
        case 91: text = '商户取消(退款关闭)'
          break;
        default: text = '暂无状态'
      }
      item.statusName = text
    })
    if (_this.data.pageNo === 1) {
      _this.setData({
        list: _list
      })
    } else {
      _this.setData({
        list: _this.data.list.concat(_list)
      })
    }
    if (!_this.data.list.length) {
      _this.setData({
        isshowEmpty: true
      })
    } else {
      _this.setData({
        isshowEmpty: false
      })
      if (navTab == 0) {
        let array = _this.data.list.map(item => {
          item.payTimeFormat = utils.milliSecondToDate(item.payTimeCountDown)
          item.payTimeCountDownA = parseInt(item.payTimeCountDown / 60)
          return item
        })
        _this.setData({
          list: array
        })
      }
    }
  },
  toCertiticate(evt) {
    let {
      orderNo
    } = evt.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/secondshop/certificate/certificate?orderNo=' + orderNo
    })
  },
  toexpress (evt) {
    console.log(evt)
    let orderNo = evt.currentTarget.dataset.orderNo
    wx.navigateTo({
      url: '/pages/expressDelivery/expressDelivery?orderNo=' + orderNo
    })
  },
  changeTab(evt) {
    let dts = evt.target.dataset
    this.setData({
      navTab: parseInt(dts.type)
    })
    wx.pageScrollTo({
      scrollTop: 0,
    })
    this.getList()
  },
  onReachBottom() {
    if (!this.data.isLastPage) {
      this.setData({
        loading: 1
      }, () => {
        this.getList(this.data.pageNo + 1)
      })
    }
  },
  toDetail(event) {
    let {orderNo,detNo} = event.currentTarget.dataset
    wx.navigateTo({
      url: '../orderDetail/orderDetail?orderNo=' + orderNo + '&detNo=' + detNo
    })
  },
  cancleOrder(orderNo) {
    let _this = this
    let { baseUrl, storeId, shopId } = app.globalData
    if (_this.data.isCancling) return false
    _this.data.isCancling = true
    wx.showModal({
      title: '提示',
      content: `确定要取消${orderNo}的订单吗?`,
      success: function(res) {
        if (res.confirm) {
          let url = `${baseUrl}/emallMiniApp/orders/cancelOrder/${shopId}/${storeId}/${orderNo}`
          utils.$http(url, {}, 'POST').then(res => {
            const returnCode = parseInt(res.code)
            if (returnCode === 0) {
              _this.renderCancle(res)
            }
          }).catch(error => {
            _this.data.isCancling = false
            utils.globalShowTip(false)
            _this.getList()
          })
        } else if (res.cancel) {
          _this.data.isCancling = false
          console.log('用户点击取消')
        }
      }
    })
  },
  renderCancle(res) {
    let _this = this
    _this.data.isCancling = false
    utils.globalShowTip(false)
    _this.data.isAgainRender = true
    _this.getList()
  },
  setFormId(evt) {
    let {formId} = evt.detail
    let {orderno} = evt.target.dataset
      if(orderno && orderno !== '') {
        this.cancleOrder(orderno)
    }
    app.saveFormIdSecond(formId)
  },
  gotoPay(evt) {
    let {orderno} = evt.currentTarget.dataset
    app.saveFormId(evt.detail.formId)
    wx.navigateTo({
      url: `/pages/payment/payment?orderNo=${orderno}`
    })
  },
  delOrder(no) {
    let _this = this
    let { orderno } = no.target.dataset
    let { baseUrl, shopId, storeId } = app.globalData
    if (_this.data.isCancling) return false
    _this.data.isCancling = true
    wx.showModal({
      title: '提示',
      content: `确定要删除${orderno}的订单吗?`,
      success: function(res) {
        if (res.confirm) {
          utils.globalShowTip(true)
          let url = `${baseUrl}/emallMiniApp/orders/deleteOrder/${shopId}/${storeId}/${orderNo}`
          utils.$http(url, {}, 'POST').then(res => {
            const returnCode = parseInt(res.code)
            if (returnCode === 0) {
              _this.renderDel(res)
            }
          }).catch(error => {
            _this.data.isCancling = false
            utils.globalShowTip(false)
          })
        } else if (res.cancel) {
          _this.data.isCancling = false
          console.log('用户点击删除订单')
        }
      }
    })
  },
  renderDel(res) {
    console.log(res)
    let _this = this
    _this.data.isCancling = false
    utils.globalShowTip(false)
    _this.data.isAgainRender = true
    _this.getList()
  },
  //提醒发货
  remindGood() {
    let _this = this
    app.unReadMsgCount().then(res => {
      let name = res.empName
      wx.navigateTo({
        url: '/pages/chat/chat?name=' + name + '&remind=' + true
      })
    })
  },
  //查看售后详情
  toRecord(e) {
    let formId = e.detail.formId
    app.saveFormIdSecond(formId)
    let _this = this
    let { orderNo, detNo, aftersaleid} = e.target.dataset
    wx.navigateTo({
      url: '/pages/mine/refund/record/record?orderNo=' + orderNo + '&detNo=' + detNo + '&afterSaleId=' + aftersaleid,
    })
  },
  //退货
  toRegood(e) {
    let formId = e.detail.formId
    app.saveFormIdSecond(formId)
    let { orderNo, detNo} = e.target.dataset
    wx.navigateTo({
      url: '/pages/mine/refund/regoods/regoods?orderNo=' + orderNo + '&detNo=' + detNo,
    })
  }
})