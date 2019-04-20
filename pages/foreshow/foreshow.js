const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    pageNo: 1,
    shopList: [],
    elActivityVo: {},
    isLastPage: false,
    isshowEmpty: false,
    isCountDownEnd: false,
    countHtml: '',
    totalPages: 1,
    activityId:''
  },
  onLoad(opt){
    let _this = this
    let _data = _this.data
    _data.activityId = opt.activityId || ''
    app.checkUnionId(_this.getShopList)    
  },
  countDown(num){
    let _this = this
    _this.data.elActivityVo.countDownSeconds = num
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
    let timeStr = '<span class="shape">' + rewriteD + '</span><em class="st_txt">天</em><span class="shape">' + rewriteH + '</span><em class="st_txt">:</em><span class="shape">' + rewriteM + '</span><em class="st_txt">:</em><span class="shape">' + rewriteS + '</span>'
    _this.setData({
      countHtml: timeStr
    })
  },
  getShopList(pageNo){
    let _this = this
    let _data = _this.data
    let _gd = app.globalData
    _data.pageNo = pageNo || 1
    let params = {
      shopId: _gd.shopId,
      pageSize: 10,
      pageNumber: pageNo || 1,
      storeId: _gd.storeId,
      activityId: _data.activityId,
      userType: _gd.userType,
      sessionId:_gd.sessionKey,
      buyerId: _gd.buyerId
    }
    utils.$http(_gd.baseUrl + '/elshop/teamShop/findNotStartedTeamShopList', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopListRender(res)
      }
    }).catch((res) => { })
  },
  shopListRender(res){
    let _this = this
    let _data = _this.data
    if (res && res.result) {
      let _result = res.result
      let _rst = res.result
      let storeFlag = _rst.storeFlag
      if (!storeFlag && storeFlag === 0) {
        wx.showModal({
          title: '温馨提示',
          content: '所属门店找不到该活动信息',
          showCancel: false,
          success() {
            wx.switchTab({
              url: '/pages/home/home',
            })
          }
        })
        return false
      }
      _rst.elActivityVo = _rst.elActivityVo || {}
      _rst.elActivityVo.countDownSeconds = parseInt(_rst.elActivityVo.countDownSeconds || 0)
      _this.setData({
        isLastPage: !_rst.hasNext,
        elActivityVo: _rst.elActivityVo,
        shopList: _data.shopList.concat(_rst.teamShopList || [])
      })
      if (!_this.data.shopList.length) {
        _this.setData({
          isshowEmpty: true
        })
      } else {
        _this.setData({
          isshowEmpty: false
        })
        if (_data.interval) {
          clearInterval(_data.interval)
          _data.interval = null
        }
        _data.interval = setInterval(() => {
          if (_data.elActivityVo.countDownSeconds >= 0) {
            _this.countDown(--_data.elActivityVo.countDownSeconds)
          }
        }, 1000)
      }
    }
  },
  setFormId(evt){
    let formId = evt.detail.formId
    app.saveFormId(formId)
  },
  toIndex(evt){
    let formId = evt.detail.formId
    app.saveFormId(formId)
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  onReachBottom(){
    const _this = this
    if (_this.data.isLastPage) {
      utils.globalShowTip(false)
    } else {
      _this.getShopList(_this.data.pageNo + 1)
    }
  },
  onShareAppMessage(res){
    if (res.from === 'button') {
      // 来自页面内转发按钮
      // console.log(res.target)
    }
    let _empId = app.getEmpId()
    let _gd = app.globalData
    let _data = this.data
    let _url = '/pages/foreshow/foreshow?storeId=' + _gd.storeId + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + (_data.activityId || _gd.activityId)
    return {
      title: '活动预告',
      path: _url,
      imageUrl: _gd.imgUrl || '',
      success(res){
        // 转发成功
      },
      fail(res){
        // 转发失败
      }
    }
  }
})