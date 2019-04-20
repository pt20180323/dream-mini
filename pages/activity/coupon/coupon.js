const utils = require('../../../utils/util.js')
import Poster from '../../component/wxa-plugin-canvas/poster/poster'
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isIpx: false,
    couponList: [],
    showGoods: false,
    isshowEmpty: false,
    isLastPage: false,
    loading: false,
    noMsg: '很抱歉，今日没有上新优惠券！'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let _this = this
    _this.setData({
      currentDate: opt.currentDate || '2019-02-28'
    })
    let title = _this.data.currentDate.split('-')[1] + '月' + _this.data.currentDate.split('-')[2] + '日上新优惠券'
    wx.setNavigationBarTitle({
      title: title
    })
    app.checkUnionId(_this.getCouponList)
  },
  //获取优惠券列表
  getCouponList: function(pageNo) {
    let _this = this
    let _global = app.globalData
    _this.setData({
      pageNo: pageNo || 1
    })
    let params = {
      pageSize: 10,
      createBeginTime: _this.data.currentDate + ' 00:00:00',
      createEndTime: _this.data.currentDate + ' 23:59:59'
    }
    utils.$http(_global.baseUrl + '/emallMiniApp/voucher/cardListDataByDate/' + _global.shopId + '/' + _global.storeId + '/' + _this.data.pageNo, params, 'POST', _this.data.loading).then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        _this.setData({
          isLastPage: !result.hasNextPage,
          pageNo: result.pageNumber,
          cardCount: result.rowCount || 0,
          loading: false
        })
        if (_this.data.pageNo === 1) {
          _this.setData({
            couponList: result.result
          })
        } else {
          _this.setData({
            couponList: _this.data.couponList.concat(result.result)
          })
        }
        if (!_this.data.couponList.length) {
          _this.setData({
            isshowEmpty: true
          })
        } else {
          _this.setData({
            isshowEmpty: false
          })
        }
      }
    }).catch(error => {})
  },
  onReachBottom: function() {
    let _this = this
    if (!_this.data.isLastPage) {
      _this.setData({
        loading: 1
      }, () => {
        _this.getCouponList(_this.data.pageNo + 1)
      })
    }
  },
  //去分享
  toShare: function(e) {
    let _this = this
    let {
      type,
      id,
      useScenes
    } = e.currentTarget.dataset
    Promise.all([_this.shareCard(id, type), _this.getShareInfo(id, type)]).then(function() {
      _this.setData({
        showImg: true
      })
    }).catch(function() {})
    if (type == 1 && (useScenes == 0 || useScenes == 1)) {
      _this.setData({
        showGoods: true
      })
    }
    _this.setData({
      couponId: id,
      cardType: type
    })
  },
  close: function() {
    this.setData({
      showImg: false,
      showGoods: false
    })
  },
  preventClose: function() {},
  //保存图片
  saveImg() {
    let _this = this
    let _global = app.globalData
    wx.saveImageToPhotosAlbum({
      filePath: _this.data.cardImg,
      success: function(fres) {
        utils.globalShowTip(false)
        wx.showModal({
          content: '图片已经成功保存到你的相册，可以直接从相册中选择发送哦~',
          cancelText: '关闭',
          confirmText: '查看图片',
          success(res) {
            let confirm = res.confirm
            let cancel = res.cancel
            if (confirm) {
              //点击查看图片
              wx.previewImage({
                current: _this.data.cardImg, // 当前显示图片的http链接
                urls: [_this.data.cardImg] // 需要预览的图片http链接列表
              })
            }
          }
        })
      }
    })
  },
  previewImg: function() {
    wx.previewImage({
      current: this.data.cardImg, // 当前显示图片的http链接
      urls: [this.data.cardImg] // 需要预览的图片http链接列表
    })
  },
  //加商品
  toGoods: function() {
    let {
      couponId,
      cardType
    } = this.data
    wx.navigateTo({
      url: '/pages/account/account?couponId=' + couponId + '&cardType=' + cardType
    })
  },
  //去优惠券详情
  toCoupon: function(e) {
    let _global = app.globalData
    let dataSet = e.currentTarget.dataset
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&cardId=' + dataSet.id
    wx.navigateTo({
      url: url
    })
  },
  // 获取分享图信息
  getShareInfo: function(couponId, cardType) {
    let _this = this
    let _global = app.globalData
    let url = _global.baseUrl + `/emallMiniApp/poster/getCardPoster/${_global.shopId}/${couponId}/${cardType}`
    return new Promise(function(resolve, reject) {
      utils.$http(url, {}).then(res => {
        if (res.result) {
          let result = res.result
          let config = {
            width: 750,
            height: 985,
            preload: true,
            debug: false,
            texts: [{
                x: 270,
                y: 580,
                text: result.cardName,
                lineNum:2,
                width: 265,
                fontSize: 28,
                color: '#333',
                zIndex: 100
              }, {
                x: 50,
                y: 840,
                text: "专属顾问" + result.empName,
                color: '#333',
                fontSize: 28,
                zIndex: 100
              },
              {
                x: 50,
                y: 790,
                text: result.storeName,
                lineNum: 1,
                width: 600,
                color: '#666',
                fontSize: 24,
                zIndex: 100
              },
              {
                x: 270,
                y: 640,
                text: result.cardDateTip,
                lineNum: 1,
                width: 600,
                color: '#666',
                fontSize: 24,
                zIndex: 100
              },
              {
                x: 50,
                y: 890,
                text: "长按识别二维码，立即领券",
                color: '#666',
                fontSize: 24,
                zIndex: 100
              },
              {
                x: 75,
                y: 590,
                text: result.amount,
                color: '#fe2f54',
                fontSize: 56,
                zIndex: 100
              },
              {
                x: 50,
                y: 590,
                text: '￥',
                color: '#fe2f54',
                fontSize: 30,
                zIndex: 100
              }
            ],
            images: [{
                width: 750,
                height: 985,
                x: 0,
                y: 0,
                url: result.bgImg,
              },
              {
                width: 750,
                height: 430,
                x: 0,
                y: 500,
                url: result.cardContentBg
              },
              {
                width: 140,
                height: 140,
                x: 560,
                y: 760,
                url: result.miniCode
              }
            ]
          }
          if (result.cardConditionAmount) {
            config.texts.push({
              x: 50,
              y: 640,
              text: result.cardConditionAmount,
              color: '#666',
              fontSize: 24,
              zIndex: 100
            })
          }
          _this.setData({
            config: config
          }, () => {
            Poster.create(true) // 入参：true为抹掉重新生成
            utils.globalShowTip(false)
          })
          resolve()
        }
      }).catch(err => {})
    })
  },
  //店员分享卡券时卡券分享的信息
  shareCard: function(couponId, cardType) {
    let _this = this
    let _global = app.globalData
    let {
      goodsId
    } = _this.data
    let url = _global.lkBaseUrl + `/el-imfans-linke-api/emp/sharingcard/fans/show/${_global.shopId}/${_global.storeId}/${_global.empId}/${couponId}`
    return new Promise(function(resolve, reject) {
      utils.$http(url, {
        goodsId: goodsId || '',
        cardType: cardType
      }, '', 1).then(res => {
        if (res.result) {
          _this.setData({
            shareInfo: res.result
          })
          resolve()
        }
      }).catch(err => {})
    })
  },
  //canvas生成分享图成功
  onPosterSuccess(e) {
    const {
      detail
    } = e
    this.setData({
      cardImg: detail
    })
  },
  //选择客户列表页面
  toList: function() {
    let {
      shareInfo,
      couponId,
      goodsId,
      cardType
    } = this.data
    let url = `/pages/account/groupList/groupList?shareInfo=${JSON.stringify(shareInfo)}&cardId=${couponId}&goodsId=${goodsId || ''}&cardType=${cardType}`
    if (shareInfo.recommendUserType == 0) {
      url = `/pages/account/customList/customList?shareInfo=${JSON.stringify(shareInfo)}&cardId=${couponId}&goodsId=${goodsId || ''}&cardType=${cardType}`
    }
    this.setData({
      showImg: false
    })
    wx.navigateTo({
      url: url
    })
  }
})