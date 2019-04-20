const utils = require('../../utils/util.js')
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
    isfore: false, //是否预告
    listType: 2, //列表展示类型：0大图/1中图/2小图
    activityType: 9, //链接类型
    countHtml: '',
    timeStatus: '', //活动商品状态
    startTime: 0,//预售商品活动开始时间
    interval: '' //定时器
  },
  onLoad(opt){
    let _this = this
    //opt.activityId = '22d62f0c-b17a-4ab6-962f-0cb17abab680'
    if (opt.activityId) {
      _this.setData({
        shopId: opt.shopId || '',
        storeId: opt.storeId || '',
        activityId: opt.activityId,
        activityType: opt.activityType || 9
      })
      app.checkUnionId(_this.initData)
    }    
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
  initData(){
    let _this = this
    let _data = _this.data
    let _global = app.globalData  
    utils.globalShowTip(false)
    _this.getActivity()
    _this.getShareImg()
  },
  //用户浏览足迹 - 用户进入
  reanderZj: function () {
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
  getActivity(){//查询活动主题
    let _global = app.globalData
    let _data = this.data
    let params = {
      shopId: _global.shopId,
      storeId: _global.storeId,
      activityId: _data.activityId || ''
    }
    let _url = `${_global.baseUrl}/emallMiniApp/fulReduce/index/${params.shopId}/${params.storeId}/${params.activityId}`
    utils.$http(_url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.activityRender(res)
      }
    }).catch((res) => { })
  },  
  activityRender(res) {//渲染活动主题
    let _this = this
    if(res && res.result){
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
        isCountDownEnd: _rm <= 0
      })      
      if (_rst.runStatus !== 0) {//未停用的活动        
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
        _this.reanderZj()
        _this.getShopList()
      }
    }
  },
  getShopList(pageNo) {
    let _this = this
    let _data = _this.data
    let _gd = app.globalData
    _data.pageNo = pageNo || 1
    let params = {
      shopId: _gd.shopId,
      storeId: _gd.storeId,
      activityId: _data.activityId || '',
      pageSize: 10,
      pageNo: pageNo || 1,
    }
    let _url = `${_gd.baseUrl}/emallMiniApp/fulReduce/list/${params.shopId}/${params.storeId}/${params.activityId}/${params.pageNo}`
    utils.$http(_url, { pageSize: params.pageSize }).then(res => {
      if (res) {
        utils.globalShowTip(false)        
        this.shopListRender(res)
      }
    }).catch((res) => { })
  },
  shopListRender(res) {
    let _this = this
    if (res && res.result) {
      let _rst = res.result
      let _list = _rst.result || []
      let _data = _this.data
      _this.setData({
        hasNextPage: _rst.hasNextPage,
        hasPreviousPage: _rst.hasPreviousPage,
        isLastPage: _rst.isLastPage,
        goodsList: _data.goodsList.concat(_list),
      })
      if (!_data.goodsList.length){
        _this.setData({
          isshowEmpty: true
        })
      }
    }
  },
  setActivityPvuv(){
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
    }).catch(res => {
      //utils.globalShowTip(false)
      console.log(res)
    })
  },
  countDown (num) {
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
  setFormId (evt) {
    let formId = evt.detail.formId
    app.saveFormIdSecond(formId)
  },
  onReachBottom () {
    const _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getShopList(_this.data.pageNo + 1)
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
  onShareAppMessage (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      // console.log(res.target)
    }
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/reduce/reduce?shareStoreId=' + app.getStoreId() + (_empId ? ('&shareEmpId=' + _empId) : '') + '&activityId=' + _data.activityId
    return {
      title: _data.elActivityVo.miniTitle,
      path: _url,
      imageUrl: _data.elActivityVo.miniTsharePic,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
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