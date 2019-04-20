const utils = require('../../../utils/util.js')
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
    isfore: true //活动是否是预告
  },
  onLoad(opt) {
    let _this = this
    _this.setData({
      storeId: opt.storeId || '',
      activityId: opt.activityId || '',
      activityType: opt.activityType || 12
    })
    app.checkUnionId(_this.initData)
  },
  onUnload() {
    let _this = this;
    let _data = _this.data
    if (_data.behaviorId) {
      _this.reanderZjLeave()
    }
  },
  onHide() {
    let _this = this;
    let _data = _this.data
    if (_data.behaviorId) {
      _this.reanderZjLeave()
    }
  },
  initData() {
    let _this = this
    _this.getShopList()
    _this.getShareImg()
  },
  getShopList(pageNo) {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    _data.pageNo = pageNo || 1
    let params = {
      shopId: _global.shopId,
      pageSize: 10,
      pageNumber: pageNo || 1,
      storeId: _global.storeId,
      activityId: _data.activityId,
      userType: _global.userType,
      sessionId: _global.sessionKey,
      buyerId: _global.buyerId
    }
    utils.$http(_global.baseUrl + '/elshop/teamShop/findTeamShopList', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopListRender(res)
      }
    }).catch((res) => {})
  },
  shopListRender(res) {
    let _this = this
    let _data = _this.data
    if (res && res.result) {
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
      _this.reanderZj()
      let isLast = false
      let timeStatus = _rst.elActivityVo.timeStatus
      if (!_rst.hasNext) {
        isLast = true
      }
      _rst.elActivityVo = _rst.elActivityVo || {}
      _rst.elActivityVo.countDownSeconds = parseInt(_rst.elActivityVo.countDownSeconds || 0)
      _this.setData({
        isfore: timeStatus == 1, // 0=已停用,1=未开场,2=已开场未结束(活动进行中),3=已结束
        isLastPage: isLast,
        elActivityVo: _rst.elActivityVo,
        shopList: _this.data.shopList.concat(_rst.teamShopList),
        teamshopInfo: _rst.teamshopInfo
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
  //用户浏览足迹 - 用户进入
  reanderZj: function() {
    let _this = this
    let _gData = app.globalData
    let params = {
      shopId: _gData.shopId,
      storeId: _gData.storeId,
      'type': 1
    }
    let data = {
      empId: _gData.shareEmpId || '',
      activityId: _this.data.activityId
    }
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/entrance/' + params.shopId + '/' + params.storeId + '/' + params.type, data, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          behaviorId: res.result
        })
      }
    }).catch(error => {
      //utils.globalShowTip(false)
    })
  },
  //用户浏览足迹 - 用户离开
  reanderZjLeave() {
    let _this = this
    let _gData = app.globalData
    let params = {
      shopId: _gData.shopId,
      storeId: _gData.storeId,
      'type': 1,
      behaviorId: _this.data.behaviorId
    }
    let data = {
      empId: _gData.shareEmpId || '',
      activityId: _this.data.activityId
    }
    utils.$http(_gData.baseUrl + '/emallMiniApp/behavior/leave/' + params.shopId + '/' + params.storeId + '/' + params.type + '/' + params.behaviorId, data, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
      }
    }).catch(error => {
      //utils.globalShowTip(false)
    })
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
    app.saveFormId(formId)
  },
  onReachBottom() {
    const _this = this
    if (_this.data.isLastPage) {
      utils.globalShowTip(false)
    } else {
      _this.getShopList(_this.data.pageNo + 1)
    }
  },
  onShareAppMessage(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      // console.log(res.target)
    }
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/teamshop/index/index?storeId=' + app.getStoreId() + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + (_data.activityId)
    return {
      title: _data.teamshopInfo.miniTitle,
      path: _url,
      imageUrl: _data.teamshopInfo.miniTsharePic,
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
                    current: sres.path, // 当前显示图片的http链接
                    urls: [sres.path] // 需要预览的图片http链接列表
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
  }
})