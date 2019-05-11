const utils = require('../../../utils/util.js')
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js')
import Poster from '../../component/wxa-plugin-canvas/poster/poster'
let app = getApp()
let qqmapsdk = null
Page({
  data: {
    pictxt:"",
    articleId:"",//文章ID
    articleDetail: {}, //文章详情信息
    picLinkList: [], //图片列表
    commentList:[],//评论列表
    homeValue: 1,
    DefAddress: '暂无默认地址',
    AddressAddId: null,
    shopNum: 1, //商品数量
    optionList: [], //商品属性list
    attrLinkList: [], //SKUID列表
    goodsDetail: {}, //商品详情信息
    yhTxt: '', //商品优惠
    seckillGood: {}, // 秒杀信息
    showSku: {},
    freight: '', //运费
    slideUp: false,
    storeSlideUp: false,
    shareSlideUp: false, //分享弹窗
    posterSlideUp: false, //生成海报保存到相册弹框
    interval: null,
    countHtml: '',
    priceHtml: '',
    cacheSkuId: '',
    richTxt: '',
    skuList: [],
    limitNum: '', // 限购数
    behaviorId: '', //浏览足迹id
    flag: false, //判断该商品是否在分享以后参加了活动
    isShowImg: true, //是否显示图片数量
    hasGoodsVideo: false,  //是否显示商品视频
    hasDetailVideo: false,
    videoObj: {},
    sidx: 1,
    isExit: false,
    detailPlay: false,
    pauseVideo: false,
    isShow:true,
    showCar:true,
    memberFlag: null,
    lat: null, // 经纬度
    lng: null, // 经纬度
    supplierSkuId: null,
    warningData: null, // 可售区域
    isSupportNoReasonReturn: false, // 是否支持无理由退货
    IsPromotion: false, // 促销弹出框是否打开
    IsWarning: false, // 是否提示用户完善乡镇信息
    skuGiftList: null, // 赠品列表
    perfectaddr: false // 判断是否需要完善地址
  },
  onLoad(opt) {
    qqmapsdk = new QQMapWX({
      key: 'AGFBZ-A5OR4-PD3UF-DJTZ2-GTUI7-6GBV2'
    })
    let {
      isIpx,
      userId
    } = app.globalData
    console.info("userId------------->"+userId);
    if (opt) {
      this.setData({
        type: opt.type || '',
        articleId: opt.articleId || '',
        userId: userId
      })
    }
    console.info("请求参数,articleId:" + opt.articleId)
    this.setData({
      isIpx: isIpx
    })
    // 获取文章详情信息
    getArticleDetail();
    // 获取评论信息
    getComment();
  },
  // 获取文章详情信息
  getArticleDetail() {
    let {
      articleId
    } = this.data
    let {      
      baseUrl
    } = app.globalData
    console.info("文章ID:" + articleId);
    utils.$http(baseUrl + '/article/detail/' + articleId, {},'POST').then(res => {
      if (res) {
        console.info("文章详情:" + JSON.stringify(res))
       
        utils.globalShowTip(false)
        this.setData({
          articleDetail: res.result,
          pictxt: res.result.richContent.replace(/<img[ \s]/g, '<img class="maxImg" '), 
          isRequest: true,
          loading: false
        })
        
        let picLinkList_ = this.data.articleDetail.dreamArticelPictureVideoLinkRespVos;
        if (picLinkList_ && picLinkList_.length>0) {
          this.setData({
            picLinkList: picLinkList_,
            isShowImg:true,
            isShow:true
          })
        }
        
      }
    }).catch(e => {
      utils.globalShowTip(false)
    })
  },
  refreshComment(){//重新刷新评论信息
    this.getComment(1);
  },
  // 获取评论信息
  getComment(pageNo) {
    let _this = this
    let _data = _this.data
    _this.setData({
      pageNo: pageNo || 1,
      isRequest: false
    })
    let {
      articleId
    } = this.data
    let {
      baseUrl
    } = app.globalData
    //携带参数
    let _params = {
      pageNo: pageNo || 1,
      articleNewsId: articleId
    }
    utils.$http(baseUrl + '/comment/list', _params, 'POST', _data.loading).then(res => {

      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          isLastPage: !res.result.hasNextPage,
          isRequest: true,
          loading: false
        })

        if (_data.pageNo === 1) {
          _this.setData({
            commentList: res.result.items
          })
        } else {
          _this.setData({
            commentList: _data.commentList.concat(res.result.items)
          })
        }
        console.info("评论信息记录数:" + articleList.length)
        if (!_data.commentList.length) {
          _this.setData({
            isshowEmpty: true
          })
        } else {
          _this.setData({
            isshowEmpty: false
          })
        }
      }
    }).catch(e => {
      utils.globalShowTip(false)
    })
  },
  // 发布评论信息
  publishComment() {
    let _this = this
    let _data = _this.data
  
    let {
      articleId,
      commentContent
    } = _this.data
    let {
      baseUrl
    } = app.globalData
    if (!commentContent){
      wx.showToast({
        title: '请写入评论',
        icon: 'success',
        duration: 1000
      })
      return false;
    }
    //携带参数
    let _params = {
      articleNewsId: articleId,
      commentContent:commentContent
    }
    utils.$http(baseUrl + '/comment/publish', _params, 'POST', _data.loading).then(res => {

      if (res) {
        let statusCode = res.code;
        utils.globalShowTip(false)
        _this.setData({
          isRequest: true,
          loading: false
        })
        if (statusCode==0){
          var commentList_ = res.result;
          if (commentList_.length>0){
            _this.setData({
              commentList: _data.commentList.concat(commentList_)
            })
            console.info("评论信息记录数:" + _data.commentList.length)
            wx.showToast({
              title: '发表成功',
              icon: 'success',
              duration: 1000
            })
            this.setData({
              slideUp: false,
              isShow: true,
              showCar: true
            })
            if (!_data.commentList.length) {
              _this.setData({
                isshowEmpty: true
              })
            } else {
              _this.setData({
                isshowEmpty: false
              })
            }
          }else{
            this.getComment(1);
          }
        } else {
          wx.showToast({
            title: '评论失败',
            icon: 'success',
            duration: 1000
          })
        }
      }
    }).catch(e => {
      utils.globalShowTip(false)
    })
  },
  commentContentInput(evt){//评论留言
    let temp = evt.detail.value;
    console.info("commentContent:" + temp);
    this.setData({
      commentContent: evt.detail.value
    })
  },
  delComment(evt){//删除评论
    let that = this;
    let index = evt.target.dataset.index;
    let commentId = evt.target.dataset.commentid;
    let commentArrayLength = that.data.commentList.length;
    let newCommentList=[];
    if (commentArrayLength>1){
      for (let i = 0; i < commentArrayLength;i++){
        if (i != index){
          newCommentList.push(that.data.commentList[i]);
        }
      }
      that.setData({
        commentList: newCommentList
      })
      let {
        baseUrl
      } = app.globalData;

      let url = `${baseUrl}/comment/del/${commentId}`
      utils.$http(url, {}).then(res => {
        if (res) {
          let code = res.code;
          if (code==0){
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 500
            })
          }
        }
      }).catch((res) => { })
      
    }

  },
  commentUp(evt) {//点赞||取消点赞
    let _this = this
    let _data = _this.data
    let upid = evt.currentTarget.dataset.upid;
    let upstatus = evt.currentTarget.dataset.upstatus;
    let index = evt.currentTarget.dataset.index;
    let commentId = evt.currentTarget.dataset.commentid;
    let upOrCancel=0;
    if (upid && upstatus==0){
      console.info("取消点赞")
      upOrCancel=1
    }else{
      console.info("点赞") 
    }
    //携带参数
    let _params = {
      upId: upid,
      upOrCancel: upOrCancel
    }   
    let {
      baseUrl
    } = app.globalData;   

    let url = `${baseUrl}/comment/commentUp/${commentId}`
    utils.$http(url, _params, "POST", _data.loading).then(res => {
      utils.globalShowTip(false)
      _this.setData({
        isRequest: true,
        loading: false
      })
      if (res) {
        let code = res.code;
        if (code == 0) {
          let result = res.result;
          let commentUpNum = "commentList["+index+"].commentUpNum";
          let upId = "commentList[" + index + "].upId";
          let upStatus = "commentList[" + index + "].upStatus";
          _this.setData({
            [commentUpNum] :result.commentUpNum,
            [upId]:result.upId,
            [upStatus]: result.upStatus
          })
        }
      }
    }).catch((res) => { })
  },
  // 促销弹出框打开
  Promotion () {
    this.setData({
      IsPromotion: true
    })
  },
  // 促销弹出框关闭
  NoPromotion() {
    this.setData({
      IsPromotion: false
    })
  },
  // 检查 是否支持退货、是否可售、是否有促销商品
  Judge() {
   
  },
  // 判断商品是否支持退货
  isSupportNoReasonReturn() {
   
  },
  // 获取促销商品
  getSkuGift() {
    
  },
  // 检查供应链商品是否可售
  checkSupSkuEnableSale() {
    
  },
  // 获取用户当前位置
  getLocation () {
    
  },
  toImg: function() {
    this.setData({
      isShowImg: true,
      currIndex: 1
    })
  },
  toVideo: function() {
    this.setData({
      isShowImg: false,
      currIndex: 0
    })
  },
  toPage: function(e) {
    let {
      type
    } = e.currentTarget.dataset
    if (parseInt(type) == 1) {
      wx.switchTab({
        url: '/pages/home/home',
      })
    } else {
      wx.switchTab({
        url: '/pages/shopcart/shopcart',
      })
    }
  },
  onReady: function() {
    this.videoContext = wx.createVideoContext('myDetailVideo')
  },
  detailPlay: function() {
    let _this = this
    _this.setData({
      detailPlay: true
    })
    setTimeout(() => {
      _this.videoContext.play()
    }, 500)
  },
  onShow() {
      this.setData({
          slideUp: false,
          showSku: {},
          isShow:true
      })
    app.checkUserId(this.initData)
  },
  onHide() {
    let {
      flag,
      behaviorId,
      goodsId
    } = this.data
    if (!flag && behaviorId) {
      this.reanderZjLeave(goodsId)
    }
  },
  initData() {      
    this.getEnvironment()
    this.getArticleDetail()
    this.getComment();
  },
  checkShopActivity() { //检查商品是否参与活动
    
  },
  getShopDetail() { //查询商品详情
    let {
      goodsId
    } = this.data
    let {
      shopId,
      storeId,
      baseUrl
    } = app.globalData

    let url = `${baseUrl}/emallMiniApp/goods/detail/${shopId}/${storeId}/${goodsId}`
    utils.$http(url, {}).then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.shopDetRender(res)
      }
    }).catch((res) => {})
  },
  shopDetRender(res) {
    let _this = this
    let _data = _this.data
    if (res && res.result) {
      let _rst = res.result
      let storeFlag = _rst.storeFlag
      let crossEnterprise = _rst.crossEnterprise
      if (!storeFlag && storeFlag === 0) {
        wx.showModal({
          title: '温馨提示',
          content: '所属门店找不到该商品信息',
          showCancel: false,
          success() {
            wx.switchTab({
              url: '/pages/home/home',
            })
          }
        })
        return
      } else if (!crossEnterprise && crossEnterprise === 0) {
        wx.showModal({
          title: '温馨提示',
          content: '所属门店找不到该商品信息',
          showCancel: false,
          success() {
            wx.switchTab({
              url: '/pages/home/home',
            })
          }
        })
        return
      }
      let gid = _rst.id || _data.goodsId //商品ID
      _this.setData({
        goodsId: gid,
        goodsDetail: _rst || {},
        supplierSkuId: res.result.supplierSkuId
      })
      if (res.result.supplierSkuId) {
        // 获取促销商品
        _this.getSkuGift()
      }
      // 检查
      _this.Judge()
      _this.getGoodsVideo(_rst)
      if (parseInt(_rst.activityType) === 11) { //限时特价显示倒计时
        if (_data.interval) {
          clearInterval(_data.interval)
          _data.interval = null
        }
        _this.countDown(--_data.goodsDetail.countDownSeconds)
        _data.interval = setInterval(() => {
          if (_data.goodsDetail.countDownSeconds >= 0) {
            _this.countDown(--_data.goodsDetail.countDownSeconds)
          }
        }, 1000)
      }
      let {
        shopId,
        storeId,
        buyerId
      } = app.globalData
      let {
        baseId,
        stockFormId,
        attributeType
      } = _rst
      _this.getReduce(gid)
      _this.reanderZj(gid)
      _this.setProductPvuv()
      _this.linecarCount()
      app.unReadMsgCount().then(res => {
        _this.setData({
          empObj: res
        })
      })
      _this.queryGoodsSkuBrokerage({ //查询商品sku店员销售佣金
        shopId: shopId,
        storeId: storeId,
        goodsId: gid,
        stockFormId: stockFormId || '' ,
        attributeType: attributeType || 0
      })
      _this.searchFreight({ //根据baseId查询运费
        shopId: shopId,
        storeId: storeId,
        goodsBaseId: baseId
      })
      _this.searchYouhui({ //查询优惠信息
        shopId: shopId,
        storeId: storeId,
        goodsId: gid,
      })
      _this.getContents({ //查询图文详情
        shopId: shopId,
        storeId: storeId,
        goodsSyncId: _rst.syncId || ''
      })
      _this.getSkuTree({ // 查询sku树
        shopId: shopId,
        storeId: storeId,
        goodsId: gid
      })
      if (_this.data.timeStatus === 'false') {
        _this.getLimitNum({ // 查询限购数
          shopId: shopId,
          goodsId: gid,
          buyerId: buyerId
        })
      }
    }
  },
  getGoodsVideo(rst) {
    let _rst = rst.goodsVideo
    if (_rst) {
      this.setData({
        videoObj: _rst || {},
        hasGoodsVideo: _rst.hasGoodsVideo || false,
        hasDetailVideo: _rst.hasDetailVideo || false,
        isShowImg: _rst.hasGoodsVideo ? false : true
      })
    }
  },
  getReduce(goodsId) { //查询满减信息
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    let _url = `${baseUrl}/emallMiniApp/fulReduce/findGoodsFulReduceRes/${shopId}/${storeId}/${goodsId}`
    utils.$http(_url, {}, '', 1).then(res => {
      let _rst = res.result
      if (_rst) {
        this.setData({
          reduceTxt: _rst
        })
      }
    }).catch((res) => {})
  },
  linecarCount() { //查询购物车数量
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    let _url = `${baseUrl}/emallMiniApp/linecar/count/${shopId}/${storeId}`
    utils.$http(_url, {}, '', 1).then(res => {
      let _rst = res.result
      if (_rst) {
        const num = parseInt(_rst.carSize)
        this.setData({
          sc_num: num
        })
      }
    }).catch((res) => {})
  },
  reanderZj(goodsId) { //用户浏览足迹 - 用户进入
    let {
      baseUrl,
      businessModel,
      storeId,
      shopId,
      shareEmpId
    } = app.globalData
    /*if (businessModel && this.data.storeId !== storeId) {
      return
    }*/
    let params = {
      shopId: shopId,
      storeId: storeId,
      goodsId: goodsId,
      empId: shareEmpId || ''
    }
    utils.$http(baseUrl + '/emallMiniApp/behavior/goods/detail/entry/' + shopId + '/' + storeId + '/' + goodsId, params, 'POST', 1).then(res => {
      if (res) {
        this.setData({
          behaviorId: res.result
        })
      }
    }).catch((res) => {})
  },
  reanderZjLeave(goodsId) { //用户浏览足迹 - 用户离开
    let {
      baseUrl,
      shopId,
      storeId,
      shareEmpId
    } = app.globalData
    let params = {
      shopId: shopId,
      storeId: storeId,
      goodsId: goodsId,
      behaviorId: this.data.behaviorId,
      empId: shareEmpId || ''
    }
    utils.$http(baseUrl + '/emallMiniApp/behavior/goods/detail/leave/' + shopId + '/' + storeId + '/' + goodsId + '/' + params.behaviorId, params, 'POST', 1).then(res => {}).catch((res) => {})
  },
  getEnvironment() { //处理电商用户从企业微信中进入电商不允许下单
    let _this = this
    let {
      environment
    } = app.globalData
    if (!environment){
      environment = _this.data.clerkShare
    }
    if (environment) {
      this.setData({
        environment: environment
      })
    }
  },
  setProductPvuv() { //保存商品pvuv
    let {
      baseUrl,
      shopId,
      storeId,
      goodsId
    } = app.globalData
    utils.$http(`${baseUrl}/emallMiniApp/commons/setProductPvuv/${shopId}/${storeId}/${this.data.goodsId || goodsId}`, {}, 'POST', 1).then(res => {}).catch((res) => {})
  },
  countDown(num) {
    let _this = this
    _this.data.goodsDetail.countDownSeconds = num
    if (num === 0) {
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
  queryGoodsSkuBrokerage(params) {
    let url = '/emallMiniApp/goods/detail/queryGoodsSkuBrokerage/' + params.shopId + '/' + params.storeId + '/' + params.goodsId
    utils.$http(app.globalData.baseUrl + url, params, '', 1).then(res => {
      if (res) {
        this.setData({
          brokerage: res.result
        })
      }
    }).catch(res => {})
  },
  searchFreight(params) { //查询运费
    let url = '/emallMiniApp/goods/freight/' + params.shopId + '/' + params.storeId + '/' + params.goodsBaseId
    utils.$http(app.globalData.baseUrl + url, {}, '', 1).then(res => {
      if (res) {
        this.setData({
          freight: res.result
        })
      }
    }).catch((res) => {})
  },
  searchYouhui: function(params) {
    let url = `/emallMiniApp/goods/detail/discounts/${params.shopId}/${params.storeId}/${params.goodsId}`
    utils.$http(app.globalData.baseUrl + url, {}, '', 1).then(res => {
      if (res) {
        let arr = res.result
        let arrStr = arr.join(',').replace(/\,/g, ' ')
        this.setData({
          yhTxt: arrStr
        })
      }
    }).catch((res) => {})
  },
  getContents: function(params) {
    let url = '/emallMiniApp/goods/detail/contents/' + params.shopId + '/' + params.storeId + '/' + params.goodsSyncId
    utils.$http(app.globalData.baseUrl + url, {}, '', 1).then(res => {
      if (res) {
        this.setData({
          pictxt: res.result.replace(/<img[ \s]/g, '<img class="maxImg" ')
        })
      }
    }).catch((res) => {})
  },
  getSkuTree(params) {
    let url = '/emallMiniApp/goods/detail/skuTree/' + params.shopId + '/' + params.storeId + '/' + params.goodsId
    utils.$http(app.globalData.baseUrl + url, {}, '', 1).then(res => {
      if (res) {
        this.renderSkuTree(res)
      }
    }).catch((res) => {})
  },
  renderSkuTree(res) {
    let arry = []
    let skuArry = []
    if (res) {
      let _rst = res.result
      for (let item in _rst.skuIdMap) {
        arry.push({
          key: item,
          skuId: _rst.skuIdMap[item]
        })
      }
      for (let item in _rst.skuMap) {
        skuArry.push(_rst.skuMap[item])
      }
      let _price = {
        minSalePriceDouble: _rst.minSalePriceDouble || 0,
        maxSalePriceDouble: _rst.maxSalePriceDouble || 0,
        minMarketPriceDouble: _rst.minMarketPriceDouble || 0,
        maxMarketPriceDouble: _rst.maxMarketPriceDouble || 0,
        minMemberPriceDouble: _rst.minMemberPriceDouble || 0,
        maxMemberPriceDouble: _rst.maxMemberPriceDouble || 0,
      }
      if (_price.maxSalePriceDouble && _price.maxSalePriceDouble === _price.minSalePriceDouble) {
        _price.onlySalePrice = _price.maxSalePriceDouble.toString().split('.')
      } else {
        _price.minSalePrice = _price.minSalePriceDouble ? _price.minSalePriceDouble.toString().split('.') : 0
        _price.maxSalePrice = _price.maxSalePriceDouble ? _price.maxSalePriceDouble.toString().split('.') : 0
      }
      if (_price.maxMemberPriceDouble && _price.maxMemberPriceDouble === _price.minMemberPriceDouble) {
        _price.onlyMemberPrice = _price.maxMemberPriceDouble.toString().split('.')
      } else {
        _price.minMemberPrice = _price.minMemberPriceDouble ? _price.minMemberPriceDouble.toString().split('.') : 0
        _price.maxMemberPriceDouble = _price.maxMemberPriceDouble ? _price.maxMemberPriceDouble.toString().split('.') : 0
      }
      if (_price.maxMarketPriceDouble && _price.maxMarketPriceDouble === _price.minMarketPriceDouble) {
        _price.onlyMarketPrice = _rst.maxMarketPriceDouble
      } else {
        _price.minMarketPrice = _price.minMarketPriceDouble
        _price.maxMarketPrice = _price.maxMarketPriceDouble
      }
      this.setData({
        limitOffersTag: _rst.offersTag || '',
        optionList: _rst.showAttributeList,
        skuList: skuArry,
        attrLinkList: arry,
        goodsPrice: _price
      })
    }
  },
  getLimitNum(params) {
    let url = `/emallMiniApp/goods/buyLimit/${params.shopId}/${params.goodsId}/${params.buyerId}`
    utils.$http(app.globalData.baseUrl + url, {}, '', 1).then(res => {
      if (res) {
        this.setData({
          limitNum: res.result.buyLimit
        })
      }
    }).catch((res) => {})
  },
  selectAttr(evt) {
    let dst = evt.currentTarget.dataset
    let idx = dst.list
    let sidx = dst.sidx
    let _list = this.data.optionList
    let _attrLink = this.data.attrLinkList //返回的skuMap
    if ((_list[idx].cur || sidx == 0) && _list[idx].cur === sidx) {
      _list[idx].cur = ''
      this.eachList(_list)
    } else {
      _list[idx].cur = sidx
    }
    let isAll = false
    _list.forEach((itm) => {
      if (itm.cur !== '') {
        isAll = true
      }
    })
    let _sku = [] //最终选择的属性项
    if (isAll) {
      let _arr = [] //用户选择的对应项的skuId
      //包含已选属性arr
      let attArr = []
      let str = '' //当前选择属性的skuMap
      _list.forEach((itm) => {
        if (itm.cur || itm.cur === 0) {
          _arr.push(itm.attributeOptionList[itm.cur].optionId)
        }
      })
      str = _arr.join('@')
      _sku = _attrLink.filter((item) => {
        return item.key === str
      })
      if (_list.length === (_arr.length + 1) || _list.length === _arr.length) {
        _attrLink.forEach((item, index) => {
          let itemArr = item.key.split('@')
          if (utils.isContained(itemArr, _arr) || utils.minus(itemArr, _arr).length == 1) {
            attArr.push(item.skuId)
          }
        })
        let skuStock = [] //库存为0的属性
        this.data.skuList.forEach((item, index) => {
          if (attArr.indexOf(item.skuId) > -1) {
            if (item.stock === 0) {
              skuStock.push(item.skuId)
            }
          }
        })
        if (skuStock.length) { //拼接数组
          let keyArr = [] //sku拼接对象skuMap对应库存为0的key值
          _attrLink.forEach((item, index) => {
            if (skuStock.indexOf(item.skuId) > -1) {
              keyArr.push(item.key)
            }
          })
          let optionId = []
          keyArr.forEach((item, index) => {
            let skuArr = item.split('@')
            let skuStr = utils.minus(skuArr, _arr)[0]
            optionId.push(skuStr)
          })
          _list.forEach((item, index) => {
            item.attributeOptionList.forEach((sitem, sindex) => {
              if (optionId.indexOf(sitem.optionId) > -1) {
                sitem.stock = true
              } else {
                sitem.stock = false
              }
            })
          })
        } else {
          this.eachList(_list)
        }
      } else {
        this.eachList(_list)
      }
    } else {
      this.eachList(_list)
    }
    let showSkuArry = this.data.skuList.filter(item => {
      if (_sku.length) {
        return item.skuId === _sku[0].skuId
      }
    })
    this.setData({
      optionList: _list,
      showSku: showSkuArry[0] || {}
    })
  },
  //遍历不置灰
  eachList: function(_list) {
    _list.forEach(function(item, index) {
      item.attributeOptionList.forEach(function(sitem, sindex) {
        sitem.stock = false
      })
    })
  },
  gotoOffer(evt) {
    let _this = this
    let _data = _this.data
    let { warningData, IsWarning, perfectaddr } = _data
    if ((warningData && !warningData.result) || IsWarning || perfectaddr) return false
    let optionList = _data.optionList //属性的list
    let dst = evt.currentTarget.dataset
    let utype = parseInt(dst.utype)
    let {
      shopId,
      storeId,
      goodsId
    } = app.globalData
    let params = {
      number: _data.shopNum,
      shopId: shopId,
      storeId: storeId,
      goodsId: _data.goodsId || goodsId
    }
    if ((optionList.length == 0 || (optionList.length == 1 && optionList[0].attributeOptionList.length <= 1)) && utype === 1) {
      _this.addCar(params)
    } else {
      this.setData({
        slideUp: true,
        pauseVideo:false,
        detailPlay: false,
        isShow:false,
        showCar:false
      })
    }
    this.setData({
      utype: utype || 3
    })
  },
  setActivityClick() {
    let _this = this
    let _data = _this.data
    let {
      baseUrl,
      activityId,
      buyerId
    } = app.globalData
    let param = {
      activityId: _data.activityId || activityId,
      buyerId: buyerId
    }
    let url = `${baseUrl}/emallMiniApp/activity/setActivityClick`
    utils.$http(url, param, 'POST', 1).then(res => {}).catch((res) => {})
  },
  gotoOrder(evt) {
    let _this = this
    let _data = _this.data
    let { warningData, perfectaddr } = _data
    if ((warningData && !warningData.result) || perfectaddr) return false
    let _skuId = _data.showSku.skuId ? _data.showSku.skuId : _data.skuList[0].skuId
    let _rem = parseInt(_data.showSku.stock)
    let formId = evt.detail.formId
    let dst = evt.currentTarget.dataset
    if (_this.data.optionList.length) {
      if (!_data.showSku.skuId) {
        wx.showToast({
          title: '请选择商品属性！',
          icon: 'none',
          mask: true,
          duration: 1500
        })
        return
      }
    }
    if (_rem < 1) {
      wx.showToast({
        title: '商品库存不足，请选择其它商品！',
        icon: 'none',
        mask: true,
        duration: 1500
      })
      return
    }
    _this.setData({
      cacheSkuId: _skuId,
      formId: formId
    })
    let utype = _data.utype //1:加入购物车、2:立即购买、3:通过点击属性弹出，二者都有
    let params = {
      number: _this.data.shopNum,
      skuId: _skuId,
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      goodsId: _data.goodsId || app.globalData.goodsId
    }
    if (utype === 2 || (utype === 3 && dst.order)) {
      _this.orderVerify(params)
    } else if (utype === 1 || (utype === 3 && dst.car)) { //加入购物车
      _this.addCar(params)
    }
  },
  addCar(params) { //加入购物车
    let _this = this
    let url = `${app.globalData.baseUrl}/emallMiniApp/linecar/add/${params.shopId}/${params.storeId}/${params.goodsId}/${params.skuId}/${params.number}`
    utils.$http(url, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          slideUp: false,
          detailPlay:false,
          pauseVideo: false,
          showCar:true,
          isShow:true
        })
        wx.showToast({
          title: '添加购物车成功',
          icon: 'success',
          mask: true,
          duration: 1500
        })
        setTimeout(() => {
          _this.linecarCount()
        }, 1500)
      }
    }).catch((res) => {})
  },
  orderVerify(params) {
    let url = `${app.globalData.baseUrl}/emallMiniApp/ordered/verify/${params.shopId}/${params.storeId}/${params.goodsId}/${params.skuId}`
    utils.$http(url, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        this.orderVerifyRender(res)
      }
    }).catch((res) => {})
  },
  orderVerifyRender(res) {
    let _data = this.data
    app.saveFormIdSecond(_data.formId)
    console.log(_data.AddressAddId)
    wx.navigateTo({
      url: '/pages/commonshop/orderInfor/orderInfor?skuId=' + _data.cacheSkuId + '&buyerId=' + app.globalData.buyerId + '&goodsId=' + (_data.goodsId || app.globalData.goodsId) + '&number=' + _data.shopNum + '&storeId=' + (_data.storeId || app.globalData.storeId) + '&addid=' + _data.AddressAddId
    })
  },
  closeSlide() {
    this.setData({
      slideUp: false,
      isShow:true,
      showCar:true
    })
  },
  togNum(evt) {
    let _this = this
    let _data = _this.data
    let dst = evt.target.dataset
    let _type = parseInt(dst.type)
    let _num = _data.shopNum
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.goodsDetail.stock) : _data.goodsDetail.stock
    let limit = _data.limitNum || 0
    if (limit > 0) {
      max = Math.min(max, limit)
    }
    if (_type === 1) {
      _num = _num < max ? ++_num : max
    } else {
      _num = _num <= 1 ? _num : --_num
    }
    _this.setData({
      shopNum: _num
    })
  },
  numChange: function(evt) {
    let _this = this
    let _data = _this.data
    let _v = evt.detail.value
    _this.setData({
      shopNum: _v //Math.max(_v, 1)
    })
  },
  iptBlur: function(evt) {
    let _this = this
    let _data = _this.data
    let _v = parseInt(evt.detail.value || 1)
    let max = _data.showSku.stock ? Math.min(_data.showSku.stock, _data.goodsDetail.stock) : _data.goodsDetail.stock
    let limit = _data.limitNum
    if (limit > 0) {
      max = Math.min(max, limit)
    }
    if (_v > max) {
      _v = max
    }
    _this.setData({
      shopNum: _v
    })
  },
  gotoMyOrder: function() {
    wx.navigateTo({
      url: '/pages/mine/myOrder/myOrder'
    })
  },
  onShareAppMessage: function(res) {
    let _this = this
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/commonshop/productDetail/productDetail?storeId=' + (_data.storeId || app.globalData.storeId) + (_empId ? ('&shareEmpId=' + _empId) : '') + '&goodsId=' + (_data.goodsId || app.globalData.goodsId)
    console.log(_data.goodsDetail)
    return {
      title: _data.goodsDetail.goodsName,
      path: _url,
      imageUrl: _data.goodsDetail.pics[0],
      success: function(res) {
        _this.setData({
          shareSlideUp: false
        })
      },
      fail: function(res) {
        _this.setData({
          shareSlideUp: false
        })
      }
    }
  },
  showCommission: function(opt) {
    let {
      commission
    } = opt.currentTarget.dataset
    if (this.data.goodsDetail.attributeType !== 0) {
      if (commission === 'show') {
        this.setData({
          comBtn: true
        })
      } else {
        this.setData({
          comBtn: false
        })
      }
    }
  },
  toChat(e) {
    let _this = this
    let empObj = _this.data.empObj
    let phone = empObj.storePhone
    if (phone) {
      wx.showModal({
        title: '门店电话',
        content: 'phone',
        showCancel: false,
        success: function(res) {
          if (res.confirm) {}
        }
      })
      return
    }
    let ev = JSON.stringify(e.currentTarget.dataset)
    wx.navigateTo({
      url: '/pages/chat/chat?goodsInfo=' + encodeURIComponent(ev) + '&name=' + empObj.empName,
    })
  },
  //分享生成海报以及分享到微信或企业微信
  toShare() {
    this.setData({
      shareSlideUp: true
    })
  },
  toCancel() {
    this.setData({
      shareSlideUp: false
    })
  },
  toPoster() {
    let _this = this
    let {
      baseUrl,
      shopId,
      sessionKey
    } = app.globalData
    let url = `${baseUrl}/emallMiniApp/goods/getGoodsPoster/${shopId}/${this.data.goodsId}`
    return new Promise(function (resolve, reject) {
      utils.$http(url, {sessionId: sessionKey}).then(res => {
        if (res.result) {
          let result = res.result
          console.log(res)
          let config = {
            width: 750,
            height: 1334,
            preload: true,
            debug: false,
            blocks: [{
              x: 0,
              y: 0,
              width: 750,
              height: 1334,
              backgroundColor: '#fff'
            }],
            texts: [{
              x: 370,
              y: 780,
              text:result.goodsName,
              lineNum:3,
              width: 700,
              fontSize: 32,
              color: '#333',
              zIndex: 100,
              textAlign: "center"
            },{
              x: 370,
              y: 900,
                text: "￥" + result.salePrice,
              fontSize: 48,
              zIndex: 100,
              textAlign: "center",
              color: 'red'
            },
            {
              x: 174,
              y: 1090,
              text:result.storeName,
              lineNum: 1,
              width: 600,
              color: '#666',
              fontSize: 24,
              zIndex: 100
            },
            {
              x: 130,
              y: 1130,
              text:result.shareDes1,
              lineNum: 1,
              width: 1200,
              color: '#666',
              fontSize: 24,
              zIndex: 100
            },
            {
              x: 130,
              y: 1180,
              text: result.shareDes2,
              color: '#666',
              fontSize: 24,
              zIndex: 100
            }
            ],
            images: [{
              width: 700,
              height: 700,
              x: 25,
              y: 25,
              zIndex: 100,
              url: result.goodsPic
            },
            {
              width: 750,
              height: 35,
              x: 0,
              y: 970,
              url: result.dotUrl
            },
            {
              width: 32,
              height: 32,
              x: 130,
              y: 1065,
              url: result.vImgUrl
            },
            {
              width: 80,
              height: 80,
              x: 25,
              y: 1070,
              borderRadius:80,
              url: result.wxPhoto
            },
            {
              width: 140,
              height: 140,
              borderRadius: 140,
              x: 580,
              y: 1050,
              url:result.miniUrl
            }
            ]
          }
          if (result.salesVolume) {
            config.blocks.push({
              x: 25,
              y: 700,
              width: 100,
              height: 40,
              zIndex: 101,
              backgroundColor: '#000',
              text: {
                text: [{
                  text: result.salesVolume,
                  fontSize: 20,
                  color: '#fff',
                  opacity: 1,
                  marginLeft: 10,
                  marginRight: 5,
                }],
                baseLine: 'middle',
              }
            })
          }
          if (result.marketPrice) {
            config.blocks.push({
              x: 320,
              y: 930,
              width: 100,
              height: 1,
              zIndex: 101,
              backgroundColor: '#333'
            })
            config.texts.push({
              x: 370,
              y: 940,
              text: "￥" + result.marketPrice,
              color: '#333',
              fontSize: 28,
              zIndex: 100,
              textAlign: "center"
            })
          }
          _this.setData({
            config: config
          }, () => {
            console.log(_this.data.config)
            Poster.create(true) // 入参：true为抹掉重新生成
          })
          resolve()
        }
      }).catch(err => { })
    })
  },
  onPosterSuccess(e) {
    utils.globalShowTip(false)
    const {
      detail
    } = e
    this.setData({
      posterPath: detail,
      shareSlideUp: false,
      posterSlideUp: true
    })
  },
  saveImg() {
    console.log(this.data.posterPath)
    let {
      posterPath
    } = this.data
    let _this = this
    wx.saveImageToPhotosAlbum({
      filePath: posterPath,
      success: res => {
        wx.showModal({
          title: '',
          content: '图片已经保存到手机相册，“查看图片”后长按图片即可分享',
          cancelText: '关闭',
          confirmText: '查看图片',
          confirmColor: '#2093fc',
          success: res => {
            if (res.confirm) {
              _this.previewImg(_this.data.posterPath)
            }
          }
        })
      }
    })
    return
    wx.downloadFile({
      url: posterPath,
      success: function(res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function(res) {
            wx.showToast({
              title: '保存成功',
              icon: "none"
            })
            _this.setData({
              posterSlideUp: false
            })
          }
        })
      }
    })
  },
  previewImg(url) {
    console.log(url)
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url] // 需要预览的图片http链接列表
    })
  },
  cancelPoster() {
    this.setData({
      posterSlideUp: false
    })
  },
  stopScroll() {
    return
  },
  //点击播放按钮，封面图片隐藏,播放视频
  toPlay(e) {
    this.videoCtx = wx.createVideoContext('myVideo')
    this.videoCtx.play()
    this.setData({
      pauseVideo: true
    })
  },
  //点击播放详情视频
  toPlayDetail(e) {
    this.videoCtx = wx.createVideoContext('myDetailVideo')
    this.videoCtx.play()
    this.setData({
      detailPlay: true
    })
  },
  continuePlay(e) {
    let {
      id
    } = e.currentTarget.dataset
    let myVideo = wx.createVideoContext('myVideo')
    let myDetailVideo = wx.createVideoContext('myDetailVideo')
    if (id === 'myVideo') {
      if (myDetailVideo) {
        myDetailVideo.pause()
      }
      this.setData({
        isExit: true
      })
    }
    if (id === 'myDetailVideo' && myVideo) {
      myVideo.pause()
    }
  },
  swiperChange(e) {
    let {
      current
    } = e.detail
    let {
      isShowImg,
      videoObj
    } = this.data
    let sidx = e.detail.current + 1
    if (videoObj.hasGoodsVideo) {
      if (current == 0) {
        isShowImg = false
      } else {
        isShowImg = true
      }
      sidx = e.detail.current
    }
    this.setData({
      sidx: sidx,
      isShowImg: isShowImg
    })
  },
  goBack() {
    this.videoCtx = wx.createVideoContext('myVideo')
    this.setData({
      pauseVideo: false
    })
    this.videoCtx.pause()
  }
})