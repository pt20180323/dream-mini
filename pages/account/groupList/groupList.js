const app = getApp()
const utils = require('../../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    groupList: [],
    isshowEmpty: false
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
    app.checkUnionId(this.getGroup)
  },
  getGroup: function() {
    let _this = this
    let {
      lkBaseUrl,
      shopId,
      storeId,
      empId
    } = app.globalData
    utils.$http(lkBaseUrl + `/el-imfans-linke-api/emp/sharingcard/fans/list/${shopId}/${storeId}/${empId}/${this.data.cardId}`, {}, '').then(res => {
      utils.globalShowTip(false)
      if (res.result) {
        _this.setData({
          groupList: res.result
        })
      }
      if (_this.data.groupList.length == 0) {
        _this.setData({
          isshowEmpty: true
        })
      }
    }).catch(err => {})
  },
  toShare: function(e) {
    let {
      qy,
      index
    } = e.currentTarget.dataset
    let {
      groupList
    } = this.data
    let cusIds = []
    this.setData({
      index: index
    })
    if (parseInt(qy) == 1) {
      groupList[index].fansList.forEach(function(item, index) {
        cusIds.push(item.qyOpenId)
      })
      this.toQyShare(cusIds)
    } else {
      let usersPhoto = []
      groupList[index].fansList.forEach(function(item, index) {
        cusIds.push(item.hyId)
        usersPhoto.push(item.wxPhoto)
      })
      this.setData({
        usersPhoto: usersPhoto,
        cusIds:cusIds
      })
      this.toChatShare()
    }
  },
  //发送给客户
  toQyShare: function(cusIds) {
    let _this = this
    let _empId = app.getEmpId()
    let _global = app.globalData
    let {
      groupList,
      empId,
      cardId,
      shareInfo,
      goodsId,
      index,
      taskId
    } = _this.data
    let _url = '/pages/mine/coupon/unDetail/unDetail?shopId=' + _global.shopId + '&empId=' + _global.empId + '&cardId=' + cardId + '&isCustom=true'
    if (goodsId) {
      _url = '/pages/account/favorable/cfavorable/cfavorable?' + (_empId ? ('empId=' + _empId) : '') + '&goodsId=' + goodsId + '&cardId=' + cardId + '&isCustom=true'
    }
    wx.qy.shareAppMessageEx({
      title: shareInfo.shareTitle,
      imageUrl: shareInfo.pic,
      path: _url,
      selectedExternalUserIds: cusIds,
      success: function(res) {
        _this.saveShareHistory()
        if (taskId) {
          _this.finisTask()
        }
        groupList[index].isSend = true
        _this.setData({
          groupList: groupList
        })
      },
      fail: function(res) {}
    })
  },
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
  preventClose() {},
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
    let {groupList,index,cardId,goodsId,cardType,cusIds} = this.data
    utils.$http(lkBaseUrl + `/el-imfans-linke-api/miniChat/sendCardMsg/${shopId}/${storeId}/${empId}/${cardId}`, {
      hyIds: cusIds.join(','),
      goodsId:goodsId || '',
      cardType:cardType
    }, 'POST').then(res => {
      utils.globalShowTip(false)
      groupList[index].isSend = true
      this.setData({
        groupList: groupList,
        showChat:false
      })
      wx.showToast({
        title: '已发送',
        icon: 'none'
      })
    }).catch(err => {})
  },
  toCustom: function() {
    let {
      cardId,
      shareInfo,
      goodsId,
      cardType
    } = this.data
    wx.navigateTo({
      url: `/pages/account/customList/customList?shareInfo=${JSON.stringify(shareInfo)}&cardId=${cardId}&goodsId=${goodsId}&cardType=${cardType}`
    })
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
  }
})