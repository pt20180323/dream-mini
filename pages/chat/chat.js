const utils = require('../../utils/util.js')
const app = getApp()
let sockTask
let sockInterval

Page({
  data: {
    list: [],
    animation: {},
    inputValue: "",
    hideBar: false,
    sockOpen: false,
    toView: '',
    isIos: false,
    isSendGood: false,
    isSend: false,
    showMask:true
  },
  onLoad: function(opt) {
    let _this = this
    let goodsInfo = opt.goodsInfo ? JSON.parse(decodeURIComponent(opt.goodsInfo)) : ''
    let orderInfo = opt.orderInfo ? JSON.parse(opt.orderInfo) : ''
    _this.setData({
      goodsInfo: goodsInfo,
      title: opt.name,
      orderInfo: orderInfo,
      isSend: opt.remind ? true : false,
      inputValue: opt.remind ? "你好，我的订单请尽快帮我发货。谢谢" : "",
    })
  },
  onHide: function() {
    this.setData({
      sockOpen: false
    })
    wx.closeSocket({})
  },
  onUnload: function() {
    this.setData({
      sockOpen: false
    })
    wx.closeSocket({})
  },
  onReady: function() {
    wx.setNavigationBarTitle({
      title: this.data.title
    })
  },
  getTimediff: function() {
    let list = this.data.list
    let lastChat = list.slice(-1)
    let lastTime = new Date(lastChat[0].msgTime.toString().replace(/-/g, '/')).getTime()
    let nowTime = new Date().getTime()
    if (nowTime - lastTime > 300000) {
      let data = {
        flag: '3',
        msgInfo: {
          type: 'msgTime',
          text: utils.formatSecond()
        }
      }
      list.push(data)
      this.setData({
        list: list
      })
    }
  },
  onShow: function() {
    let _this = this
    _this.socketMsg(function(res) {
      let list = _this.data.list
      let data = {}
      if (res.isSystem == true) {
        data = {
          flag: '3',
          msgInfo: res
        }
      } else {
        data = {
          flag: '1',
          msgInfo: res
        }
      }
      list.push(data)
      _this.setData({
        list: list,
        toView: 'a123456'
      })
    })
    app.checkUserId(_this.initUserinfo)
  },
  /**
   * 初始化用户信息
   */
  initUserinfo: function() {
    let _this = this
    let _global = app.globalData
    _this.setData({
      empId: _global.empId,
      shopId: _global.shopId,
      hyUserId: _global.hyUserId,
      isIos: _global.isIos
    })
    _this.getDetail().then(function() {
      setTimeout(() => {
        _this.setData({
          toView: 'a123456'
        })
      }, 200)
    })
  },
  //获取聊天详情
  getDetail: function(pageNo) {
    let _this = this
    let _global = app.globalData
    let data = _this.data
    let list = data.list || []
    _this.data.pageNo = pageNo || 1
    pageNo = pageNo || 1
    return new Promise(function(resolve, reject) {
      utils.$http(_global.lkBaseUrl + '/el-imfans-linke-api/miniChat/getChatRecord/' + (data.shopId || _global.shopId) + '/' + (data.empId || _global.empId) + '/' + data.hyUserId + '/2' + '/' + pageNo + '/20', {}, 'POST').then(res => {
        utils.globalShowTip(false)
        if (res && res.result) {
          let result = res.result
          let isLast = false
          //totalPages是？？？
          if (_this.data.pageNo >= result.msgPage.pageTotal) {
            isLast = true
          }
          if (_this.data.pageNo === 1) {
            list = result.msgPage.result
          } else {
            list = list.reduce(function(col, item) {
              col.push(item)
              return col
            }, result.msgPage.result)
          }
          _this.setData({
            empPhoto: result.empPhoto,
            fansPhoto: result.fansPhoto,
            list: list,
            isLastPage: isLast
          })
          resolve(list)
        }
      }).catch(error => {
        utils.globalShowTip(false)
      })
    })
  },
  bindKeyInput: function(e) {
    let value = e.detail.value
    let isSend = this.data.isSend
    if (value != null && value.trim() !== '') {
      isSend = true
    } else {
      isSend = false
    }
    this.setData({
      inputValue: e.detail.value,
      isSend: isSend
    })
  },
  send: function(e) {
    let formId = e.detail.formId
    app.saveFormIdSecond(formId)
    let _this = this
    _this.setData({
      toView: ''
    })
    let value = _this.data.inputValue
    let list = _this.data.list || []
    if (value != null && value.trim() !== '') {
      let data = {
        flag: '2',
        msgInfo: {
          type: 'txt',
          text: value
        },
        msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
      }

      let json = {
        "type": "txt",
        "text": value
      }
      let msg = {
        properties: {
          userId: _this.data.hyUserId,
          replyTo: _this.data.empId,
          appId: 'lk_mini_el',
          flag: "2",
          msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
        },
        payload: JSON.stringify(json)
      }
      // 如果打开了socket就发送数据给服务器  
      _this.sendSocketMessage(msg).then(() => {
        _this.getTimediff()
        list.push(data)
        // setTimeout-解决安卓机上按下发送文本同步阻塞不清空的问题
        setTimeout(function () {
          _this.setData({
            inputValue: "",
            list: list,
            isSend: false,
            toView: 'a123456'
          })
        },100)
      })
    } else {
      wx.showToast({
        title: '请输入文字',
        icon: 'none'
      })
    }
  },
  //发送单个商品
  sendGood(e) {
    let _this = this
    let dataset = e.currentTarget.dataset
    let tag = parseInt(dataset.tag)
    let goodObj
    if (tag == 1) {
      goodObj = _this.data.goodsInfo
    } else if (tag == 2) {
      let goods = _this.data.goods
      goods.goodsId = goods.id
      if (!goods) {
        _this.showTips('请选择一件商品')
        return
      }
      if (goods.activityId) {
        goods.price = goods.activityPriceDouble
      } else {
        goods.price = goods.maxSalePriceDouble
      }
      goodObj = goods
    }
    _this.setData({
      toView: '',
      isSendGood: true,
      showGoods: false,
      showMask:true
    })
    let list = _this.data.list || []
    let data = {
      flag: '2',
      msgInfo: {
        type: 'goods',
        goodsObj: goodObj
      },
      msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
    }

    let json = {
      "type": "goods",
      "goodsObj": goodObj
    }
    let msg = {
      properties: {
        userId: _this.data.hyUserId,
        replyTo: _this.data.empId,
        appId: 'lk_mini_el',
        flag: "2",
        msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
      },
      payload: JSON.stringify(json)
    }
    //如果打开了socket就发送数据给服务器  
    _this.sendSocketMessage(msg).then(() => {
      _this.getTimediff()
      list.push(data)
      _this.setData({
        list: list,
        isSend: false,
        toView: 'a123456'
      })
    })
  },
  //发送整个订单
  sendOrder: function(e) {
    let _this = this
    let orderObj = _this.data.orderInfo
    _this.setData({
      toView: '',
      isSendOrder: true
    })
    let list = _this.data.list || []
    let data = {
      flag: '2',
      msgInfo: {
        type: 'order',
        orderObj: orderObj
      },
      msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
    }

    let json = {
      "type": "order",
      "orderObj": orderObj
    }
    let msg = {
      properties: {
        userId: _this.data.hyUserId,
        replyTo: _this.data.empId,
        appId: 'lk_mini_el',
        flag: "2",
        msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
      },
      payload: JSON.stringify(json)
    }
    //如果打开了socket就发送数据给服务器  
    _this.sendSocketMessage(msg).then(() => {
      _this.getTimediff()
      list.push(data)
      _this.setData({
        list: list,
        isSend: false,
        toView: 'a123456'
      })
    })
  },
  //发送订单中的商品
  sendGoodsOrder: function() {
    let _this = this
    let orderGoods = this.data.orderGoods
    if (!orderGoods) {
      _this.showTips('请选择一件商品')
      return
    }
    _this.setData({
      toView: '',
      showOrder: false,
      showMask:true
    })
    let list = _this.data.list || []
    let data = {
      flag: '2',
      msgInfo: {
        type: 'orderGoods',
        orderGoods: orderGoods
      },
      msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
    }

    let json = {
      "type": "orderGoods",
      "orderGoods": orderGoods
    }
    let msg = {
      properties: {
        userId: _this.data.hyUserId,
        replyTo: _this.data.empId,
        appId: 'lk_mini_el',
        flag: "2",
        msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
      },
      payload: JSON.stringify(json)
    }
    //如果打开了socket就发送数据给服务器  
    _this.sendSocketMessage(msg).then(() => {
      _this.getTimediff()
      list.push(data)
      _this.setData({
        list: list,
        isSend: false,
        toView: 'a123456'
      })
    })
  },
  socketMsg(callback) {
    let _this = this
    let _global = app.globalData
    if (!wx.connectSocket) {
      return false
    }
    _this.setData({
      sockOpen: true
    })
    //建立连接
    sockTask = wx.connectSocket({
      url: _global.socketUrl,
      success(res) {
        console.log(res)
      },
      fail(err) {
        console.log('链接socket失败')
      }
    })
    sockTask.onOpen((res) => {
      console.log('打开socket')
      let msg = {
        properties: {
          userId: _global.hyUserId,
          replyTo: _global.empId,
          appId: 'lk_mini_el',
          'type': 'connect',
          flag: "2",
          isChat: true,
          msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
        },
        payload: 'connect'
      }
      sockTask.send({
        data: JSON.stringify(msg)
      }, function(res) {
        console.log(res)
      })
      sockInterval = setInterval(() => {
        let ping = {
          properties: {
            userId: _global.hyUserId,
            replyTo: _global.empId,
            appId: "lk_mini_el",
            "type": 'ping',
            flag: "2",
            isChat: true,
            msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
          },
          payload: 'ping'
        }
        sockTask.send({
          data: JSON.stringify(ping)
        })
      }, 10000)
    })
    sockTask.onMessage((res) => {
      let _data = JSON.parse(res.data)
      if (_data.properties.type === 'pong') {
        return
      }
      if (_data.properties.appId != "lk_mini_el") {
        return
      }
      let _payload = JSON.parse(_data.payload)
      if (callback && typeof callback === 'function') {
        _this.setData({
          toView: ''
        })
        callback(_payload)
      }
    })
    sockTask.onClose(function(res) {
      if (sockInterval) {
        clearInterval(sockInterval)
        sockTask = null
        sockInterval = null
      }
      console.log("socket已关闭")
      if (callback && typeof callback === 'function') { //关闭后重连
        if (_this.data.sockOpen) {
          _this.socketMsg(callback)
        }
      }
    })
  },
  //发送消息
  sendSocketMessage(data) {
    let _this = this
    return new Promise(function(resolve, reject) {
      if (sockTask.readyState == 1) {
        sockTask.send({
          data: JSON.stringify(data),
          success: function() {
            resolve()
          }
        })
      } else {
        wx.showToast({
          title: '网络不可用',
          icon: 'none'
        })
        return
      }
    })

  },
  //滑动到顶部
  scrollUpper: function() {
    let _this = this
    if (_this.data.isLastPage) {
      utils.globalShowTip(false)
    } else {
      _this.getDetail(_this.data.pageNo + 1).then(function(res) {
        let length = (_this.data.pageNo - 1) * 20
        let index = res.length - length - 1
        _this.setData({
          toView: "a" + res[index].msgId
        })
      })
    }
  },
  /**
   * 添加微信
   */
  createImg(e) {
    let formId = e.detail.formId
    app.saveFormIdSecond(formId)
    let _this = this
    let _global = app.globalData
    let empId = _this.data.empId || _global.empId
    let url = `${_global.lkBaseUrl}/el-store-linke-api/miniApp/getChatEmpQrCode/${_this.data.shopId}/${empId}`
    utils.$http(url, {}).then(res => {
      utils.globalShowTip(false)
      let rst = res.result
      wx.previewImage({
        current: rst.filePath, // 当前显示图片的http链接
        urls: [rst.filePath] // 需要预览的图片http链接列表
      })
    }).catch(err => {
      utils.globalShowTip(false)
    })
  },
  /**
   * 查看大图
   */
  previewImg: function(e) {
    let dataSet = e.currentTarget.dataset
    let imgUrl = dataSet.url
    wx.previewImage({
      current: imgUrl, // 当前显示图片的http链接
      urls: [imgUrl] // 需要预览的图片http链接列表
    })
  },
  toDetail(e) {
    let atype = e.currentTarget.dataset.activitytype
    let goodsId = e.currentTarget.dataset.goodsid
    let activivtyId = e.currentTarget.dataset.activityid
    if (atype === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else if (atype === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + activivtyId + '&goodsId=' + goodsId + '&activityType=' + atype
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?&goodsId=' + goodsId
      })
    }
  },
  // 获取商品列表
  getList: function(pageNo) {
    let _this = this
    let _data = this.data
    let _global = app.globalData
    _this.setData({
      pageNo1: pageNo || 1,
    })
    let pageNumber = pageNo || _data.pageNo1
    utils.$http(_global.lkBaseUrl + '/el-imfans-linke-api/miniChat/goodsList/' + _global.shopId + '/' + _global.storeId + '/' + _global.hyUserId + '/' + pageNumber, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          hasNextPage: res.result.hasNextPage,
          pageNumber: res.result.pageNumber
        })
        if (_this.data.pageNumber == 1) {
          _this.setData({
            goodsList: res.result.result
          })
        } else {
          _this.setData({
            goodsList: _this.data.goodsList.concat(res.result.result)
          })
        }
        if (!_this.data.goodsList.length) {
          _this.setData({
            isEmpty: true
          })
        } else {
          _this.setData({
            isEmpty: false
          })
        }
      }
    }).catch(e => {
      utils.globalShowTip(false)
    })
  },
  //商品列表分页
  toGoods: function() {
    let _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getList(_this.data.pageNo1 + 1)
    }
  },
  //订单商品列表分页
  toOrder: function() {
    let _this = this
    if (!_this.data.hasNextPage) {
      utils.globalShowTip(false)
    } else {
      _this.getOrder(_this.data.pageNo1 + 1)
    }
  },
  // 获取订单列表
  getOrder: function(pageNo) {
    let _this = this
    let _data = this.data
    let _global = app.globalData
    _this.setData({
      pageNo1: pageNo || 1,
    })
    let pageNumber = pageNo || _data.pageNo1
    utils.$http(_global.lkBaseUrl + '/el-imfans-linke-api/miniChat/orderList/' + _global.shopId + '/' + _global.storeId + '/' + _global.hyUserId + '/' + pageNumber, {}, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          hasNextPage: res.result.hasNextPage,
          pageNumber: res.result.pageNumber,
        })
        if (_this.data.pageNumber === 1) {
          _this.setData({
            orderList: res.result.result
          })
        } else {
          _this.setData({
            orderList: _this.data.orderList.concat(res.result.result)
          })
        }
        if (!_this.data.orderList.length) {
          _this.setData({
            isEmpty: true
          })
        } else {
          _this.setData({
            isEmpty: false
          })
        }
      }
    }).catch(e => {
      utils.globalShowTip(false)
    })
  },
  //咨询足迹商品、咨询订单
  tocustom: function(e) {
    let _this = this
    let dataset = e.currentTarget.dataset
    let idx = parseInt(dataset.idx)
    //足迹商品
    if (idx == 1) {
      _this.setData({
        showGoods: true
      })
      _this.getList()
      //订单商品
    } else if (idx == 2) {
      _this.setData({
        showOrder: true
      })
      _this.getOrder()
    }
    _this.setData({
      showMask:false
    })
  },
  closeGoods: function() {
    this.setData({
      showGoods: false,
      showMask: true,
      pageNo1: 1
    })
  },
  closeOrder: function() {
    this.setData({
      showOrder: false,
      showMask:true,
      pageNo1: 1
    })
  },
  preventClose: function() {
    return
  },
  showTips: function(tips) {
    wx.showToast({
      title: tips,
      icon: 'none'
    })
  },
  //选择足迹商品
  selectGoods: function(e) {
    let _this = this
    let dataSet = e.currentTarget.dataset
    let index = dataSet.index
    let goodsList = _this.data.goodsList
    goodsList.forEach((item, idx) => {
      if (idx === index) {
        item.isSelect = !item.isSelect
        _this.data.goods = item.isSelect ? item : ''
      } else {
        item.isSelect = false
      }
    })
    this.setData({
      goodsList: goodsList
    })
  },
  //选择订单中的商品
  selectOrder: function(e) {
    let _this = this
    let dataSet = e.currentTarget.dataset
    let index = dataSet.index
    let orderList = _this.data.orderList
    orderList.forEach((item, idx) => {
      if (idx === index) {
        item.isSelect = !item.isSelect
        _this.data.orderGoods = item.isSelect ? item : ''
      } else {
        item.isSelect = false
      }
    })
    this.setData({
      orderList: orderList
    })
  },
  //去分享的优惠券
  toShareCard:function(e){
    let {cardId,goodsId} = e.currentTarget.dataset
    let {empId} = app.globalData
    console.log(goodsId)
    let url = `/pages/mine/coupon/unDetail/unDetail?empId=${empId}&cardId=${cardId}&isCustom=true`
    if(goodsId){
      url = `/pages/account/favorable/cfavorable/cfavorable?empId=${empId}&goodsId=${goodsId}&cardId=${cardId}`
    }
    wx.navigateTo({
      url: url
    })
  }
})