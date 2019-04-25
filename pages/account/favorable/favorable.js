const utils = require('../../../utils/util.js')
import Poster from '../../component/wxa-plugin-canvas/poster/poster'
let app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showImg: false,
    coupon: '',
    goods: '',
    shareImg: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    let _this = this
    _this.setData({
      couponId: opt.couponId,
      goodsId: opt.goodsId,
      cusId: opt.cusId || '',
      isQy: opt.isQy || '',
      img: opt.img || '',
      cardType: opt.cardType
    })
    app.checkUserId(_this.initData)
  },
  initData: function() {
    let _this = this
    _this.getShareImg()
    _this.shareCard()
    _this.getCoupon().then(function() {
      _this.getGoods()
    })
  },
  //获取优惠券详情
  getCoupon: function() {
    let _this = this
    let _global = app.globalData
    let couponId = _this.data.couponId
    return new Promise(function(resolve, reject) {
      utils.$http(_global.baseUrl + '/emallMiniApp/voucher/detail/' + _global.shopId + '/' + couponId, {}).then(res => {
        utils.globalShowTip(false)
        if (res && res.result) {
          let result = res.result
          _this.setData({
            coupon: result
          })
          resolve()
        }
      }).catch(error => {
        utils.globalShowTip(false)
      })
    })
  },
  //获取商品详情
  getGoods: function() {
    let _this = this
    let _global = app.globalData
    let coupon = _this.data.coupon
    let goodsId = _this.data.goodsId
    utils.$http(_global.baseUrl + '/emallMiniApp/goods/detail/' + _global.shopId + '/' + _global.storeId + '/' + goodsId, {
      sessionId: _global.sessionKey
    }, '').then(res => {
      utils.globalShowTip(false)
      if (res && res.result) {
        let result = res.result
        if (coupon.type == 1) {
          if (result.minSalePriceDouble >= coupon.conditionAmount) {
            let couponPrice = utils.strip(result.minSalePriceDouble - coupon.amount)
            if (couponPrice >= 0) {
              result.couponPrice = couponPrice
            } else {
              result.couponPrice = 0
            }
          } else {
            result.couponPrice = result.minSalePriceDouble
          }
        } else if (coupon.type == 2) {
          let couponPrice = utils.strip(result.minSalePriceDouble * coupon.discountAmount)
          if (utils.strip(result.minSalePriceDouble - couponPrice) <= coupon.discountLimit) {
            result.couponPrice = couponPrice
          } else {
            result.couponPrice = utils.strip(result.minSalePriceDouble - coupon.discountLimit)
          }
        } else {
          result.couponPrice = result.minSalePriceDouble
        }
        _this.setData({
          goods: result
        })
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  //去分享
  toShare: function() {
    let {
      cusId,
      isQy
    } = this.data
    if (cusId) {
      if (isQy && isQy == 'true') {
        this.toQyShare()
      } else {
        this.toChatShare()
      }
    } else {
      this.setData({
        showImg: true
      })
    }
  },
  close: function() {
    this.setData({
      showImg: false
    })
  },
  preventClose: function() {},
  //保存图片
  saveImg() {
    let _this = this
    utils.globalShowTip(true, '图片下载中...')
    wx.downloadFile({
      url: _this.data.shareImg,
      success(res) {
        //图片保存到本地
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success(data) {
            utils.globalShowTip(false)
            wx.showModal({
              content: '图片已经成功保存到你的相册，可以直接从相册中选择发送哦~',
              cancelText: '关闭',
              confirmText: '查看图片',
              success(sres) {
                let confirm = sres.confirm
                if (confirm) {
                  //点击查看图片
                  wx.previewImage({
                    current: _this.data.shareImg, // 当前显示图片的http链接
                    urls: [_this.data.shareImg] // 需要预览的图片http链接列表
                  })
                }
              }
            })
          },
          fail(err) {
            utils.globalShowTip(false)
          }
        })
      },
      fail(res) {
        utils.globalShowTip(false)
        let msg = '网络异常，请稍后再试！'
        if (res.errMsg === 'downloadFile:fail url not in domain list') {
          msg = '下载合法域名错误！'
        }
        wx.showToast({
          title: msg,
          icon: 'none'
        })
      }
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
  //调用企业微信分享api
  toQyShare: function() {
    let _this = this
    let _empId = app.getEmpId()
    let {
      goodsId,
      couponId,
      cusId,
      shareInfo
    } = this.data
    let _global = app.globalData
    let _url = '/pages/account/favorable/cfavorable/cfavorable?' + (_empId ? ('empId=' + _empId) : '') + '&goodsId=' + goodsId + '&cardId=' + couponId + '&isCustom=true'
    wx.qy.shareAppMessageEx({
      title: shareInfo.shareTitle,
      imageUrl: shareInfo.pic,
      path: _url,
      selectedExternalUserIds: [cusId] || [],
      success: function(res) {
        _this.saveShareHistory()
      },
      fail: function(res) {}
    })
  },
  //去聊天详情分享优惠券
  toChatShare: function() {
    this.setData({
      showChat: true
    })
  },
  hideChat() {
    this.setData({
      showChat: false
    })
  },
  sureSend: function() {
    this.saveShareHistory()
    this.setCus()
  },
  //发送给客户接口
  setCus: function() {
    let {
      lkBaseUrl,
      shopId,
      storeId,
      empId
    } = app.globalData
    utils.$http(lkBaseUrl + `/el-imfans-linke-api/miniChat/sendCardMsg/${shopId}/${storeId}/${empId}/${this.data.couponId}`, {
      hyIds: this.data.cusId,
      goodsId: this.data.goodsId || '',
      cardType: this.data.cardType
    }, 'POST').then(res => {
      utils.globalShowTip(false)
      this.setData({
        showChat: false
      })
      wx.showToast({
        title: '已发送',
        icon: 'none'
      })
    }).catch(err => {})
  },
  //商品详情
  toDetail: function() {
    let goods = this.data.goods
    let atype = goods.activityType
    let goodsId = goods.id
    let activivtyId = goods.activityId
    let shopId = goods.shopId
    let storeId = goods.storeId
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
  // 获取分享图
  getShareImg() {
    let _global = app.globalData
    let _this = this
    let goodsId = _this.data.goodsId
    let couponId = _this.data.couponId
    let url = _global.baseUrl + `/emallMiniApp/goods/getGoodsAndCardPoster/${_global.shopId}/${_global.empId}/${goodsId}/${couponId}`
    utils.$http(url, {}, '', 1).then(res => {
      if (res.result) {
        _this.setData({
          shareImg: res.result.filePath
        })
      }
    }).catch(err => {})
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
                lineNum: 2,
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
  previewImg: function() {
    wx.previewImage({
      current: this.data.cardImg, // 当前显示图片的http链接
      urls: [this.data.cardImg] // 需要预览的图片http链接列表
    })
  },
  //重新选择商品
  toGoods: function() {
    let {
      goodsId,
      couponId,
      cardType
    } = this.data
    wx.redirectTo({
      url: `/pages/account/account?goodsId=${goodsId}&couponId=${couponId}&cardType=${cardType}`
    })
  },
  //去优惠券详情
  toCouponDet: function(e) {
    let _global = app.globalData
    let coupon = this.data.coupon
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&cardId=' + coupon.id
    wx.navigateTo({
      url: url
    })
  },
  //店员分享卡券时卡券分享的信息
  shareCard: function() {
    let _global = app.globalData
    let {
      couponId,
      goodsId,
      cardType
    } = this.data
    let url = _global.lkBaseUrl + `/el-imfans-linke-api/emp/sharingcard/fans/show/${_global.shopId}/${_global.storeId}/${_global.empId}/${couponId}`
    utils.$http(url, {
      goodsId: goodsId,
      cardType: cardType
    }, '', 1).then(res => {
      if (res.result) {
        this.setData({
          shareInfo: res.result
        })
      }
    }).catch(err => {})
  },
  //选择客户列表页面
  toList: function() {
    let {
      shareInfo,
      couponId,
      goodsId,
      cardType
    } = this.data
    let url = `/pages/account/groupList/groupList?shareInfo=${JSON.stringify(shareInfo)}&cardId=${couponId}&goodsId=${goodsId}&cardType=${cardType}`
    if (shareInfo.recommendUserType == 0) {
      url = `/pages/account/customList/customList?shareInfo=${JSON.stringify(shareInfo)}&cardId=${couponId}&goodsId=${goodsId}&cardType=${cardType}`
    }
    this.setData({
      showImg: false
    })
    wx.navigateTo({
      url: url
    })
  },
  // 导购分享卡券记录接口
  saveShareHistory() {
    let _this = this
    let _global = app.globalData
    let {
      cardId
    } = _this.data
    let _url = `${_global.lkBaseUrl}/el-imfans-linke-api/card/saveShareHistory/${_global.shopId}/${_global.storeId}/${_global.empId}`
    let _params = {
      cardId: cardId
    }
    utils.$http(_url, _params, 'GET', 'noTips').then(res => {}).catch(error => {})
  }
})