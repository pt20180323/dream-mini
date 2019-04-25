const utils = require('../../../utils/util.js')
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.min.js')
let app = getApp()
let qqmapsdk = null
Page({
  data: {
    totalAreaList: [], //总的省市区
    totalAreaArr: [],
    multiArray: [],
    multiIndex: [],
    oneAreas: [], //一级区域
    oneAreasList: [],
    multiOneArray: [],
    multiOneIndex: [],
    //region: ['广东省', '广州市', '海珠区'],
    //customItem: '全部',
    oneArea: '',
    area: '',
    province: '',
    city: '',
    circle: '',
    addId: '',
    tackName: '',
    tackPhone: '',
    address: '',
    deliveryType: '1',
    cusRegion1: '',
    cusRegion2: ''
  },
  onLoad: function(opt) {
    if (opt) {
      console.log(opt)
      this.setData({
        tackName: opt.tackName || '',
        tackPhone: opt.tackPhone || '',
        province: opt.province || '',
        city: opt.city || '',
        circle: opt.circle || '',
        address: opt.address || '',
        addId: opt.addId || '',
        deliveryType: opt.deliveryType || '',
        goodsId: opt.goodsId || '',
        oneArea: opt.cusRegion1 || '',
        area: opt.cusRegion2 || '',
        cusRegion1: opt.cusRegion1 || '',
        cusRegion2: opt.cusRegion2 || '',
        multiOneIndex: [1, 2]
      })

      app.checkUserId(this.getTotalArea)
    }
    qqmapsdk = new QQMapWX({
      key: 'AGFBZ-A5OR4-PD3UF-DJTZ2-GTUI7-6GBV2'
    })
  },
  getLocal: function() {
    let _this = this
    wx.chooseLocation({
      success: function(res) {
        console.log(res)
        _this.reverseGeo(res.latitude, res.longitude)
        _this.setData({
          address: res.name
        })
      },
      fail: function(res) {

      }
    })
    return false
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success: function(res) {
        var latitude = res.latitude
        var longitude = res.longitude
        wx.openLocation({
          latitude: latitude,
          longitude: longitude,
          scale: 28
        })
      }
    })
  },
  reverseGeo: function(lat, lgt) {
    let _this = this
    let _data = _this.data
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: lat,
        longitude: lgt
      },
      success: function(res) {
        console.log(res)
        let rst = res.result
        let ac = rst.address_component
        let _prv = ac.province
        let _city = ac.city
        let _dist = ac.district
        _data.province = _prv
        _data.city = _city
        _data.circle = _dist
        _this.getCity(_prv)
        _this.setData({
          multiIndex: [_data.provinceList.indexOf(_prv), _data.cityList.indexOf(_city), _data.countyList.indexOf(_dist)]
        })
      },
      fail: function(res) {
        console.log(res)
      }
    })
  },
  getTotalArea: function() {
    let _this = this
    console.log(app.globalData)
    let params = {
      shopId: app.globalData.shopId || _this.data.shopId,
      storeId: app.globalData.storeId || _this.data.storeId,
      deliveryType: _this.data.deliveryType,
      goodsId: app.globalData.goodsId || _this.data.goodsId
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/address/circleList/' + params.shopId + '/' + params.storeId + '/' + params.deliveryType, params).then(res => {
      if (res) {
        //utils.globalShowTip(false)
        _this.totalAreaRender(res)
      }
    }).catch(res => {
      utils.globalShowTip(false)
      console.log(res)
    })
  },
  totalAreaRender: function(res) {
    console.log(res)
    this.setData({
      totalAreaList: res.result
    })
    this.getProvince(res.result)
  },
  getProvince: function(arr) { //获取省份列表
    //utils.globalShowTip(true)
    if (arr) {
      let _this = this
      let _arr = []
      arr.forEach(function(itm) {
        _arr.push(itm.name)
      })
      _this.setData({
        provinceList: _arr
      })
      let _prov = _this.data.province
      _this.data.multiIndex[0] = (_prov && _prov !== '') ? _this.getAreaIndex(_arr, _prov) : 0
      _this.getCity(_arr[_this.data.multiIndex[0]])
    }
  },
  getCity: function(name) { //通过省份获取城市列表
    if (name) {
      let _this = this
      let tlist = _this.data.totalAreaList
      let plist = _this.data.provinceList
      let idx = plist.indexOf(name)
      let _arr = []
      tlist[idx].cityList.forEach(function(itm) {
        _arr.push(itm.name)
      })
      _this.setData({
        cityList: _arr
      })
      let _city = _this.data.city
      _this.data.multiIndex[1] = (_city && _city !== '') ? _this.getAreaIndex(_arr, _city) : 0
      _this.getCounty(name, _arr[_this.data.multiIndex[1]])
    }
  },
  getCounty: function(prov, city) { //通过省份和城市获取区县列表
    if (prov && city) {
      let _this = this
      let tlist = _this.data.totalAreaList
      let plist = _this.data.provinceList
      let clist = _this.data.cityList
      let pidx = plist.indexOf(prov)
      let cidx = clist.indexOf(city)
      let _arr = []
      let oneAreas = [] // 一级区域
      tlist[pidx].cityList[cidx].countyList.forEach(function(itm) {
        _arr.push(itm.name)
        if (itm.oneAreas) {
          oneAreas.push(itm.oneAreas)
        }
      })
      let _county = _this.data.circle
      _this.data.multiIndex[2] = (_county && _county !== '') ? _this.getAreaIndex(_arr, _county) : 0
      _this.setData({
        countyList: _arr,
        multiArray: [plist, clist, _arr],
        multiIndex: _this.data.multiIndex,
        oneAreas: oneAreas
      })
      _this.getOneAreas()
    }
    utils.globalShowTip(false)
  },
  // 处理一级区域
  getOneAreas: function() {
    let _this = this
    let _data = _this.data
    let arr = _data.oneAreas
    utils.globalShowTip(true)
    if (arr) {
      let _arrList = []
      let _arr = []
      arr.forEach(function(itm) {
        itm.forEach(item => {
          _arrList.push(item)
          _arr.push(item.areaName)
        })
      })
      _this.setData({
        oneAreasList: _arrList,
        olist: _arr
      })
      let _area = _this.data.oneArea
      _this.data.multiOneIndex[0] = (_area && _area !== '') ? _this.getAreaIndex(_arr, _area) : 0
      _this.getAreas(_arr[_this.data.multiOneIndex[0]])
    }
  },
  // 获取二级区域
  getAreas: function(name) {
    if (name) {
      let _this = this
      let list = _this.data.oneAreasList
      console.log(list)
      let _arr = []
      list.filter((item, index) => {
        if (item.areaName === name) {
          item.areas instanceof Array && item.areas.forEach(function(itm) {
            _arr.push(itm.areaName)
          })
        }
      })
      console.log(_arr)

      let _area = _this.data.area
      console.log(_area)
      _this.data.multiOneIndex[1] = (_area && _area !== '') ? _this.getAreaIndex(_arr, _area) : 0
      _this.setData({
        areasList: _arr,
        multiOneArray: [_this.data.olist, _arr],
        multiOneIndex: _this.data.multiOneIndex
      })
    }
    console.log(this.data.multiOneIndex)
  },
  pickerCancel: function(e) {
    console.log(e)
  },
  bindMultiPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      multiIndex: e.detail.value
    })
  },
  bindMultiOnePickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      multiOneIndex: e.detail.value
    })
  },
  multiPickerColumnChange: function(e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    let _this = this
    _this.data.multiIndex[e.detail.column] = e.detail.value;
    switch (e.detail.column) {
      case 0:
        _this.getCity(_this.data.provinceList[e.detail.value])
        break;
      case 1:
        _this.getCounty(_this.data.provinceList[_this.data.multiIndex[0]], _this.data.cityList[e.detail.value])
        break;
    }
    //_this.setData(data)
  },
  multiOnePickerColumnChange: function(e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    let _this = this
    _this.data.multiOneIndex[e.detail.column] = e.detail.value;
    switch (e.detail.column) {
      case 0:
        _this.getAreas(_this.data.olist[e.detail.value])
        break;
    }
    //_this.setData(data)
  },
  getAreaIndex: function(arr, item) {
    if (arr && item) {
      return Math.max(arr.indexOf(item), 0)
    }
    return 0
  },
  bindRegionChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      region: e.detail.value
    })
  },
  nameIpt: function(evt) {
    this.setData({
      tackName: evt.detail.value
    })
  },
  phoneIpt: function(evt) {
    this.setData({
      tackPhone: evt.detail.value
    })
  },
  addrIpt: function(evt) {
    this.setData({
      address: evt.detail.value
    })
  },
  addAddr: function() {
    let _this = this
    let _data = _this.data
    let _tn = _data.tackName
    let _tp = _data.tackPhone
    let _addr = _data.address
    //console.log(_tn,_tp,_addr)
    if (!_tn || !_tn.replace(/\s| /g, '').length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入联系人姓名！',
        success: function(res) {},
        showCancel: false
      })
      return false
    }
    if (!_tp || !_tp.replace(/\s| /g, '').length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入联系人手机号码！',
        success: function(res) {},
        showCancel: false
      })
      return false
    }
    if (!_addr || !_addr.replace(/\s| /g, '').length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入详细地址！',
        success: function(res) {},
        showCancel: false
      })
      return false
    }
    let param = {
      tackName: _tn,
      tackPhone: _tp,
      address: _addr,
      addId: _data.addId,
      buyerId: app.globalData.buyerId,
      preferred: 1,
      provinceId: _data.totalAreaList[_data.multiIndex[0]].id,
      province: _data.totalAreaList[_data.multiIndex[0]].name,
      cityId: _data.totalAreaList[_data.multiIndex[0]].cityList[_data.multiIndex[1]].id,
      city: _data.totalAreaList[_data.multiIndex[0]].cityList[_data.multiIndex[1]].name,
      circleId: _data.totalAreaList[_data.multiIndex[0]].cityList[_data.multiIndex[1]].countyList[_data.multiIndex[2]].id,
      circle: _data.totalAreaList[_data.multiIndex[0]].cityList[_data.multiIndex[1]].countyList[_data.multiIndex[2]].name
    }
    if (_data.oneAreasList[_data.multiOneIndex[0]]) {
      param.rcustompId = _data.oneAreasList[_data.multiOneIndex[0]].uid || ''
      param.cusRegion1 = _data.oneAreasList[_data.multiOneIndex[0]].areaName || ''
    }
    console.log(_data.multiOneIndex)
    if (_data.oneAreasList[_data.multiOneIndex[0]] && _data.oneAreasList[_data.multiOneIndex[0]].areas instanceof Array && _data.oneAreasList[_data.multiOneIndex[0]].areas[_data.multiOneIndex[1]]) {
      if (_data.oneAreasList[_data.multiOneIndex[0]].areas instanceof Array) {
        param.rcustomId = _data.oneAreasList[_data.multiOneIndex[0]].areas[_data.multiOneIndex[1]].uid || ''
        param.cusRegion2 = _data.oneAreasList[_data.multiOneIndex[0]].areas[_data.multiOneIndex[1]].areaName || ''
      }
    }
    _this.submitAddr(param)
    console.log(param)
  },
  submitAddr: function(params) {
    console.log(params)
    let _this = this
    let _url = '/emallMiniApp/address/add'
    let _id = params.addId
    if (_id && _id !== '') {
      _url = '/emallMiniApp/address/edit'
    }
    _url += ('/' + app.globalData.shopId + '/' + app.getStoreId())
    utils.$http(app.globalData.baseUrl + _url, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.addrCallback(res)
      }
    })
  },
  addrCallback: function(_res) {
    let _this = this
    wx.showModal({
      title: '温馨提示',
      content: '收货地址更新成功！',
      success: function(res) {
        if (res.confirm) {
          let param = {
            shopId: app.globalData.shopId || _this.data.shopId,
            storeId: app.globalData.storeId || _this.data.storeId
          }
          utils.$http(app.globalData.baseUrl + '/emallMiniApp/address/getDefault/' + param.shopId + '/' + param.storeId).then(res => {
            if (res) {
              utils.globalShowTip(false)
              app.globalData.addId = res.result ? res.result.addId : _this.data.addId
              app.globalData.updateAddr = true
              app.globalData.sendAddObj = res.result
              wx.navigateBack({delta: 1})
            }
          })
        }
      },
      showCancel: false
    })
  }
})