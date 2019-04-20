const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    isEmpty: false,
    isLoaded: false
  },
  onLoad(opt){
    this.setData({
      deliveryType: opt.deliveryType || 1,
      goodsId: opt.goodsId || ''
    })
  },
  onShow(){
    app.checkUnionId(this.initData)
  },
  initData(){
    let _global = app.globalData
    utils.$http(`${_global.baseUrl}/emallMiniApp/address/list/${_global.shopId}/${_global.storeId}`, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.listRender(res)
      }
    })
  },
  listRender(res){
    console.log(res)
    let _rst = res.result
    this.setData({
      list: _rst,
      isLoaded: true
    })
  },
  delAddr(evt){
    let dst = evt.currentTarget.dataset
    let aid = dst.aid
    let _this = this
    if(aid){
      wx.showModal({
        title: '温馨提示',
        content: '确认删除该收货地址吗？',
        success(res){
          if(res.confirm){
            _this.delSure(aid)
          }
        }
      })      
    }
  },
  delSure(aid){
    let _global = app.globalData
    utils.$http(`${_global.baseUrl}/emallMiniApp/address/remove/${_global.shopId}/${_global.storeId}/${aid}`, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.initData()
      }
    })
  },
  setInit(evt) {
    let dst = evt.currentTarget.dataset
    let aid = dst.aid
    if (dst.defect) {
      utils.globalToast('地址不完善，不能设为默认地址！', 'none')
      return false
    }
    let _this = this
    let idx = parseInt(dst.idx)
    if (aid) {
      let _list = this.data.list
      _list.forEach((itm, i) => {
        //console.log(itm,i)
        if (idx === i) {
          itm.preferred = 1
        } else {
          itm.preferred = 0
        }
      })
      this.setData({
        list: _list
      })
      this.initSure(aid)
    }
  },
  initSure(aid){
    let _global = app.globalData
    utils.$http(`${_global.baseUrl}/emallMiniApp/address/setDefault/${_global.shopId}/${_global.storeId}/${aid}`, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
      }
    })
  },
  edit(evt){
    let dst = evt.currentTarget.dataset
    let aid = dst.aid
    let _data = this.data
    wx.navigateTo({
      url: `/pages/mine/address/new/new?addId=${aid}&deliveryType=${_data.deliveryType || 1}&goodsId=${_data.goodsId || ''}`
    })
  }
})