const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    maskFlag: false, // 退款原因弹出层状态
    maskRefund: false, // 退款方式弹出层
    refund_content: '仅退款',
    list1: [], //退款原因
    list2:[], //退款退货原因
    imgList: [],
    num: 0,
    dealType: 1, // 1退款,2退款退货
    showTextArea: true,
    textVal: '',
    imgIdList: ''
  },
  onLoad (opt) {
    console.log(opt)
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    if (opt) {
      _this.setData({
        shopId: opt.shopId || _global.shopId,
        storeId: opt.storeId || _global.storeId,
        orderNo: opt.orderNo
      })
      if (opt.detNo && opt.detNo !== 'undefined' && opt.detNo !== 'null') {
        _this.setData({
          detNo: opt.detNo
        })
      }
    }
    app.checkUnionId(_this.confirmRefund)
  },
  openRefundMask () {
    this.setData({
      maskRefund: true
    })
  },
  confirmRefund: function () {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _data.shopId || _global.shopId,
      storeId: _data.storeId || _global.storeId,
      orderNo: _data.orderNo
    }
    let data = {}
    if (_data.detNo) {
      data.detailNo = _data.detNo
    }
    let _url = `${_global.baseUrl}/emallMiniApp/refund/confirmRefund/${params.shopId}/${params.storeId}/${params.orderNo}`
    utils.$http(_url, data).then(res => {
      utils.globalShowTip(false)
      let _result = res.result
      if (res && _result) {
        let refundReson = _result.refundResonTypes
        let idx = parseInt(_result.payWay)
        let payWay = ''
        // 判断几种支付方式状态
        switch (idx) {
          case 1:
            payWay = '支付宝'
            break
          case 2:
            payWay = '微信支付'
            break
          case 3:
            payWay = '到店付款'
            break
          case 4:
            payWay = '货到付款'
            break
          case 5:
            payWay = ''
            break
          case 6:
            payWay = '线上抵扣'
            break
        }
        if (_result.prepaid > 0) {
          payWay += ' 储值支付'
        }
        _this.setData({
          refundObj: _result,
          payWay: payWay,
          list1: refundReson.list1,
          list2: refundReson.list2
        })
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
   
  },
  //选择退款原因弹出层
  openMask () {
    let _this = this
    let _data = _this.data
    _this.setData({
      maskFlag: true,
      showTextArea: false
    })
  },
  //退款与退货单选按钮
  radioChange (e) {
    let _this = this
    let value = parseInt(e.detail.value)
    _this.setData({
      dealType: value,
      maskRefund: false,
      refund_content: value == 1 ? '仅退款' : '退款退货'
    })
    console.log(value)
  },
  //退款(退款退货)原因单选按钮事件
  changeResion (e) {
    let _this = this
    let value = parseInt(e.detail.value)
    _this.setData({
      dealReason: value,
      maskFlag: false,
      showTextArea: true
    })
    if (_this.data.dealType === 1) {
      //仅退款
      let newList = _this.data.list1
      newList.forEach((item,index) => {
        if (value === parseInt(item.key)) {
          item.checked = true
          _this.setData({
            list1_content: item.content
          })
        } else {
          item.checked = false
        } 
      })
      _this.setData({
        list1: newList
      })
    } else {
      //退款退货
      let newList = _this.data.list2
      newList.forEach((item, index) => {
        if (value === parseInt(item.key)) {
          item.checked = true
          _this.setData({
            list2_content: item.content
          })
        } else {
          item.checked = false
        }
      })
      _this.setData({
        list2: newList
      })
    }
  },
  //删除图片
  delImg (e) {
    let dataSet = e.currentTarget.dataset
    let index = dataSet.index
    let imgList = this.data.imgList
    imgList.splice(index, 1)
    this.setData({
      imgList: imgList
    })
  },
  //选择图片
  uploadImg() {
    let _this = this
    let imgList = _this.data.imgList || []
    let num = 3 - imgList.length
    wx.chooseImage({
      count: num, // 最多3张
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let src = res.tempFilePaths
        _this.setData({
          imgList: imgList.concat(src)
        })
      }
    })
  },
  //上传图片
  uploadImgFile(imgList) {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let pics = []
    let params = {
      shopId: _data.shopId || _global.shopId,
      storeId: _data.storeId || _global.storeId
    }
    let _url = `${_global.baseUrl}/emallMiniApp/refund/uploadRefundPic/${params.shopId}/${params.storeId}`

    const promises = imgList.map(item => {
      return _this.uploadFile(_url, item).then(res => {
        pics.push(_this.data.imgIdList)
      })
    })
    Promise.all(promises).then(res => {
      // 拼为以,隔开的字符串
      let picStr = pics.join(',')
      _this.submitRefund(picStr)
    })
  },
  /**
   * 上传
   */
  uploadFile (url, src) {
    let _this = this
    let _data = _this.data
    return new Promise(function (resolve, reject) {
      utils.globalShowTip(true)
      wx.uploadFile({
        header: {
          "Content-Type": "multipart/form-data"
        },
        url: url,
        filePath: src,
        name: 'myPic',
        formData: {},
        success: (res) => {
          //utils.globalShowTip(false)
          // 拼接调用提交接口时带的pic串
          let _result = JSON.parse(res.data)
          let imgIdList = ''
          if (_result.result && _result.result.pictureId) {
            imgIdList = _result.result.pictureId
          }
          _this.setData({
            imgIdList: imgIdList
          })
          resolve()
        },
        fail: (res) => {
        },
        complete: () => {
        }
      })
    })
  },
  showTip (tips) {
    wx.showToast({
      title: tips,
      duration: 2000,
      icon: 'none',
      mask: true,
      success(res){
        console.log(res)
      }
    })
  },
  //保存输入框填写的退款说明
  bindblur (e) {
    let _this = this
    let _data = _this.data
    let value = e.detail.value
    _this.setData({
      textVal: value
    })
    console.log(e)
  },
  //提交
  bindsubmit (e) {
    let _this = this
    let eValue = e.detail.value
    let _global = app.globalData
    let _data = _this.data
    if (!eValue.mobile) {
      _this.showTip('预留手机号码不能为空')
      return
    }
    if (eValue.mobile.length < 11) {
      _this.showTip('请输入正确的手机号')
      return
    }
    // 判断是否选择了其他
    let { list1, list2, dealType} = _data
    let newlist = dealType == 1 ? list1 : list2 || []
    if (newlist && newlist.length) {
      newlist.map(item => {
        // 如果用户选择的是其他，退款说明必须填写
        if (item.key == _data.dealReason && item.content == '其他') {
          if (!eValue.desc.trim()) {
            _this.showTip('请输入退款说明！')
            return
          }
        }
      })
    }
    if (_data.dealReason || _data.dealReason === 0) {
      _this.setData({
        telNo: eValue.mobile,
        remark: eValue.desc ? eValue.desc : ''
      })
      if (_data.imgList.length) { //上传了图片 调上传图片的接口
        _this.uploadImgFile(_data.imgList)
      } else {
        //用户提交整单退款或单商品退款
        _this.submitRefund()
      }
    } else {
      _this.showTip('请选择退款原因')
    }
  },
  //用户提交整单退款或单商品退款
  submitRefund: function (picStr) {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let elPaymentVoList = _data.refundObj.elPaymentVoList
    let params = {
      shopId: _data.shopId || _global.shopId,
      storeId: _data.storeId || _global.storeId,
      orderNo: _data.orderNo
    }
      let data = {
        dealType: _data.dealType,
        telNo: _data.telNo,
        remark: _data.remark.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, ""),
        dealReason: _data.dealReason,
        realPayDouble: _data.refundObj.totalRefund,
        integral: _data.refundObj.integral || 0,
       // dealNo: elPaymentVoList.length ? elPaymentVoList[0].tradeNo : '',
       // outTradeNo: elPaymentVoList.length ? elPaymentVoList[0].outTradeNo : '',
        payWay: _data.refundObj.payWay,
        theLastRefund: _data.refundObj.theLastRefund
      }
      if (_data.detNo) {
        data.detailNo = _data.detNo
      }
      if (picStr) {
        data.pic = picStr
      }
      let _url = `${_global.baseUrl}/emallMiniApp/refund/submitApplyRefund/${params.shopId}/${params.storeId}/${params.orderNo}`
      utils.$http(_url, data, 'POST').then(res => {
        utils.globalShowTip(false)
        if (res.result) {
          wx.navigateBack({
            delta: 1
          })
        }
        console.log(res)
      }).catch(error => {
        // utils.globalShowTip(false)
      })
  
  },
  cancelRefund: function () {
    wx.navigateBack({
      delta:1
    })
  },
  closeMask () {
    let _this = this
    let _data = _this.data
    _this.setData({
      maskFlag: false,
      maskRefund: false,
      showTextArea: true
    })
  },
  //查看大图
  previewImg: function (e) {
    let dataSet = e.currentTarget.dataset
    let imglist = dataSet.imglist
    let url = dataSet.url
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: imglist // 需要预览的图片http链接列表
    })
  }
})