const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    formId: '',
    orderVo:{},
    cost:''
  },
  onLoad (opt) {
    let _this = this    
    let orderNo = opt.orderNo || ''
    if (orderNo) {
      _this.setData({
        orderNo: orderNo
      })
      app.checkUserId(_this.initData)
    }    
  },
  initData(){
    let _this = this
    let _global = app.globalData
    let _param = {
      buyerId: _global.buyerId,
      shopId: _global.shopId,
      ordersNo: _this.data.orderNo
    }
    _this.getEnvironment()
    _this.unReadMsgCount()
    utils.$http(_global.baseUrl + '/elshop/my/getOrderDetail', _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderDetail(res)
      }
    })
  },
  //处理电商用户从企业微信中进入电商不允许下单
  getEnvironment () {
    let _this = this
    if (app.globalData.environment) {
      _this.setData({
        environment: app.globalData.environment
      })
    }
  },
  renderDetail(res){
    let _this =this
    var tempOrderVo ={};
    tempOrderVo = res.result.teamshopOrderVo;
    res.result.cost = '' + res.result.cost;
    tempOrderVo.cost = res.result.cost;
    tempOrderVo.dservices = res.result.dservices;
    tempOrderVo.deliverNo = res.result.deliverNo;
    _this.setData({
      orderVo: tempOrderVo,
      cost: res.result.cost,
      amount: res.result.amount || '',
      dservices: res.result.dservices,
      deliverNo: res.result.deliverNo
    })
    //console.log(_this.data.orderVo);
  },
  gotoPay(evt){
    app.saveFormId(evt.detail.formId)
    wx.navigateTo({
      url: `/pages/payment/payment?orderNo=${this.data.orderVo.orderNo}`
    })
  },  
  toTeamDet (obj) {
    utils.globalShowTip(false)
    wx.navigateTo({
      url: '/pages/teamshop/teamDetail/teamDetail?teamId=' + this.data.teamId,
    })
  },
  cancleOrder (no) {
    let _this = this
    let _param = {
      buyerId: app.globalData.buyerId,
      storeId: app.globalData.storeId,
      orderNo: no
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
  renderCancle (res) {
    let _this = this
    _this.data.isCancling = false
    utils.globalShowTip(false)
    if (res.result && parseInt(res.result.flag) === 1) {
      _this.data.isAgainRender = true
      app.globalData.isOrdCancle = true
      wx.navigateBack({
        delta: 1
      })
    }
  },
  setFormId (evt) {
    let _this = this
    let formId = evt.detail.formId
    let dst = evt.target.dataset
    let ord = dst.orderno
    if (_this.data.isCancling) {
      return false
    }
    if (ord && ord !== '') {
      _this.cancleOrder(ord)
    }
    app.saveFormId(formId)
  },
  //临时聊天查询未读消息数量 - 以及保存顾问信息
  unReadMsgCount() {
    let _this = this
    let _global = app.globalData
    let _url = `${_global.lkBaseUrl}/el-imfans-linke-api/miniChat/unReadMsgCount`
    let params = {
      hyId: _global.hyUserId,
      empId: _global.empId || '',
      shopId: _global.shopId,
      storeId: _global.storeId,
      flag: 2,
      isNeedEmpInfo: 2
    }
    utils.$http(_url, params, 'POST').then(res => {
      let _rst = res.result
      if (_rst) {
        _this.setData({
          empObj: _rst
        })
      }
      utils.globalShowTip(false)
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  toChat() {
    let _this = this
    let phone = _this.data.empObj.storePhone
    let name = _this.data.empObj.empName
    if (phone) {
      wx.showModal({
        title: '门店电话',
        content: 'phone',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/chat/chat?name=' + name + '&orderInfo=' + JSON.stringify(_this.data.orderVo)
    })
  },
  toDetail(e) {
    let atype = e.currentTarget.dataset.activitytype
    let goodsId = e.currentTarget.dataset.goodsid
    let activivtyId = e.currentTarget.dataset.activityid
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId
      })
    }
  },
})