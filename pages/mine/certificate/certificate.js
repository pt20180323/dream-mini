const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {  
  },
  onLoad(opt){
    let _this =this
    _this.setData({
      orderNo: opt.orderNo || '',
      detailNo: opt.detailNo || ''
    })
    app.checkUserId(_this.initData)
  },
  initData(){
    let _this = this
    let _data = _this.data
    let _param = {
      storeId: app.globalData.storeId,
      ordersNo: _data.orderNo,
      detailNo: _data.detailNo
    }
    utils.$http(app.globalData.baseUrl + '/elshop/my/getOrderVoucher', _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderVoucher(res)
      }
    })
  },
  renderVoucher(res){
    let _this = this
    for (var i = 0; i < res.result.voucherVo.ordersDetails.length;i++){
      var skuN = ''
      if (res.result.voucherVo.ordersDetails[i].modelType != null && res.result.voucherVo.ordersDetails[i].modelType!=''){
         let aa = new Array()
         aa = res.result.voucherVo.ordersDetails[i].modelType.split('|')
         if(aa !=null && aa!=''){
           if (aa[0] != null && aa[0]!=''){
             skuN = aa[0];
             res.result.voucherVo.ordersDetails[i].skuN = skuN
           }
         }
      }
    }
    _this.setData({
      vo: res.result.voucherVo
    })
  }
})