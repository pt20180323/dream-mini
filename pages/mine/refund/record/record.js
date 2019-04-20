const utils = require('../../../../utils/util.js')
let app = getApp()
Page({
  data: {
    txt:'展开'
  },
  onLoad(opt) {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    if (opt) {
      _this.setData({
        orderNo: opt.orderNo,
        shopId: opt.shopId || _global.shopId,
        storeId: opt.storeId || _global.storeId,
        aftersaleid: opt.afterSaleId || ''
      })
      if (opt.detNo && opt.detNo !== 'undefined' && opt.detNo !== 'null') {
        _this.setData({
          detailNo: opt.detNo
        })
      }
    }
  },
  onShow () {
    app.checkUnionId(this.getRecords)
  },
  // 点击撤销申请
  cancelApp() {
    let { orderInfo } = this.data
    let {baseUrl} = app.globalData
    let _url = `${baseUrl}/emallMiniApp/refund/cancelApply/${orderInfo.afterSaleApplyId}`
    utils.$http(_url,{}).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        utils.globalToast('撤销成功！', 'none')
        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          })
        }, 1000)
      } else {
        utils.globalToast(res.message, 'none')
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  // 点击跳转填写快递信息
  goExpressInfo (e) {
    let { orderInfo } = this.data
    let { isset } = e.currentTarget.dataset
    wx.navigateTo({
      url: `../regoods/regoods?applyId=${orderInfo.afterSaleApplyId}&isset=${Number(isset)}`,
    })
  },
  // 展开收起点击事件
  switchList () {
    let { txt, orderInfo} = this.data
    if (txt == '展开') {
      txt = '收起'
      // 控制显示隐藏
      orderInfo.refundDialogs.map((item) => {
        item.isShow = true
      })
      // orderInfo
    } else if (txt == "收起") {
      txt = '展开'
      orderInfo.refundDialogs.map((item, i) => {
        item.isShow = i == 0
      })
    }
    this.setData({ txt, orderInfo})
  },
  // 获取数据
  getRecords: function() {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _data.shopId,
      storeId: _data.storeId,
      orderNo: _data.orderNo
    }
    let data = {}
    if (_data.detailNo) {
      data.detailNo = _data.detailNo
    }
    if (_data.aftersaleid) {
      data.aftersaleid = _data.aftersaleid
    }
    let _url = `${_global.baseUrl}/emallMiniApp/refund/showRefundDetail/${params.shopId}/${params.storeId}/${params.orderNo}`
    utils.$http(_url, data).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let _result = res.result
        _this.renderRecords(_result)
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  renderRecords: function(res) {
    let _this = this
    let orderInfo = res
    // 提示文本
    let contentData = [
      { id: 10, content: '您已成功发起退款申请，请等待商家处理' },
      { id: 74, content: '商户已同意退货退款申请，请按照提示退回商品' },
      { id: 75, content:'您已寄回商品，请等待商户确认收货'},
    ]
    let refStatus = orderInfo.refundStatus // 操作状态Code
    let typeNmae = orderInfo.afterSaleTypeName == '退款退货' // 详情类型名称
    orderInfo.operAreaisShow = refStatus == 10 || refStatus == 74 || refStatus == 75 || refStatus == 71 || refStatus == 72 // 撤销申请按钮是否显示
    orderInfo.fillinBtnisShow = typeNmae && refStatus == 74 // 填写快递发货信息按钮是否显示
    orderInfo.setBtnisShow = typeNmae && refStatus == 75 // 修改快递发货信息按钮是否显示
    // 给详情状态赋值提示文本
    let stepName = contentData.filter(item => item.id == refStatus)
    orderInfo.afsServiceStepName = stepName && stepName.length && stepName[0].content || ''
    // 操作时间转化
    if (orderInfo.refundDialogs && orderInfo.refundDialogs.length) {
      orderInfo.refundDialogs.map((item,i) => {
        // 设置动态展示条数
        item.isShow = i == 0
        item.actionTime = utils.getTime(item.actionTime)
      })
    }
    // 取件类型赋值
    let wareType = orderInfo.pickwareType
    if (wareType) orderInfo.pickText = wareType == 1 ? '快递退货' : wareType == 2 ? '到店退货' :'商家上门取货'
    console.log(orderInfo)
    _this.setData({ orderInfo})
  },
  //查看大图
  previewImg: function(e) {
    let dataSet = e.currentTarget.dataset
    let imglist = dataSet.imglist
    let url = dataSet.url
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: imglist // 需要预览的图片http链接列表
    })
  }
})