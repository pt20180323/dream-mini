const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    formId: '',
    isTeamShare: false,
    isTeamDet:false,
    interval: null,
    countHtml: '',
    teamId: '',
    teamDetailVo: {},
    teamShopGoods: {},
    btSuccess: false, //抱团成功
    notOffer: false, //未参团
    notPay: false, //参团未支付
    groupFull: false, //团已满
    groupTimeout: false, //团过期
    actOver: false, //活动已结束
    saleOut: false, //商品售磬
    difStore: false, //不同门店
    isAdded: false, //是否已参团
    time: ''
  },
  onLoad(opt){
    let _this = this
    if (opt || app.globalData.teamId) {
      let _tid = opt.teamId ? opt.teamId : app.globalData.teamId 
      _this.setData({
        teamId: _tid,
        storeId: opt.storeId || '',
        shopId: opt.shopId || ''
      })
      app.checkUserId(_this.getTeamDetail)
      _this.data.interval = setInterval(()=>{
        if (_this.data.teamDetailVo.countDownSeconds > 0) {
          _this.countDown(--_this.data.teamDetailVo.countDownSeconds)
        }
      }, 1000)
    }    
  },
  countDown(num){
    let _this = this
    if (num < 1) {
      clearInterval(_this.data.interval)
      _this.data.interval = null
    }
    _this.data.teamDetailVo.countDownSeconds = num
    let day = Math.floor(num / (24 * 60 * 60))
    let rewriteD = day < 10 ? ('0' + day) : day
    let hour = Math.floor(num / (60 * 60)) % 24
    let rewriteH = hour < 10 ? ('0' + hour) : hour
    let minute = Math.floor((num % 3600) / 60)
    let rewriteM = minute < 10 ? ('0' + minute) : minute
    let second = Math.floor(num % 60)
    let rewriteS = second < 10 ? ('0' + second) : second;
    let timeStr = rewriteD + '天' + rewriteH + ':' + rewriteM + ':' + rewriteS
    this.setData({
      countHtml: timeStr
    })
  },
  getTeamDetail(){
    let _this = this
    let _data = _this.data
    let gData = app.globalData
    let params = {
      teamId: _data.teamId || gData.shareTeamId,
      shopId: gData.shopId,
      storeId: gData.storeId,
      buyerId: gData.buyerId
    }
    if (gData.businessModel && _data.storeId && _data.storeId !== gData.storeId) {
      let conf = {
        title: '温馨提示',
        mask: true,
        content: '您所属门店与活动门店不同，请选择其他抱团购活动',
        success(res){
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index'
            })
          } else if (res.cancel) {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }
        },
        complete(res){
          if (res.confirm || res.cancel) {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }else{            
            wx.showModal(conf)// 不是点击确定或取消的，再次弹出窗口
          }
        },
        showCancel: false
      }
      wx.showModal(conf)
    }
    utils.$http(app.globalData.baseUrl + '/elshop/my/getTeamDetail', params).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.teamDetRender(res)
      }
    }).catch(res => {
      // utils.globalShowTip(false)
    })
  },
  teamDetRender(res){
    if (res && res.result) {
      let _vo = res.result.teamDetailVo
      let hdStatus = _vo.huddleStatus
      let timeStatus = _vo.timeStatus
      let _stu = parseInt(_vo.status || 0)
      //console.log(_stu)
      if (_vo.leader) {
        if (hdStatus === 5) { //抱团进行中
          this.setData({
            isTeamShare: true
          })
          if (timeStatus === 3) { //活动已结束
            this.setData({
              actOver: true
            })
          } else if (timeStatus === 4) { //团过期
            this.setData({
              groupTimeout: true
            })
          }     
        } else if (hdStatus === 1) { //抱团成功
          this.setData({
            isTeamDet: true,
            btSuccess: true
          })
        }    
      } else { //不是团长
        this.setData({
          isTeamDet: true
        })
        if (hdStatus === 1) { //此团已满
          if (_vo.orderNo && _vo.orderNo !== '') { //已参团
            this.setData({
              btSuccess: true
            })
          } else {
            this.setData({
              groupFull: true
            })
          }
        } else if (hdStatus === 2) { //抱团失败
          if (timeStatus === 3) { //活动已结束
            this.setData({
              actOver: true
            })
          } else { //团过期
            this.setData({
              groupTimeout: true
            })
          }
        } else if (hdStatus === 3) { //商品已售磬
          this.setData({
            saleOut: true
          })
        } else if (hdStatus === 5) { //抱团进行中
          if (timeStatus === 2) { //活动正常
            if (_vo.orderNo && _vo.orderNo !== '') { //已参团
              console.log(_stu)
              if (_stu === 0) { //未支付
                this.setData({
                  notPay: true
                })
              } else {
                if (_vo.huddleLackNumber < 1) {
                  this.setData({
                    isTeamDet: true,
                    btSuccess: true
                  })
                } else {
                  this.setData({
                    isTeamDet: true,
                    isAdded: true
                  })
                }                
              }
            } else { //未参团
              this.setData({
                notOffer: true
              })
            }
          } else if (timeStatus === 3) { //活动已结束
            this.setData({
              actOver: true
            })
          } else if (timeStatus === 4) { //团过期
            this.setData({
              groupTimeout: true
            })
          }
        } else if (hdStatus === 6 || hdStatus === 7) { //抱团失败
          this.setData({
            groupTimeout: true //团过期
          })
        } 
      }
      _vo.emptyList = []
      for (let i = 0; i < _vo.huddleLackNumber; i++) {
        _vo.emptyList.push('')
      }
      this.setData({
        teamDetailVo: _vo,
        teamShopGoods: res.result.teamShopGoods
      })
    }
  },
  moreShop(){
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  gotoPay(evt){
    let dts = evt.target.dataset
    app.saveFormId(evt.detail.formId)
    wx.navigateTo({
      url: `/pages/payment/payment?orderNo=${dts.oid}`
    })
  },  
  toMyOrder(res){
    wx.navigateTo({
      url: '/pages/mine/myOrder/myOrder',
    })
  },
  onShareAppMessage(res){
    if (res.from === 'button') {
      // 来自页面内转发按钮
      // console.log(res.target)
    }
    let _empId = app.getEmpId()
    let _data = this.data
    let _url = '/pages/teamshop/teamDetail/teamDetail?storeId=' + (_data.storeId || app.globalData.storeId) + (_empId ? ('&shareEmpId=' + _empId) : '') + '&teamId=' + _data.teamId + '&shopId=' + (_data.shopId || app.globalData.shopId)
    // console.log(_url)
    return {
      title: '跟我一起' + _data.teamDetailVo.huddlePrice + '元团' + _data.teamDetailVo.goodsName,
      path: _url,
      imageUrl: app.globalData.imgUrl,
      success(res){
        // 转发成功
      },
      fail(res){
        // 转发失败
      }
    }
  }
})