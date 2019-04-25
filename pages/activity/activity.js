const utils = require('../../utils/util.js')
let app = getApp()
Page({
  data: {
    hasNextPage: false,
    pageNo: 1, //当前的页面数
    shopList: [], //当前店铺的活动广场列表
    elActivityVo: [], //倒计时的数组列表
    isLastPage: false, //已经完全加载完毕的变量，默认为false
    isshowEmpty: false, //活动广场数组为null的变量，默认为false
    timeInterval: ''
  },
  onLoad(opt) {
    let _this = this
    _this.setData({
      currentDate: opt.currentDate || '2018-12-22'
    })
    let title = _this.data.currentDate.split('-')[1] + '月' + _this.data.currentDate.split('-')[2] + '日上新活动'
    wx.setNavigationBarTitle({
      title: title
    })
    app.checkUserId(_this.initData)
  },
  //初始化数据
  initData: function() {
    this.getShopList()
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
        data[i].countSeconds--
          data[i].countHtml = timeStr
      } else {
        //clearInterval(_this.data.timeInterval)
        _this.data.timeInterval = null
        data[i].isCountDownEnd = true
      }
    }
    _this.setData({
      elActivityVo: data
    })
  },
  //获取活动列表
  getShopList: function(pageNo) {
    let _this = this
    _this.data.pageNo = pageNo || 1
    let _global = app.globalData
    let params = {
      shopId: _global.shopId,
      pageNumber: pageNo || 1,
      storeId: _global.storeId,
      pageSize: 5,
      runStatus: '',
      searchBeginTime: _this.data.currentDate +' 00:00:00',
      searchEndTime: _this.data.currentDate +' 23:59:59'
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/activity/listByCreateDate/' + params.shopId + '/' + params.storeId + '/' + params.pageNumber, params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.shopListRender(res)
      }
    }).catch(error => {
      utils.globalShowTip(false)
    })
  },
  //活动列表渲染
  shopListRender(res) {
    let _this = this
    if (res && res.result) {
      let _rst = res.result
      let result = _rst.result
      let elActivityVo = []
      for (let i = 0, l = result.length; i < l; i++) {
        let theCount = {}
        let countSeconds = result[i].countDownSeconds
        let runStatus = result[i].runStatus
        if (countSeconds == 0) {
          theCount.isCountDownEnd == true
        }
        theCount.countSeconds = countSeconds
        theCount.runStatus = runStatus
        elActivityVo.push(theCount)
      }
      _this.setData({
        hasNextPage: _rst.hasNextPage,
        pageNumber: _rst.pageNumber,
        elActivityVo: _this.data.elActivityVo.concat(elActivityVo),
        activeCount: _rst.totalCount || 0
      })
      if (_this.data.pageNumber === 1) {
        _this.setData({
          shopList: result
        })
      } else {
        _this.setData({
          shopList: _this.data.shopList.concat(result)
        })
      }
      console.log(this.data.shopList)
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
  onReachBottom: function() {
    const _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getShopList(_this.data.pageNo + 1)
    }
  },
  gotoAct(evt) { //跳转到相应的活动详情页面
    let _dts = evt.currentTarget.dataset
    let atype = parseInt(_dts.atype)
    let aid = _dts.aid
    let _url = ''
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
    if (_url && _url !== '') {
      wx.navigateTo({
        url: `${_url}?activityId=${aid}&activityType=${atype}`,
      })
    }
  },
})