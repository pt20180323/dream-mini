const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    currentPageTab1: 1,
    currentPageTab2: 1,
    currentPageTab3: 1,
    currentPageTab4: 1,
    hasNext1: false,
    hasNext2: false,
    hasNext3: false,
    hasNext4: false,
    issubmitting1: false,
    issubmitting2: false,
    issubmitting3: false,
    issubmitting4: false,
    isEmpty1: false,
    isEmpty2: false,
    isEmpty3: false,
    isEmpty4: false,
    list1: [],
    list2: [],
    list3: [],
    list4: [],
    navTab: 1
  },
  onLoad: function (opt) {
    let _this = this
    app.checkUnionId(_this.getList)
  },
  getList: function () {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    let curPage = 1
    if (idx === 1) {
      curPage = _data.currentPageTab1
    } else if (idx === 2) {
      curPage = _data.currentPageTab2
    } else if (idx === 3) {
      curPage = _data.currentPageTab3
    } else if (idx === 4) {
      curPage = _data.currentPageTab4
    }
    let _tab = 1;
    if (_data.navTab === 1) {
      _tab = 1
    } else if (_data.navTab === 2) {
      _tab = 3
    } else if (_data.navTab === 3) {
      _tab = 100
    } else if (_data.navTab === 4) {
      _tab = 5
    }
    let _param = {
      pageSize: 50,
      pageNumber: curPage,
      cardStatus: _tab,
      storeId: app.globalData.storeId,
      // useScenes: _data.useScenes,
      shopId: app.globalData.shopId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/voucher/list/' + _param.shopId + '/' + _param.storeId + '/' + _param.pageNumber, _param).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.renderList(res)
      }
    })
  },
  renderList: function (res) {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    let _list = res.result.result
    console.log(res)
    if (idx === 1) {
      _this.setData({
        list1: _this.data.list1.concat(_list),
        issubmitting1: false
      })
      if (!_this.data.list1.length) {
        _this.setData({
          isEmpty1: true
        })
      } else {
        _this.setData({
          isEmpty1: false
        })
      }
    } else if (idx === 2) {
      _this.setData({
        list2: _this.data.list2.concat(_list),
        issubmitting2: false
      })
      if (!_this.data.list2.length) {
        _this.setData({
          isEmpty2: true
        })
      } else {
        _this.setData({
          isEmpty2: false
        })
      }
    } else if (idx === 3) {
      _this.setData({
        list3: _this.data.list3.concat(_list),
        issubmitting3: false
      })
      if (!_this.data.list3.length) {
        _this.setData({
          isEmpty3: true
        })
      } else {
        _this.setData({
          isEmpty3: false
        })
      }
    } else if (idx === 4) {
      _this.setData({
        list4: _this.data.list4.concat(_list),
        issubmitting4: false
      })
      if (!_this.data.list4.length) {
        _this.setData({
          isEmpty4: true
        })
      } else {
        _this.setData({
          isEmpty4: false
        })
      }
    }
    _this.data['hasNext' + idx] = res.result.pageNumber < res.result.pageTotal
  },
  changeTab: function (evt) {
    let dts = evt.target.dataset
    this.setData({
      navTab: parseInt(dts.type)
    })
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)

    if (idx === 1) {
      if (_this.data.list1.length === 0) {
        _this.getList()
      }
    } else if (idx === 2) {
      if (_this.data.list2.length === 0) {
        _this.getList()
      }
    } else if (idx === 3) {
      if (_this.data.list3.length === 0) {
        _this.getList()
      }
    } else if (idx === 4) {
      if (_this.data.list4.length === 0) {
        _this.getList()
      }
    }
  },
  onReachBottom: function () {
    let _this = this
    let _data = _this.data
    let idx = parseInt(_data.navTab)
    if (idx === 1) {
      if (!_this.data.hasNext1) { //没有下一页
        return false;
      }

      if (_this.data.issubmitting1) {
        return false;
      }
      // _this.data.issubmitting1 = true;
      _this.setData({
        currentPageTab1: ++_data.currentPageTab1,
        issubmitting1: true
      })
      _this.getList();
    } else if (idx === 2) {
      if (!_this.data.hasNext2) { //没有下一页
        return false;
      }
      if (_this.data.issubmitting2) {
        return false;
      }
      // _this.data.issubmitting2 = true;
      _this.setData({
        currentPageTab2: ++_data.currentPageTab2,
        issubmitting2: true
      })
      _this.getList();

    } else if (idx === 3) {
      if (!_this.data.hasNext3) { //没有下一页
        return false;
      }
      if (_this.data.issubmitting3) {
        return false;
      }
      // _this.data.issubmitting3 = true;
      _this.setData({
        currentPageTab3: ++_data.currentPageTab3,
        issubmitting3: true
      })
      _this.getList();
    } else if (idx === 4) {
      if (!_this.data.hasNext4) { //没有下一页
        return false;
      }
      if (_this.data.issubmitting4) {
        return false;
      }
      // _this.data.issubmitting4 = true;
      _this.setData({
        currentPageTab4: ++_data.currentPageTab4,
        issubmitting4: true
      })
      _this.getList();
    }
  },
  toDeatil: function (opt) {
    wx.navigateTo({
      url: './detail/detail?shopId=' + app.globalData.shopId + '&cardId=' + opt.currentTarget.dataset.cardid + '&codeData=' + opt.currentTarget.dataset.codeData
    })
  }
})