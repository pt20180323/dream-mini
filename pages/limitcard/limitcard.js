const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNo: 1,
    cardList: [], //卡券列表
    activityId: '',
    elActivityVo: {},
    isLastPage: false,
    isshowEmpty: false,
    isCountDownEnd: false,
    isfore: true, //是否预告
    listType: '', //列表展示类型：1大图/2中图/3小图
    linkType: 7, //链接类型
    listArr: [1, 2, 3],
    countHtml: '',
    timeStatus: '', //活动商品状态
    startTime: 0, //预售商品活动开始时间
    interval: '', //定时器
    loading: false,
    noMsg: '暂无相关优惠券'
  },
  onLoad(opt) {
    let _this = this
    if (opt.activityId) {
      _this.setData({
        shopId: opt.shopId || '',
        storeId: opt.storeId || '',
        activityId: opt.activityId,
        activityType: opt.activityType || 13
      })
      app.checkUserId(_this.initData)
    }
  },
  onHide() {
    let {
      behaviorId,
      activityId
    } = this.data
    if (behaviorId) {
      app.reanderZjLeave(1, behaviorId, "activityId", activityId)
    }
  },
  initData() {
    let _this = this
    _this.getCardZone()
    _this.getShareImg()
  },
  countDown(num) {
    let _this = this
    _this.data.elActivityVo.countDownSeconds = num
    if (num <= 0) {
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
  getCardZone() { //获取领券专区主题信息
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId
    }
    let url = `${_global.baseUrl}/emallMiniApp/voucher/index/${params.shopId}/${params.storeId}/${params.activityId}`
    utils.$http(url, {},'',1).then(res => {
      if (res) {
        _this.activityRender(res)
      }
    }).catch((res) => {})
  },
  activityRender(res) { //渲染活动详情数据
  let _this = this
    if (res && res.result) {
      let _rst = res.result
      let storeFlag = _rst.storeFlag
      let _rm = _rst.countDownSeconds
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
      this.setData({
        isloaded: true,
        activityId: _rst.activityId,
        elActivityVo: _rst,
        isCountDownEnd: _rm <= 0
      })
      if (_rst.runStatus !== 0) { //未停用的活动        
        if (_rm > 0) {
          let _data = this.data
          this.countDown(--_rst.countDownSeconds)
          _data.interval = setInterval(() => {
            if (_data.elActivityVo.countDownSeconds >= 0) {
              this.countDown(--_data.elActivityVo.countDownSeconds)
            }
          }, 1000)
        }
        this.setActivityPvuv()
        app.reanderZj(1, "activityId", _this.data.activityId).then(res => {
          _this.setData({
            behaviorId: res
          })
        })
        this.getCardList()
      }
    }
  },
  getCardList(pageNo) { //获取卡券列表
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    this.data.pageNo = pageNo || 1
    let _url = `${baseUrl}/emallMiniApp/voucher/forwardList/${shopId}/${storeId}/${this.data.activityId}/${this.data.pageNo}`
    utils.$http(_url, {
      pageSize: 10
    }, '', this.data.loading).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.setData({
          loading: false
        })
        this.cardListRender(res)
      }
    }).catch((res) => {})
  },
  cardListRender(res) {
    let _this = this
    if (res && res.result) {
      let _rst = res.result
      let _list = _rst.result || []
      _this.setData({
        isLastPage: !_rst.hasNextPage,
        cardList: _this.data.cardList.concat(_list)
      })
    }
    if (!_this.data.cardList.length) {
      _this.setData({
        isshowEmpty: true
      })
    } else {
      _this.setData({
        isshowEmpty: false
      })
    }
  },
  getCard(evt) { //领取代金券
    let formId = evt.detail.formId
    let dts = evt.currentTarget.dataset
    if (formId) {
      app.saveFormIdSecond(formId)
    }
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId || '',
      ctype: dts.ctype,
      cid: dts.cid,
    }
    let clist = _data.cardList[dts.cidx]
    if (clist.received >= clist.limits) {
      utils.globalToast('已领完', 'none')
      return false
    }
    let _url = `${_global.baseUrl}/emallMiniApp/voucher/receive/${params.shopId}/${params.storeId}/${params.activityId}/${params.cid}/${params.ctype}`
    utils.$http(_url, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        clist.received++
          // if (clist.received >= clist.limits) {
          //   clist.status = 10001
          // }
        _this.setData({
          cardList: _data.cardList
        })
        utils.globalToast('领取成功', 'none')
        setTimeout(() => {
          wx.addCard({
            cardList: JSON.parse(res.result),
            success(res) {
              console.log(res.cardList) // 卡券添加结果
            },
            complete(res) {
              console.log(res)
            },
            fail(res) {
              console.log(res)
            }
          })
        }, 2000)
      }
    }).catch((res) => {})
  },
  setActivityPvuv() {
    let _this = this
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    let url = `${baseUrl}/emallMiniApp/activity/setActivityPvuv/${shopId}/${storeId}/${_this.data.activityId}`
    utils.$http(url, {}, 'POST', 1).then(res => {}).catch(res => {})
  },
  setFormId(evt) {
    let formId = evt.detail.formId
    app.saveFormIdSecond(formId)
  },
  onReachBottom() {
    const _this = this
    if (!_this.data.isLastPage) {
      _this.setData({
        loading: 1
      }, () => {
        _this.getCardList(_this.data.pageNo + 1)
      })
    }
  },
  //获取活动图片
  getShareImg() {
    let _global = app.globalData
    let _this = this
    let url = _global.baseUrl + `/emallMiniApp/activity/getActivityFilePath/${_global.shopId}/${_this.data.activityId}`
    utils.$http(url, {
      sessionId: _global.sessionKey
    }).then(res => {
      if (res.result) {
        _this.setData({
          shareImg: res.result.filePath
        })
      }
    }).catch(err => {})
  },
  //保存图片
  saveImg() {
    let _this = this
    wx.getImageInfo({
      src: _this.data.shareImg,
      success: function(sres) {
        wx.saveImageToPhotosAlbum({
          filePath: sres.path,
          success: function(fres) {
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
                    current: _this.data.shareImg, // 当前显示图片的http链接
                    urls: [_this.data.shareImg] // 需要预览的图片http链接列表
                  })
                }
              },
              fail() {}
            })
          }
        })
      }
    })
  },
  toShare: function() {
    if (!this.data.shareImg) {
      this.getShareImg()
    }
    this.setData({
      isShow: true
    })
  },
  close: function() {
    this.setData({
      isShow: false
    })
  },
  preventClose: function() {},
  previewImg: function() {
    wx.previewImage({
      current: this.data.shareImg, // 当前显示图片的http链接
      urls: [this.data.shareImg] // 需要预览的图片http链接列表
    })
  },
  //去优惠券详情
  toCoupon: function(e) {
    let _global = app.globalData
    let dataSet = e.currentTarget.dataset
    let use = dataSet.use || ''
    let type = dataSet.type
    let useScenes = dataSet.useScenes
    let _env = _global.environment
    let isCustom
    if (_env && _env.toLowerCase() === 'wxwork') {
      isCustom = false
    } else {
      isCustom = true
    }
    let url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&cardId=' + dataSet.id + '&isCustom=' + isCustom + '&use=' + use
    if (use) { //立即使用按钮  并且是通用或线上代金券 进入商品列表  后期进入新增的券加商品列表
      if (type === 1 && (useScenes === 0 || useScenes === 1)) {
        url = '/pages/activity/shopList/shopList?cardId=' + dataSet.id + '&conditionAmount=' + dataSet.condition
      }
    }
    wx.navigateTo({
      url: url
    })
  }
})