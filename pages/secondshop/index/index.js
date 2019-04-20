const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNo: 1,
    goodsList: [], //商品列表
    activityId: '',
    elActivityVo: {},
    isLastPage: false,
    isshowEmpty: false,
    isCountDownEnd: false,
    isfore: true, //是否预告
    listType: 0, //列表展示类型：0大图/1中图/2小图
    activityType: 7, //链接类型
    listArr: [1, 2, 3],
    countHtml: '',
    timeStatus: '', //活动商品状态
    startTime: 0, //预售商品活动开始时间
    interval: '' //定时器
  },
  onLoad(opt) {
    let _this = this
    _this.setData({
      shopId: opt.shopId || '',
      storeId: opt.storeId || '',
      activityId: opt.activityId || '',
      activityType: opt.activityType || 7
    })
    //app.checkUnionId(_this.setActivityPvuv)
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
    utils.globalShowTip(false)
    _this.getActivityDet()
    _this.getShareImg()
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
  setActivityPvuv() {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId
    }
    let url = `${_global.baseUrl}/seckill-miniapp/activity/setActivityPvuv/${params.shopId}/${params.storeId}/${params.activityId}`
    utils.$http(url, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
      }
    }).catch((res) => {})
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
  getActivityDet() {
    let _this = this
    let _data = _this.data
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId
    }
    let _url = `${_global.baseUrl}/seckill-miniapp/activity/detail/${params.shopId}/${params.storeId}/${params.activityId}`
    utils.$http(_url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.activityRender(res)
      }
    }).catch((res) => {})
  },
  //渲染活动详情数据
  activityRender(res) {
    if (res && res.result) {
      let _this = this
      let _data = this.data
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
      let httpsPic = _rst.activityVo.httpsPic
      let countDownSeconds = parseInt(_rst.activityVo.countDownSeconds || 0)
      let timeStatus = _rst.activityVo.timeStatus //0=已停用,1=未开场,2=已开场未结束(活动进行中),3=已结束
      let startTime = utils.getTime(_rst.activityVo.startTime)
      let picShow = _rst.seckillInfo ? _rst.seckillInfo.picShow : []
      let activityId = _rst.activityVo.id
      _data.elActivityVo = {
        activityId: activityId,
        countDownSeconds: countDownSeconds,
        httpsPic: httpsPic
      }
      _this.setData({
        activityId: activityId,
        elActivityVo: _data.elActivityVo,
        isfore: timeStatus == 1,
        startTime: startTime,
        listType: picShow,
        seckillInfo: res.result.seckillInfo
      })
      _this.reanderZj()
      _this.setActivityPvuv()
      _this.getGoodsList()
      _this.countDown(--_data.elActivityVo.countDownSeconds)
      _data.interval = setInterval(() => {
        if (_data.elActivityVo.countDownSeconds >= 0) {
          _this.countDown(--_data.elActivityVo.countDownSeconds)
        }
      }, 1000)
    }
  },
  getGoodsList(pageNo) {
    let _this = this
    let _data = _this.data
    _data.pageNo = pageNo || 1
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      activityId: _data.activityId || '',
      pageSize: 10,
      pageNumber: pageNo || 1,
    }
    utils.$http(app.globalData.baseUrl + '/seckill-miniapp/activity/goods/list/' + params.shopId + '/' + params.storeId + '/' + params.activityId + '/' + params.pageNumber, {
      pageSize: params.pageSize
    }).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.goodsListRender(res)
      }
    }).catch(res => {
      //utils.globalShowTip(false)
      console.log(res)
    })
  },
  goodsListRender(res) {
    let _this = this
    if (res && res.result) {
      let _result = res.result
      let isLast = false
      let totalPage = parseInt(_result.totalPageNumber)
      let currPage = parseInt(_result.thisPageNumber)
      if (totalPage == currPage) {
        isLast = true
      }
      let result = _result.result
      _this.setData({
        hasNextPage: _result.hasNextPage,
        hasPreviousPage: _result.hasPreviousPage,
        isLastPage: isLast,
        goodsList: _this.data.goodsList.concat(result),
      })
      if (!_this.data.goodsList.length) {
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
  setFormId(evt) {
    let formId = evt.detail.formId
    app.saveFormIdSecond(formId)
  },
  onReachBottom() {
    const _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getGoodsList(_this.data.pageNo + 1)
    }
  },
  toDetail(evt) {
    let _this = this
    let dst = evt.currentTarget.dataset
    console.log(dst)
    wx.navigateTo({
      url: '/pages/secondshop/productDetail/productDetail?activityId=' + dst.aid + '&goodsId=' + dst.gid + '&timeStatus=' + _this.data.isfore + '&activityType=' + _this.data.activityType + '&shopId=' + _this.data.shopId + '&storeId=' + _this.data.storeId
    })
  },
  onShareAppMessage(res) {
    if (res.from === 'button') {}
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/secondshop/index/index?shareStoreId=' + app.getStoreId() + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + _data.activityId
    return {
      title: _data.seckillInfo.miniTitle,
      path: _url,
      imageUrl: _data.seckillInfo.miniTsharePic,
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
    utils.$http(url, { sessionId: _global.sessionKey }, '', 1).then(res => {
      if (res.result) {
        _this.setData({
          shareImg: res.result.filePath
        })
      }
    }).catch(err => { })
  },
  //保存图片
  saveImg() {
    let _this = this
    wx.getImageInfo({
      src: _this.data.shareImg,
      success: function (sres) {
        wx.saveImageToPhotosAlbum({
          filePath: sres.path,
          success: function (fres) {
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
              fail() { }
            })
          }
        })
      }
    })
  },
  toShare: function () {
    if (!this.data.shareImg) {
      this.getShareImg()
    }
    this.setData({
      isShow: true
    })
  },
  close: function () {
    this.setData({
      isShow: false
    })
  },
  preventClose: function () {

  },
  previewImg: function () {
    wx.previewImage({
      current: this.data.shareImg, // 当前显示图片的http链接
      urls: [this.data.shareImg] // 需要预览的图片http链接列表
    })
  }
})