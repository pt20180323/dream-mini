const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    pageNo: 1, //当前的页面数
    shopList: [], //当前店铺的活动广场列表
    elActivityVo: [], //倒计时的数组列表
    isLastPage: false, //已经完全加载完毕的变量，默认为false
    isshowEmpty: false, //活动广场数组为null的变量，默认为false
    navTab: 2,
    navList: [{
      txt: '今日疯抢',
      idx: 2
    }, {
      txt: '活动预告',
      className: 'foreshow',
      idx: 1
    }],
    timeInterval: '',
    loading: false,
    noMsg: '暂无商品',
    isFirst: true,
    tabLoad: false
  },
  onLoad(opt) {
    let _this = this
    app.checkUserId(this.initData)
    setTimeout(function() {
      _this.data.tabLoad = true
    }, 1000)
  },
  onTabItemTap(item) {
    if (this.data.tabLoad) {
      wx.showNavigationBarLoading()
      this.setData({
        isFirst: false,
        pageNo: 1,
        loading: true
      }, () => {
        app.checkUserId(this.initData)
      })
      setTimeout(function() {
        wx.hideNavigationBarLoading()
      }, 1000)
    }
  },
  onHide() {
    let {
      behaviorId
    } = this.data
    if (behaviorId) {
      app.reanderZjLeave(0, behaviorId)
    }
  },
  getQueryVariable(variable) {
    let query = app.globalData.shareParams.split('?')[1]
    let vars = query.split("&")
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=")
      if (pair[0] == variable) {
        return pair[1]
      }
    }
    return
  },
  //切换tab的操作
  changeTab(evt) {
    let dts = evt.currentTarget.dataset
    this.setData({
      navTab: parseInt(dts.type),
      shopList: [],
      elActivityVo: []
    })
    clearInterval(this.data.timeInterval)
    this.getShopList(1)
  },
  //初始化数据
  initData() {
    this.getShopList()
    if (this.data.isFirst) {
      app.reanderZj(0).then(res => {
        this.setData({
          behaviorId: res
        })
      })
    }
  },
  //倒计时
  countDown() {
    let _this = this
    let data = _this.data.elActivityVo
    for (let i = 0, l = data.length; i < l; i++) {
      let intDiff = data[i].countSeconds
      if (intDiff > 0) {
        let day = Math.floor(intDiff / (24 * 60 * 60))
        let rewriteD = day < 10 ? ('0' + day) : day
        let hour = Math.floor(intDiff / (60 * 60)) % 24
        let rewriteH = hour < 10 ? ('0' + hour) : hour
        let minute = Math.floor((intDiff % 3600) / 60)
        let rewriteM = minute < 10 ? ('0' + minute) : minute
        let second = Math.floor(intDiff % 60)
        let rewriteS = second < 10 ? ('0' + second) : second;
        let timeStr = '<span class="shape">' + rewriteD + '</span><em class="st_txt">天</em><span class="shape">' + rewriteH + '</span><em class="st_txt">:</em><span class="shape">' + rewriteM + '</span><em class="st_txt">:</em><span class="shape">' + rewriteS + '</span>'
        data[i].countSeconds--;
        data[i].countHtml = timeStr
      } else {
        clearInterval(_this.data.timeInterval)
        _this.data.timeInterval = null
        data[i].isCountDownEnd = true;
      }
    }
    _this.setData({
      elActivityVo: data
    })
  },
  //获取活动列表
  getShopList(pageNo) {
    let _this = this
    _this.data.pageNo = pageNo || 1
    let params = {
      shopId: app.globalData.shopId,
      pageNumber: pageNo || 1,
      storeId: app.globalData.storeId,
      runStatus: _this.data.navTab,
      pageSize: 5
    }
    if (app.globalData.shareParams) {
      let shareEmpId = _this.getQueryVariable('shareEmpId')
      let shareStoreId = _this.getQueryVariable('shareStoreId')
      if (_this.getQueryVariable('activityId')) {
        let activityId = _this.getQueryVariable('activityId')
        params.activityId = activityId
      }
      params.shareEmpId = shareEmpId
      params.shareStoreId = shareStoreId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/activity/list/' + params.shopId + '/' + params.storeId + '/' + params.runStatus + '/' + params.pageNumber, params, '', _this.data.loading).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          loading: false
        })
        app.globalData.shareParams = ''
        _this.shopListRender(res)
      }
    }).catch(error => {})
  },
  gotoAct(evt) { //跳转到相应的活动详情页面
    let _dts = evt.currentTarget.dataset
    let atype = parseInt(_dts.atype)
    let aid = _dts.aid
    let _url
    //活动类型:1=点赞2=踩价格3=投票4=许愿众筹5=送礼7=秒杀8=预售9=满立减10=优惠套餐11=限时特价12=抱团购13=代金券
    if (atype === 7) {
      _url = '/pages/secondshop/index/index'
    } else if (atype === 9) {
      _url = '/pages/reduce/reduce'
    } else if (atype === 11) {
      _url = '/pages/limitbuy/limitbuy'
    } else if (atype === 12) {
      _url = '/pages/teamshop/index/index'
    } else if (atype === 13) {
      _url = '/pages/limitcard/limitcard'
    }
    if (_url) {
      wx.navigateTo({
        url: `${_url}?activityId=${aid}&activityType=${atype}`,
      })
    }
  },
  //活动列表渲染
  shopListRender(res) {
    let _this = this
    if (res && res.result) {
      let _rst = res.result
      let _list = _rst.result
      let elActivityVo = []
      for (let i = 0, l = _list.length; i < l; i++) {
        let theCount = {};
        let countSeconds = _list[i].countDownSeconds
        if (countSeconds == 0) {
          theCount.isCountDownEnd == true
        }
        theCount.countSeconds = countSeconds
        elActivityVo.push(theCount)
      }
      _this.setData({
        isLastPage: !_rst.hasNextPage,
        pageNumber: _rst.pageNumber,
        elActivityVo: _this.data.elActivityVo.concat(elActivityVo)
      })
      if (_this.data.pageNumber === 1) {
        _this.setData({
          shopList: _list
        })
      } else {
        _this.setData({
          shopList: _this.data.shopList.concat(_list)
        })
      }
      _this.countDown()
      if (_this.data.timeInterval) {
        clearInterval(_this.data.timeInterval)
      }
      _this.data.timeInterval = setInterval(_this.countDown, 1000)
      if (!_this.data.shopList.length) {
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
    app.saveFormId(formId)
  },
  onReachBottom() {
    if (!this.data.isLastPage) {
      this.setData({
        loading: 1
      }, () => {
        this.getShopList(this.data.pageNo + 1)
      })
    }
  },
  onShareAppMessage(res) {
    let _empId = app.getEmpId()
    let {
      shareTit,
      imgUrl
    } = app.globalData
    let _url = '/pages/index/index?shareStoreId=' + app.getStoreId() + (_empId ? ('&shareEmpId=' + _empId) : '')
    return {
      title: shareTit,
      path: _url,
      imageUrl: imgUrl,
      success: function(res) {}
    }
  }
})