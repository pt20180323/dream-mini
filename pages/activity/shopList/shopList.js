const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    hasNextPage: false,
    pageNo: 1, //当前的页面数
    goodsList:[],
    isEmpty: false
  },
  onLoad(opt) {
    let _this = this
    _this.setData({
      currentDate: opt.currentDate || '2018-12-22'
    })
    let title = _this.data.currentDate.split('-')[1] + '月' + _this.data.currentDate.split('-')[2] + '日上新商品'
    wx.setNavigationBarTitle({
      title: title
    })
    app.checkUserId(_this.initData)
  },
  //初始化数据
  initData() {
    this.getGoodsList()
  },
  //获商品动列表
  getGoodsList(pageNo) {
    let _this = this
    _this.data.pageNo = pageNo || 1
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      pageNumber: pageNo || 1,
      storeId:  _global.storeId,
      showType : 3,
      pageSize: 5,
      createBeginTime: _this.data.currentDate + ' 00:00:00',
      createEndTime: _this.data.currentDate + ' 23:59:59'
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/goodsListByDate/' + params.shopId + '/' + params.storeId + '/' + params.showType + '/' + params.pageNumber, params,'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        let rst = res.result
        _this.setData({
          hasNextPage: rst.hasNextPage,
          pageNo: rst.pageNumber,
          goodsCount: rst.totalCount || 0
        })
        if (_this.data.pageNo === 1) {
          _this.setData({
            goodsList: rst.result
          })
        } else {
          _this.setData({
            goodsList: _this.data.goodsList.concat(rst.result)
          })
        }
        if (!_this.data.goodsList.length) {
          _this.setData({
            isEmpty: true
          })
        } else {
          _this.setData({
            isEmpty: false
          })
        }
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  onReachBottom: function () {
    const _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getGoodsList(_this.data.pageNo + 1)
    }
  },
  toDetail(opt) {
    let atype = opt.currentTarget.dataset.type
    let goodsId = opt.currentTarget.dataset.gid
    let activivtyId = opt.currentTarget.dataset.aid
    let shopId = opt.currentTarget.dataset.sid
    let storeId = opt.currentTarget.dataset.stid
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&storeId=' + storeId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId + '&storeId=' + storeId + '&shopId=' + shopId
      })
    }

  }
})