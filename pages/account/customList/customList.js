const app = getApp()
const utils = require('../../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    groupList: [],
    loading: false,
    isshowEmpty: false,
    isLastPage: false,
    pageNo: 1,
    noMsg: '暂无客户',
    content: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(opt) {
    wx.hideShareMenu()
    let shareInfo = opt.shareInfo ? JSON.parse(opt.shareInfo) : {}
    this.setData({
      shareInfo: shareInfo,
      cardId: opt.cardId,
      goodsId: opt.goodsId || '',
      cardType: opt.cardType,
      taskId: opt.taskId || ''
    })
    app.checkUserId(this.getList)
  },
  getList: function(pageNo) {
    let _this = this
    let {
      lkBaseUrl,
      shopId,
      storeId,
      empId
    } = app.globalData
    _this.data.pageNo = pageNo || 1
    let url = `/el-imfans-linke-api/employee/fans/page/${shopId}/${storeId}`
    let param = {
      pageNumber: _this.data.pageNo,
      empId: empId,
      pageSize: 20,
      content: _this.data.content
    }
    utils.$http(lkBaseUrl + url, param, 'POST', _this.data.loading).then(res => {
      utils.globalShowTip(false)
      _this.setData({
        isLastPage: !res.result.hasNextPage,
        loading: false
      })
      if (_this.data.pageNo == 1) {
        _this.setData({
          groupList: res.result.result
        })
      } else {
        _this.setData({
          groupList: _this.data.groupList.concat(res.result.result)
        })
      }
      if (_this.data.groupList.length == 0) {
        _this.setData({
          isshowEmpty: true
        })
      }
    }).catch(err => {})
  },
  //删除搜索关键字
  clearKey: function(e) {
    if (this.data.content) {
      this.setData({
        content: ''
      })
      this.getList()
    }
    this.setData({
      showClose: false
    })
  },
  //输入关键字
  inputValue: function(e) {
    let value = e.detail.value
    if (value) {
      this.setData({
        content: value
      })
    }
  },
  //获取焦点时触发
  getFocus() {
    this.setData({
      showClose: true
    })
  },
  //搜索
  searchCus: function(e) {
    let value = e.detail.value
    if (value) {
      this.setData({
        content: value
      })
      this.getList()
    }
  },
  preventClose() {},
  onReachBottom: function() {
    const _this = this
    if (!_this.data.isLastPage) {
      _this.setData({
        loading: 1
      })
      _this.getList(_this.data.pageNo + 1)
    }
  },
  //去分享
  toShare: function(e) {
    let {
      qyOpenId,
      hyId,
      img,
      index
    } = e.currentTarget.dataset
    this.setData({
      index: index
    })
    if (qyOpenId) {
      this.setData({
        cusId: qyOpenId
      })
      this.toQyShare()
    } else {
      this.setData({
        cusId: hyId,
        userPhoto: img
      })
      this.toChatShare()
    }
  },
  //调用企业微信分享api
  toQyShare: function() {
    let _this = this
    let _empId = app.getEmpId()
    let {
      goodsId,
      cardId,
      cusId,
      shareInfo,
      index,
      groupList,
      taskId
    } = _this.data
    let _global = app.globalData
    let _url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&empId=' + _global.empId + '&cardId=' + cardId + '&isCustom=true'
    if (goodsId) {
      _url = '/pages/account/favorable/cfavorable/cfavorable?' + (_empId ? ('empId=' + _empId) : '') + '&goodsId=' + goodsId + '&cardId=' + cardId + '&isCustom=true'
    }
    wx.qy.shareAppMessageEx({
      title: shareInfo.shareTitle,
      imageUrl: shareInfo.pic,
      path: _url,
      selectedExternalUserIds: [cusId] || [],
      success: function(res) {
        if (taskId) {
          _this.finisTask()
        }
        _this.saveShareHistory()
        groupList[index].isSend = true
        _this.setData({
          groupList: groupList
        })

      },
      fail: function(res) {}
    })
  },
  //去聊天详情分享优惠券
  toChatShare: function() {
    this.setData({
      showChat: true
    })
  },
  hideChat() {
    this.setData({
      showChat: false
    })
  },
  sureSend: function() {
    let {
      taskId
    } = this.data
    this.saveShareHistory()
    this.setCus()
    if (taskId) {
      this.finisTask()
    }
  },
  //发送给客户接口
  setCus: function() {
    let {
      lkBaseUrl,
      shopId,
      storeId,
      empId
    } = app.globalData
    let {
      index,
      groupList,
      cardId,
      cusId,
      goodsId,
      cardType
    } = this.data
    utils.$http(lkBaseUrl + `/el-imfans-linke-api/miniChat/sendCardMsg/${shopId}/${storeId}/${empId}/${cardId}`, {
      hyIds: cusId,
      goodsId: goodsId || '',
      cardType: cardType
    }, 'POST').then(res => {
      utils.globalShowTip(false)
      groupList[index].isSend = true
      this.setData({
        showChat: false,
        groupList: groupList
      })
      wx.showToast({
        title: '已发送',
        icon: 'none'
      })
    }).catch(err => {})
  },
  // 导购分享卡券记录接口
  saveShareHistory() {
    let _this = this
    let _global = app.globalData
    let {
      cardId
    } = _this.data
    let _url = `${_global.lkBaseUrl}/el-imfans-linke-api/card/saveShareHistory/${_global.shopId}/${_global.storeId}/${_global.empId}`
    let _params = {
      cardId: cardId
    }
    utils.$http(_url, _params, 'GET', 'noTips').then(res => {}).catch(error => {})
  },
  //完成任务的标记接口
  finisTask() {
    let _this = this
    let _global = app.globalData
    let {
      cardId,
      taskId
    } = _this.data
    let _url = _global.baseUrl + '/emallMiniApp/emp/task/finish/' + _global.shopId + '/' + _global.storeId + '/' + taskId + '/' + cardId
    let _params = {
      empId: _global.empId
    }
    utils.$http(_url, _params, 'GET', 'noTips').then(res => {}).catch(error => {})
  },
  toLink: function(e) {
    let {
      hyId,
      name,
      qyOpenId
    } = e.currentTarget.dataset
    let {
      environment
    } = app.globalData
    if (environment && environment.toLowerCase() === 'wxwork' && qyOpenId && qyOpenId !== '') {
      app.qyCreateChat('', qyOpenId || '', '')
    }else{
      this.jumpApp(hyId,name)
    }
  },
  jumpApp(hyId,name) {
    let _url = `/pages/chat/chat?hyId=${hyId}&name=${name}`
    wx.navigateToMiniProgram({
      appId:app.globalData.jumpAppId,
      path: _url,
      extraData: {
        'type': 'zhiyuan'
      },
      envVersion: 'develop',
      success(res) {}
    })
  }
})