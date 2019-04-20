const utils = require('../../../utils/util.js')
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js')
let app = getApp()
let qqmapsdk = null
Page({
  data: {
    currIndex: 0,
    skuId: null,
    goods: null,
    sidx:1,
    pictxt: '',
    hasDetailVideo: false
  },
  onLoad(opt) {
    if (opt) {
      this.setData({
        skuId: opt.skuId || skuId
      })
    }
  },
  swiperChange(e) {
    let {
      current
    } = e.detail
    console.log(e)
    let sidx = current+1
    this.setData({
      sidx: sidx
    })
  },
  onShow() {
    app.checkUnionId(this.getSkuGiftDetails)
  },
  getSkuGiftDetails() {
    let {
      storeId,
      shopId,
      baseUrl
    } = app.globalData
    let that = this, { skuId } = this.data
    let data = {
      shopId: shopId,
      storeId: storeId,
      supSkuId: skuId
    }
    utils.$http(`${baseUrl}/emallMiniApp/goods/infoSup/${shopId}/${storeId}/${skuId}`, data).then(res => {
      if (res) {
        let _rst = res.result
        console.log(_rst)
        let pictxt = _rst.goods && _rst.goods.introduction ? _rst.goods.introduction:''
        utils.globalShowTip(false)
        that.setData({
          goods: _rst,
          pictxt: pictxt
        })
      }
    }).catch((res) => { })
  }
})