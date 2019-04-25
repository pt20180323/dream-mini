const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    orderNum: 0,
    totalNum: {},
    user: {},
    vocherTotal: 0,
    teamOrder: {},
    tabLoad: false,
    isLoad:false
  },
  onLoad: function() {
    let _this = this
    let environment = app.globalData.environment
    if (environment && environment.toLowerCase() === 'wxwork') {
      _this.setData({
        isQy: true
      })
    }
    app.checkUserId(() => {
      _this.initData()
    })
    setTimeout(function() {
      _this.data.tabLoad = true
    }, 1000)
  },
  onTabItemTap(item) {
    if (this.data.tabLoad) {
      wx.showNavigationBarLoading()
      this.setData({
        isLoad: true
      }, () => {
        app.checkUserId(this.initData)
      })
      setTimeout(function() {
        wx.hideNavigationBarLoading()
      }, 1000)
    }
  },
  initData() {
    let _this = this
    let _global = app.globalData
    _this.setData({
      memberFlag: _global.memberFlag,
      openId: _global.wxOpenId
    })
    _this.statistic()
    _this.vocherTotal()
    //_this.teamOrderTotal()
    _this.getShopInfo()
    app.linecarCount()
    _this.queryCurrency()
  },
  getShopInfo() {
    let _this = this
    let {baseUrl,shopId} = app.globalData
    utils.$http(baseUrl + '/emallMiniApp/shop/info/' + shopId, {},'',1).then(res => {
      if (res) {
        _this.setData({
          shopInfo: res.result
        })
      }
    }).catch(res => {})
  },
  statistic() {
    this.setData({
      user: app.globalData
    })
    let _this = this
    let _global = app.globalData
    let shopId = _global.shopId
    let storeId = app.getStoreId()
    utils.$http(_global.baseUrl + '/emallMiniApp/orders/orderCenter/statistical/' + shopId + '/' + storeId, {},'',_this.data.isLoad).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          totalNum: res.result
        })
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  vocherTotal() {
    let _this = this
    let _global = app.globalData
    let shopId = _global.shopId
    let storeId = app.getStoreId()
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/total/' + shopId + '/' + storeId, {}, '', _this.data.isLoad).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          vocherTotal: res.result
        })
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  // 抱团中订单数
  teamOrderTotal() {
    let _this = this
    let _global = app.globalData
    let param = {
      shopId: _global.shopId,
      buyerId: _global.buyerId,
      status: 1
    }
    utils.$http(_global.baseUrl + '/elshop/my/getMyOrderNum', param,'',1).then(res => {
      if (res && res.result) {
        this.setData({
          teamOrder: res.result
        })
      }
    }).catch(res => {})
  },
  queryCurrency() { //查询用户储值积分
    let _this = this
    let _global = app.globalData
    utils.$http(`${_global.baseUrl}/emallMiniApp/orders/queryCurrencyInfo/${_global.shopId}/${_global.storeId}`, {},'',1).then(res => {
      if (res) {
        _this.setData({
          currency: res.result
        })
      }
    }).catch(res => {})
  },
  //领取微信会员卡
  getCard: function() {
    let _this = this
    let _global = app.globalData
    let params = {
      sessionId: _global.sessionKey,
      openId: _global.wxOpenId,
      businessId: _this.data.currency.businessId,
      businessType: _this.data.currency.businessType
    }
    return new Promise(function(resolve, reject) {
      utils.$http(_global.baseUrl + '/emallMiniApp/wxCard/receiveCard/' + _global.shopId + '/' + _global.storeId, params, '', 1).then(res => {
        resolve(res.result.cardList)
      }).catch(res => {
        utils.globalShowTip(false)
      })
    })
  },
  toCard: function() {
    let _this = this
    let _global = app.globalData
    if (!_global.wxOpenId) {
      return
    }
    if (_this.data.currency.wxCardType == 3) {
      _this.getCard().then(function(res) {
        wx.openCard({
          cardList: res,
          success() {}
        })
      })
    } else {
      wx.navigateTo({
        url: '/pages/mine/coin/coin?idCard=true',
      })
    }
  }
})