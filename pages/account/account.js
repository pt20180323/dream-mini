const utils = require('../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsList: [],
    typeList: [{
        activityType: 1,
        activityName: '积分抵扣'
      },
      {
        activityType: 7,
        activityName: '秒杀'
      },
      {
        activityType: 9,
        activityName: '满立减'
      },
      {
        activityType: 11,
        activityName: '限时特购'
      },
      {
        activityType: 12,
        activityName: '报团购'
      },
    ],
    showClose: false,
    isshowEmpty: false,
    loading: false,
    isLastPage:false,
    noMsg: '暂无商品'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let _this = this
    let _global = app.globalData
    if (opt) {
      _this.setData({
        couponId: opt.couponId || '',
        goodsId: opt.goodsId || '',
        cusId:opt.cusId || '',
        isQy:opt.isQy || '',
        img:opt.img || '',
        cardType:opt.cardType
      })
    }
    let isIpx = _global.isIpx
    app.checkUserId(_this.getGoodsList)
  },
  //获取商品列表
  getGoodsList: function(pageNo) {
    let _this = this
    let _global = app.globalData
    _this.data.pageNo = pageNo || 1
    let params = {
      activityType: _this.data.activityType || '',
      keyword: _this.data.searchKey || ''
    }
    let goodsId = _this.data.goodsId
    let couponId = _this.data.couponId
    if (goodsId) {
      params.goodsId = goodsId
      _this.data.goodsId = goodsId
    }
    if (couponId) {
      params.cardId = couponId
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/goods/queryCashCouponGoodsList/' + _global.shopId + '/' + _global.storeId + '/' + _this.data.pageNo, params, 'POST', _this.data.loading).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        let isLast = false
        if (!result.hasNextPage) {
          isLast = true
        }
        _this.setData({
          goodsList: _this.data.goodsList.concat(result.result),
          isLastPage: isLast,
          loading: false
        })
        if (_this.data.goodsList.length == 0) {
          _this.setData({
            isshowEmpty: true
          })
        }else{
          _this.setData({
            isshowEmpty: false
          })
        }
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  onReachBottom: function() {
    const _this = this
    if (_this.data.isLastPage) {
      utils.globalShowTip(false)
    } else {
      _this.setData({
        loading: 1
      })
      _this.getGoodsList(_this.data.pageNo + 1)
    }
  },
  //单项选择
  check: function(e) {
    let _this = this
    let dataSet = e.currentTarget.dataset
    let index = dataSet.index
    let goodsList = _this.data.goodsList
    goodsList.forEach((item, idx) => {
      if (idx === index) {
        item.isSelect = !item.isSelect
        _this.data.goodsId = item.isSelect ? item.id : ''
      } else {
        item.isSelect = false
      }
    })
    this.setData({
      goodsList: goodsList
    })
  },
  //保存商品
  sureBtn: function() {
    let { goodsId, couponId, isQy, cusId, img, cardType} = this.data
    if (!goodsId) {
      wx.showToast({
        title: '请选择一个商品',
        icon: 'none'
      })
    } else {
      wx.navigateTo({
        url: `/pages/account/favorable/favorable?goodsId=${goodsId}&couponId=${couponId}&isQy=${isQy}&cusId=${cusId}&img=${img}&cardType=${cardType}`
      })
    }
  },
  //商品详情
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
  },
  changeType: function(e) {
    let typeList = this.data.typeList
    let _this = this
    let dataSet = e.currentTarget.dataset
    let index = dataSet.index
    let type = dataSet.type
    typeList.forEach((item, idx) => {
      if (idx === index) {
        item.isSelect = !item.isSelect
        _this.data.activityType = item.isSelect ? type : ''
      } else {
        item.isSelect = false
      }
    })
    this.setData({
      pageNo: 1,
      typeList: typeList,
      goodsList: []
    })
    this.getGoodsList()
  },
  //搜索订单
  searchOrder: function(e) {
    let value = e.detail.value
    if (value) {
      this.setData({
        searchKey: value,
        pageNo: 1,
        goodsList:[]
      })
      this.getGoodsList(1)
    }
  },
  //删除搜索关键字
  clearKey: function(e) {
    if (this.data.searchKey) {
      this.setData({
        searchKey: '',
        pageNo: 1,
        goodsList:[]
      })
      this.getGoodsList(1)
    }
    this.setData({
      showClose: false
    })
  },
  //输入关键字
  inputValue: function(e) {
    let value = e.detail.value
    if (value) {
      this.setData({
        searchKey: value
      })
    }
  },
  showClose: function() {
    this.setData({
      showClose: true
    })
  }
})