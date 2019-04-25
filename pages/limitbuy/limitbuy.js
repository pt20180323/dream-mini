const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    pageNo: 1,
    goodsList: [], //商品列表
    activityId: '',
    elActivityVo: {},
    isLastPage: false,
    isshowEmpty: false,
    isCountDownEnd: false,
    isfore: false, //是否预告
    listType: 2, //列表展示类型：0大图/1中图/2小图
    activityType: 9, //链接类型
    countHtml: '',
    timeStatus: '', //活动商品状态
    startTime: 0, //预售商品活动开始时间
    interval: '', //定时器
    loading: false,
    noMsg: '未查询到该活动相关商品！'
  },
  onLoad(opt) {
    let _this = this
    if (opt.activityId) {
      _this.setData({
        shopId: opt.shopId || '',
        storeId: opt.storeId || '',
        activityId: opt.activityId,
        activityType: opt.activityType || 9
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
      app.reanderZjLeave(0, behaviorId,"activityId",activityId)
    }
  },

  initData() {
    this.getActivity()
    this.getShareImg()
  },
  getActivity() { //查询活动主题
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    let _url = `${baseUrl}/emallMiniApp/offers/index/${shopId}/${storeId}/${this.data.activityId}`
    utils.$http(_url, {}, '', 1).then(res => {
      if (res) {
        this.activityRender(res)
      }
    }).catch((res) => {})
  },
  activityRender(res) { //渲染活动主题
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
      _this.setData({
        isloaded: true,
        activityId: _rst.activityId || _this.data.activityId,
        elActivityVo: _rst,
        isfore: _rst.runStatus === 1,
        isCountDownEnd: _rm <= 0,
        listType: _rst.picShow
      })
      if (_rst.runStatus !== 0) { //未停用的活动        
        if (_rm > 0) {
          let _data = _this.data
          _this.countDown(--_rst.countDownSeconds)
          _data.interval = setInterval(() => {
            if (_data.elActivityVo.countDownSeconds >= 0) {
              _this.countDown(--_data.elActivityVo.countDownSeconds)
            }
          }, 1000)
        }
        _this.setActivityPvuv()
        app.reanderZj(0, "activityId", _this.data.activityId).then(res => {
          _this.setData({
            behaviorId: res
          })
        })
        _this.getShopList()
      }
    }
  },
  getShopList(pageNo) {
    let {
      baseUrl,
      storeId,
      shopId
    } = app.globalData
    this.data.pageNo = pageNo || 1
    let _url = `${baseUrl}/emallMiniApp/offers/list/${shopId}/${storeId}/${this.data.activityId}/${this.data.pageNo}`
    utils.$http(_url, {
      pageSize: 10
    }, '', this.data.loading).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.setData({
          loading: false
        })
        this.shopListRender(res)
      }
    }).catch((res) => {})
  },
  shopListRender(res) {
    let _this = this
    if (res && res.result) {
      let _rst = res.result
      let _list = _rst.result || []
      let _data = _this.data
      _this.setData({
        isLastPage: !_rst.hasNextPage,
        goodsList: _data.goodsList.concat(_list),
      })
      if (!_data.goodsList.length) {
        _this.setData({
          isshowEmpty: true
        })
      } else {
        _this.setData({
          isshowEmpty: false
        })
      }
    }
  },
  setActivityPvuv() {
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    let url = `${baseUrl}/emallMiniApp/activity/setActivityPvuv/${shopId}/${storeId}/${this.data.activityId}`
    utils.$http(url, {}, 'POST', 1).then(res => {}).catch(res => {})
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
        _this.getShopList(_this.data.pageNo + 1)
      })
    }
  },
  toDetail(evt) {
    let _this = this
    let dst = evt.currentTarget.dataset
    let _data = _this.data
    wx.navigateTo({
      url: '/pages/commonshop/productDetail/productDetail?activityId=' + dst.aid + '&goodsId=' + dst.gid + '&timeStatus=' + _data.isfore + '&activityType=' + _data.activityType + '&shopId=' + _data.shopId + '&storeId=' + _data.storeId
    })
  },
  onShareAppMessage(res) {
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/limitbuy/limitbuy?shareStoreId=' + app.getStoreId() + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + _data.activityId
    return {
      title: _data.elActivityVo.miniTitle,
      path: _url,
      imageUrl: _data.elActivityVo.miniTsharePic,
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  //获取活动图片
  getShareImg() {
    let _global = app.globalData
    let _this = this
    let url = _global.baseUrl + `/emallMiniApp/activity/getActivityFilePath/${_global.shopId}/${_this.data.activityId}`
    utils.$http(url, {
      sessionId: _global.sessionKey
    }, '', 1).then(res => {
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
  preventClose: function() {

  },
  previewImg: function() {
    wx.previewImage({
      current: this.data.shareImg, // 当前显示图片的http链接
      urls: [this.data.shareImg] // 需要预览的图片http链接列表
    })
  }
})