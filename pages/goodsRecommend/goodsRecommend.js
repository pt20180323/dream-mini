const utils = require('../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponList: [],
    goodsInfo: '',
    pageNumber: 1,
    isshowEmpty: false,
    navList: [{
        txt: '推荐文章',
        idx: 1
      },
      {
        txt: '推荐优惠券',
        idx: 2
      }
    ],
    navTab: 2,
    loading: false,
    isLastPage: false,
    noMsg: '暂无可用优惠券'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let goodsInfo = opt.goodsInfo ? JSON.parse(opt.goodsInfo) : {}
    this.setData({
      goodsInfo,
      cusId: opt.cusId || '',
      isQy:opt.isQy || '',
      img: opt.img || ''
    })
    app.checkUserId(this.getCouponList)
  },
  changeTab: function(evt) {
    let dts = evt.currentTarget.dataset
    let _global = app.globalData
    if (dts.type == 2) {
      this.getCouponList()
    }

    this.setData({
      navTab: parseInt(dts.type)
    })
  },
  //获取优惠券列表
  getCouponList: function(pageNumber) {
    let {
      lkBaseUrl,
      shopId,
      storeId
    } = app.globalData
    this.setData({
      pageNumber: pageNumber || 1,
    })
    let params = {
      cardType: -1
    }
    utils.$http(lkBaseUrl + '/el-imfans-linke-api/cardVolume/cardListData/' + shopId + '/' + storeId + '/' + this.data.pageNumber, params, '', this.data.loading).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        this.setData({
          isLastPage: !result.hasNextPage,
          loading: false
        })
        if (this.data.pageNumber === 1) {
          this.setData({
            couponList: result.result
          })
        } else {
          this.setData({
            couponList: this.data.couponList.concat(result.result)
          })
        }
        if (!this.data.couponList.length) {
          this.setData({
            isshowEmpty: true
          })
        } else {
          this.setData({
            isshowEmpty: false
          })
        }
      }
    }).catch(error => {})
  },
  onReachBottom: function() {
    if (!this.data.isLastPage) {
      this.setData({
        loading: 1
      }, () => {
        this.getCouponList(this.data.pageNumber + 1)
      })
    }
  },
  //去优惠券详情
  toCoupon: function(e) {
    let _global = app.globalData
    let dataSet = e.currentTarget.dataset
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&cardId=' + dataSet.id
    wx.navigateTo({
      url: url
    })
  }
})