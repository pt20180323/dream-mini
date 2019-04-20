const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    slideUp: false,
    initpay: true,
    // 输入框参数设置
    inputData: {
      input_value: "",//输入框的初始内容
      value_length: 0,//输入框密码位数
      isNext: false,//是否有下一步的按钮
      get_focus: true,//输入框的聚焦状态
      focus_class: true,//输入框聚焦样式
      value_num: [1, 2, 3, 4, 5, 6],//输入框格子数
      height: "80rpx",//输入框高度
      width: "528rpx",//输入框宽度
      see: false,//是否明文展示
      interval: true //是否显示间隔格子
    }
  },
  onLoad(opt) {
    console.log(opt)
    this.setData({
      orderNo: opt.orderNo
    })
    app.checkUnionId(this.initWeb)
  },
  // 当组件输入数字6位数时的自定义函数
  valueSix(evt){
    let pwd = evt.detail
    this.setData({
      sixpwd: pwd
    })
    this.payprepay()    
  },
  initWeb(){
    let _this = this
    let _data = _this.data    
    _this.initOrdPay()
    _data.interval = setInterval(function () {
      if (_data.countDownSeconds >= 0) {
        _this.countDown(--_data.countDownSeconds)
      }
    }, 1000)
  },
  initOrdPay(){//查询下单支付相关信息
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let _param = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      orderNo: _data.orderNo
    }
    let url = `${_global.baseUrl}/emallMiniApp/payment/toPay/${_param.shopId}/${_param.storeId}/${_param.orderNo}`
    utils.$http(url, {}).then(res => {
      if (res && res.result) {
        _this.initPayRender(res.result)
      }
    }).catch(res => {
      //utils.globalToast(res.message || '网络异常，请稍后重试！', 'none')
      //utils.globalShowTip(false)
    })
  },
  initPayRender(res){
    console.log(res)
    utils.globalShowTip(false)
    this.setData({
      topay: res,
      countDownSeconds: Math.max(res.payTimeCountDown, 0)
    })
  },
  countDown(num){
    let _this = this
    _this.data.countDownSeconds = num
    if (num === 0) {
      clearInterval(_this.data.interval)
      _this.data.interval = null
      _this.setData({
        isCountDownEnd: true
      })
      return false
    }
    _this.setData({
      isCountDownEnd: false
    })
    let day = Math.floor(num / (24 * 60 * 60))
    let rewriteD = day < 10 ? ('0' + day) : day
    let hour = Math.floor(num / (60 * 60)) % 24
    let rewriteH = hour < 10 ? ('0' + hour) : hour
    let minute = Math.floor((num % 3600) / 60)
    let rewriteM = minute < 10 ? ('0' + minute) : minute
    let second = Math.floor(num % 60)
    let rewriteS = second < 10 ? ('0' + second) : second;
    let timeStr = rewriteD + '天' + rewriteH + ':' + rewriteM + ':' + rewriteS
    _this.setData({
      countHtml: timeStr
    })
  },
  payorder(evt){//订单支付方式选择
    let _dst = evt.currentTarget.dataset
    let _type = parseInt(_dst.type) //1:支付宝、2:微信支付、3:到店付款、4:货到付款、5:储值支付、6:积分抵扣，红包，现金券抵扣
    if(_type === 5){
      if (this.data.topay.ordersPrepaidDouble>0) {
        return false
      }
      this.setData({
        slideUp: true
      })
    }else if(_type === 2){
      if (this.data.wxpaying){
        return false
      }
      this.data.wxpaying = true
      this.wxpay()
      this.setData({
        iswxpay: true,
        ishdpay: false,
        isddpay: false
      })
    }else if(_type === 3 || _type === 4){
      this.offlinepay(_type)
      this.setData({
        iswxpay: false,
        ishdpay: _type === 4,
        isddpay: _type === 3
      })
    }
  },
  wxpay(){//微信支付
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let orderNo = _data.topay.orderNo || _data.orderNo
    let param = {
      openId: _global.openId
    }
    let url = `${app.globalData.baseUrl}/emallMiniApp/payment/doPay/${_global.shopId}/${_global.storeId}/${orderNo}`
    utils.$http(url, param, 'POST').then(res => {
      _this.doPayRender(res.result, orderNo)
    }).catch(res => {
      //utils.globalShowTip(false)
      _this.data.wxpaying = false       
      setTimeout(() => {
        _this.toOrderList(orderNo)//失败后跳转到订单列表页面
      }, 2000)
    })
  },
  doPayRender(res, orderNo){//调起微信支付
    let _this = this
    let _data = _this.data
    let _rst = res
    let _global = app.globalData
    let url = `${app.globalData.baseUrl}/emallMiniApp/payment/toSuccess/${_global.shopId}/${_global.storeId}/${orderNo}`
    wx.requestPayment({
      timeStamp: _rst.timeStamp,
      nonceStr: _rst.nonceStr,
      'package': 'prepay_id=' + _rst.prepayId,
      signType: 'MD5',
      paySign: _rst.paySign,
      success(res){
        _data.wxpaying = false
        utils.$http(url, {}, 'POST').then(res => {
          utils.globalShowTip(false)
          _this.gotoDetail(orderNo)
        }).catch(err => {
          //utils.globalShowTip(false)
          setTimeout(()=>{
            _this.toOrderList(orderNo)
          },2000)          
        })
      },
      fail(res){
        _data.wxpaying = false
        if (res.errMsg == "requestPayment:fail cancel") {
          _this.toOrderList(orderNo)
        }
        if (res.err_desc) {          
          utils.globalToast(res.err_desc || '网络异常，请稍后重试！', 'none')
        }
      },
      complete(){
        _data.wxpaying = false
      }
    })
  },
  offlinepay(payway){//线下支付
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let orderNo = _data.topay.orderNo || _data.orderNo
    let url = `${_global.baseUrl}/emallMiniApp/payment/offlinepay/${_global.shopId}/${_global.storeId}/${orderNo}/${payway}`
    utils.$http(url, {}, 'POST').then(res =>{
      let _rst = res.result || {}
      utils.globalShowTip(false)
      if(_rst.status){
        _this.gotoDetail(orderNo)
      }else{
        utils.globalToast(_rst.msg || '网络异常，请稍后重试！', 'none')
      }
    }).catch(res => {
      //utils.globalShowTip(false)
    })
  },  
  surepay(){//储值支付
    let _this = this
    let _data = _this.data
    let _topay = _data.topay
    if (_topay.noPwd) {//储值余额支付，免密支付 
      _this.payprepay()
    } else {//需要密码
      if (!_topay.setPwd) {//没有设置支付密码跳转到设置支付密码页面
        wx.navigateTo({
          url: '/pages/mine/coin/coin'
        })
      } else {
        if (_data.sixpwd && _data.sixpwd.length === 6) {
          _this.payprepay()
        } else {
          utils.globalToast('请输入储值支付密码！', 'none')
        }
      }
    } 
  },
  payprepay(){//调用储值支付
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let _param = {
      password: _data.sixpwd || '',
      noPwd: _data.topay.noPwd
    }
    let url = `${_global.baseUrl}/emallMiniApp/payment/payprepaid/${_global.shopId}/${_global.storeId}/${_data.orderNo}`
    utils.$http(url, _param, 'POST').then(res => {
      console.log(res)
      if (res && res.result) {
        _this.prepayRender(res.result)
      }
    }).catch(res => {
      _this.setData({
        sixpwd: ''
      })
      //utils.globalToast(res.message || '支付失败，请稍候再试！', 'none')
    })
  },
  prepayRender(rst){
    console.log(rst)
    let _rst = rst || {}
    let _data = this.data
    const flag = _rst.flag //储值余额支付状态，余额支付成功或失败的标识，0=支付失败，1=余额部分支付成功 2=余额全款支付成功 3=不满足支付条件
    utils.globalShowTip(false)
    if(flag === 0 || flag === 3){
      if(!_data.topay.setPwd){
        utils.globalToast('没有设置支付密码！', 'none')
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/mine/coin/coin'
          })
        }, 2000)
      }else{
        utils.globalToast(_rst.msg || '支付失败，请稍候再试！', 'none')
      }
    }else if(flag === 2){
      this.gotoDetail()
    }else if(flag === 1){
      this.setData({
        slideUp: false,
        'topay.ordersPrepaidDouble': _rst.payed,
        'topay.balanceAmountDouble': _rst.over,
        'topay.prepaidDouble': _rst.remain
      })
    }
  },
  closeSlide() {
    this.setData({
      slideUp: false
    })
  },
  toOrderList(){//支付失败跳转到相应的订单列表
    let _data = this.data
    let ordType = _data.topay.dyOrderType
    let _url = `/pages/mine/orderList/orderList` //默认普通购买
    if (ordType === 8) {//抱团跳转到抱团订单列表页面
      _url = `/pages/teamshop/myOrder/myOrder`
    }
    wx.redirectTo({
      url: _url
    })
  },
  gotoDetail(orderNo){//支付成功跳转到相应的订单详情页面
    let _data = this.data
    let ordType = _data.topay.dyOrderType
    let _url = `/pages/mine/orderDetail/orderDetail?orderNo=${orderNo || _data.orderNo}` //默认普通购买
    if (ordType === 8) {//抱团跳转到抱团详情页面
      _url = `/pages/teamshop/teamDetail/teamDetail?teamId=${_data.topay.huddleTeamId}`
    }
    wx.redirectTo({
      url: _url
    })
  }
})