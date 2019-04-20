const utils = require('../../../utils/util.js')
let app = getApp()
Component({
  properties: {//组件属性
    shopId:{
      type:String,
      value:''
    },
    headTop:{
      type: Number,
      value:12
    }
  },
  data: {// 初始化数据
    themeObj:[],
    aa:'',
    shopId:''
  },
  created: function () {
    let _that = this
    console.log(_that)
    app.checkUnionId(_that.initData)
    console.log('==========created==========');  
    let ss = setInterval(function(){
      if (app.globalData.shopId){
        _that.getTheme22()
        clearInterval(ss)
      }
    },1000)
  },
  ready: function () {
    console.log(app.globalData)
    console.log(this.properties.shopId)
    //this.getTheme22()
    //this.setData.themeObjHeard = this.properties.paramAtoB;
    if(this.properties.headTop === 1){
      this.setData({
        aa: '/emallMiniApp/home/headTheme/' 
      })
    }else {
      this.setData({
        aa: '/emallMiniApp/home/footerTheme/'
      })

    }
    
  },
  methods: {// 组件方法
    initData() {
      console.log("1")
    },
    getTheme22() {
      let _that = this
      if(!app.globalData.shopId){
        app.checkUnionId(_that.initData)
      }
      console.log(_that)
      let params = {
        shopId: app.globalData.shopId,
        storeId: app.globalData.storeId,
      }
      console.log(_that.data.aa)
      let data = {}
      //正常进首页 GET /home/headTheme/{shopId}/{storeId
      utils.$http(app.globalData.baseUrl + _that.data.aa + params.shopId + '/' + params.storeId, data).then(res => {
        if (res) {
          utils.globalShowTip(false)
          _that.themeRender(res)
        }
      }).catch(error => {

      })
    },
    themeRender(res) {
      console.log("1111")
      let _this = this
      let result = res.result
      if (result) {
        let _cnt = result.customTheme || []
        let appletName = app.globalData.appletName
        let cstName = result.customName
        if (getCurrentPages()[0].route.toString().indexOf('pages/home/home') > -1) {
          wx.setNavigationBarTitle({
            title: cstName || appletName || ''
          })
        }
        let _prm = {}
        // 获取富文本主题 给富文本图片添加样式
        _cnt.map(item => {
          const _idx = parseInt(item.style)
          if (_idx === 7) {
            if (item.theme.richText) {
              item.theme.richText = item.theme.richText.toString().replace(/\<img/gi, '<img class="rich-img" ')
            }
          } else if (_idx === 4) {
            _prm['prm' + item.sort] = new Promise((resolve, reject) => {
              _this.getShopList(1, item, resolve, reject)
            })
          }
        })
        _this.asyncFun(_prm, _cnt)
      }
    },
    //异步处理商品
    asyncFun(_prm, _cnt) {
      let _this = this
      let _arr = []
      for (const key in _prm) {
        _arr.push(_prm[key])
      }
      if (_arr.length) {
        Promise.all(...([_arr])).then((res) => {
          utils.globalShowTip(false)
          _this.setData({
            themeObj: _cnt,
            isRequest: true
          })
        }).catch((error) => {
          utils.globalShowTip(false)
        })
      } else {
        _this.setData({
          themeObj: _cnt
        })
      }
    }, 
    // 获取商品列表
    getShopList(pageNumber, shopTheme, resolve, reject) {
      let _this = this
      _this.setData({
        pageNumber: pageNumber || 1,
        isRequest: false
      })
      let params = {
        shopId: shopTheme.theme.shopId || app.globalData.shopId,
        storeId: shopTheme.theme.storeId || app.globalData.storeId,
        themeId: shopTheme.theme.themeId,
        sortType: shopTheme.theme.goodSort,
        pageNumber: pageNumber || _this.data.pageNumber
      }
      let data = {
        pageSize: 10
      }
      utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/proListForIndex/' + params.shopId + '/' + params.storeId + '/' + params.themeId + '/' + params.sortType + '/' + params.pageNumber, data).then(res => {
        if (res) {
          if (res && res.result) {
            let _rst = res.result
            let _rarr = _rst.result || []
            let hasNextPage = 'hasNextPage' + shopTheme.sort
            _this.setData({
              [hasNextPage]: _rst.hasNextPage,
              pageNumber: _rst.pageNumber,
            })
            if (_this.data.pageNumber === 1) {
              shopTheme['shopList'] = _rarr
            } else {
              shopTheme['shopList'] = shopTheme['shopList'].concat(_rarr)
            }
            resolve(_rarr)
          } else {
            resolve([])
          }
        }
      }).catch(error => {
        //utils.globalShowTip(false)
      })
    },
    //监听屏幕滚动 判断上下滚动
    onPageScroll(ev) {
      let _this = this
      let {
        showTop,
        headTop,
        fixedTop,
        currentDis,
        lastDis,
        scrollTop
      } = _this.data
      let wHeight = wx.getSystemInfoSync().windowHeight
      //当滚动的top值最大或最小时，为什么要做这一步是因为在手机实测小程序的时候会发生滚动条回弹，所以为了处理回弹，设置默认最大最小值
      if (ev.scrollTop <= 0) {
        ev.scrollTop = 0
      } else if (ev.scrollTop > wHeight) {
        ev.scrollTop = wHeight
      }
      //判断浏览器滚动条上下滚动
      if (ev.scrollTop > scrollTop || ev.scrollTop === wHeight) {
        //向下滚动
        lastDis = currentDis
        currentDis = currentDis + ev.scrollTop
        _this.setData({
          lastDis: lastDis,
          currentDis: currentDis
        })
        headTop = 0
        showTop = false
        if (currentDis - lastDis >= 350) {
          let pageNumber = _this.data.pageNumber + 1
          let _cnt = _this.data.themeObj
          if (!_this.data.isRequest) {
            return false
          }
          _cnt.forEach(item => {
            let hasNextPage = 'hasNextPage' + item.sort
            if (_this.data[hasNextPage]) {
              let _prm = {}
              const _idx = parseInt(item.style)
              if (_idx === 4) {
                _prm['prm' + item.sort] = new Promise((resolve, reject) => {
                  _this.getShopList(pageNumber, item, resolve, reject)
                })
              }
              _this.asyncFun(_prm, _cnt)
            }
          })
        }
      } else {
        if (scrollTop < fixedTop) {
          headTop = fixedTop
          showTop = true
        }
      }
      //给scrollTop重新赋值
      setTimeout(function () {
        _this.setData({
          scrollTop: ev.scrollTop,
          headTop: headTop,
          showTop: showTop
        })
      }, 0)
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
      let _this = this
      let _shopId = _this.data.shopId || app.globalData.shopId
      let _storeId = _this.data.storeId || app.globalData.storeId
      let _templateId = _this.data.templateId || ''
      let _url = '/pages/home/home?shopId=' + _shopId + '&storeId=' + _storeId + '&templateId=' + _templateId
      return {
        title: app.globalData.shareTit,
        path: _url,
        imageUrl: app.globalData.imgUrl,
        success: function (res) {
          // 转发成功
        },
        fail: function (res) {
          // 转发失败
        }
      }
    },
    imageLoad(e) {
      let $width = e.detail.width, //获取图片真实宽度
        $height = e.detail.height,
        ratio = $width / $height //图片的真实宽高比例
      let viewHeight = 750 / ratio //计算的高度值
      var imgheights = this.data.imgheights
      imgheights[e.target.dataset.index] = viewHeight
      this.setData({
        "imgheights": imgheights
      })
    },
    swiperWebsite(e) {
      this.setData({
        currentSwiper: e.detail.current
      })
    },
    // 进入主题下的二级页面
    toLink(e) {
      let dataset = e.currentTarget.dataset
      let contentType = parseInt(dataset.type)
      let templateId = dataset.tid
      let hyperLink = dataset.link
      if (contentType === 0) {
        //配置链接为商品列表 跳到商品列表页面
        app.globalData.themeId = dataset.tid
        this.getList(dataset.tid)
      } else if (contentType === 4) {
        //活动
        wx.reLaunch({
          url: hyperLink,
        })
      } else if (contentType === 5) {
        //小程序页面
        wx.navigateTo({
          url: hyperLink,
        })
      } else if (contentType === 6) {
        let URI = encodeURIComponent(hyperLink)
        //公众号链接
        wx.navigateTo({
          url: '/pages/public/public?link=' + URI,
        })
      } else if (contentType === 7) {
        //跳转小程序
        let homeStr = hyperLink.indexOf("home") != -1
        if (homeStr) {
          let hyperLink2 = hyperLink.replace(/home/g, 'home2')
          wx.navigateTo({
            url: hyperLink2,
          })
        } else {
          wx.navigateTo({
            url: hyperLink,
          })
        }
      } else {
        //富文本、超链接、无
        return false
      }
    },
    toDetail(opt) {
      let atype = opt.currentTarget.dataset.type
      let goodsId = opt.currentTarget.dataset.gid
      let activivtyId = opt.currentTarget.dataset.aid
      let shopId = opt.currentTarget.dataset.sid
      let storeId = opt.currentTarget.dataset.stid
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
    //临时聊天查询未读消息数量 - 以及保存顾问信息
    unReadMsgCount() {
      let _this = this
      let _global = app.globalData
      let _url = `${_global.lkBaseUrl}/el-imfans-linke-api/miniChat/unReadMsgCount`
      let params = {
        hyId: _global.hyUserId,
        empId: _global.empId || '',
        shopId: _global.shopId,
        storeId: _global.storeId,
        flag: 2,
        isNeedEmpInfo: 2
      }
      utils.$http(_url, params, 'POST').then(res => {
        let _rst = res.result
        if (_rst) {
          let empId = _rst.empId
          _global.empId = empId || ''
          _global.empName = _rst.empName
          _this.setData({
            empObj: _rst
          })
        }
        utils.globalShowTip(false)
      }).catch(res => { })
    },
    toChat() {
      let _this = this
      let phone = _this.data.empObj.storePhone
      let name = _this.data.empObj.empName
      if (phone) {
        wx.showModal({
          title: '门店电话',
          content: 'phone',
          showCancel: false,
          success: function (res) {
            if (res.confirm) { }
          }
        })
        return
      }
      wx.navigateTo({
        url: '/pages/chat/chat?name=' + name
      })
    },
    searchCustomer(e) {
      let _this = this
      let _global = app.globalData
      let goodsName = e.detail.value
      _global.goodsName = goodsName
      _this.setData({
        value: ''
      })
      wx.switchTab({
        url: '/pages/commonshop/shopList/shopList'
      })
    },
    goTop: function (e) {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      })
    },
    // 获取主题下面商品列表的数量
    getList: function (themeId) {
      let _this = this
      let _global = app.globalData
      //？携带参数
      let _params = {
        themeId: themeId
      }
      utils.$http(_global.baseUrl + '/emallMiniApp/goods/list/' + _global.shopId + '/' + _global.storeId + '/0/2/1', _params, 'POST').then(res => {
        if (res) {
          if (res.result.result.length == 1) {
            let goodsDetail = res.result.result[0]
            let atype = goodsDetail.type
            let activivtyId = goodsDetail.activityId
            let goodsId = goodsDetail.id
            let storeId = goodsDetail.storeId
            let shopId = goodsDetail.shopId
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
          } else {
            wx.switchTab({
              url: '/pages/commonshop/shopList/shopList'
            })
          }
        }
      }).catch(e => { })
    }
  }
})
