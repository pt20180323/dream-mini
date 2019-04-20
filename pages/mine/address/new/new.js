const utils = require('../../../../utils/util.js')
const QQMapWX = require('../../../../utils/qqmap-wx-jssdk.min.js')
let app = getApp()
let qqmapsdk = null
Page({
  data: {
    IsSet: false, // 是否是编辑地址
    newValue: [0, 0, 0],
    cacheNewValue: [0, 0, 0],
    subValue: [0],
    cacheSubValue: [0,0],
    SetId: [0, 0, 0, 0], // 修改地址时，之前的地址ID
    //region: ['广东省', '广州市', '海珠区'],
    //customItem: '全部',
    cusRegion1: '',
    cusRegion2: '',
    province: '',
    city: '',
    circle: '',
    addId: '',
    tackName: '',
    tackPhone: '',
    address: '',
    deliveryType: 1,
    newProvince: [], // 最新省份数组
    newCity: [], // 最新城市数组
    cacheNewCity: [], // 历史城市数组
    newCounty: [], // 最新区县数组
    cacheNewCounty: [], // 历史区县数组
    newRegion: [{ id: 0, name: '其他' }], // 最新城镇数组
    Isqqmap: false // 是否QQ地图获取当前位置
  },
  onLoad(opt){
    //console.log(opt)
    //opt.goodsId = 'd7a16932-6d30-4a0a-a169-326d306a0a31'
    //opt.deliveryType = 3
    qqmapsdk = new QQMapWX({
      key: 'AGFBZ-A5OR4-PD3UF-DJTZ2-GTUI7-6GBV2'
    })
    this.setData({
      deliveryType: opt.deliveryType || 1,
      goodsId: opt.goodsId || '',
      addId: opt.addId || ''
    })
    app.checkUnionId(this.initData)
  },
  initData() {
    let _addId = this.data.addId || ''
    console.log(_addId)
    if(_addId){
      this.setData({
        IsSet: true
      })
      this.getDetail()
    } else {
      this.getNewProvince()
    }
  },
  getDetail(){
    let _global = app.globalData
    let _this = this
    utils.$http(`${_global.baseUrl}/emallMiniApp/address/detail/${_global.shopId}/${_global.storeId}/${_this.data.addId}`, {}).then(res => {
      if (res) {
        _this.renderDetail(res)
        utils.globalShowTip(false)
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  renderDetail(res){
    let _rst = res.result
    // SetId
    let SetId = [_rst.provinceId, _rst.cityId, _rst.circleId, _rst.areaId || 0]
    this.setData({
      tackName: _rst.tackName || '',
      tackPhone: _rst.tackPhone || '',
      province: _rst.province || '',
      city: _rst.city || '',
      circle: _rst.circle || '',
      provinceId: _rst.provinceId || '',
      area: _rst.area,
      areaId: _rst.areaId,
      cityId: _rst.cityId || '',
      circleId: _rst.circleId || '',
      rcustompId: _rst.rcustompId || '',
      rcustomId: _rst.rcustomId || '',
      address: _rst.address || '',
      inited: _rst.preferred ? true : false,
      SetId: SetId
    })
    this.getNewProvince()
    this.getNewCity(_rst.provinceId)
    this.getNewCounty(_rst.cityId)
    _rst.circleId && this.getTownship(_rst.circleId)
  },
  // 获取用户当前位置
  getLocal(){
    let _this = this
    wx.chooseLocation({
      success(res){
        console.log(res)
        _this.reverseGeo(res.latitude, res.longitude)
        _this.setData({
          address: res.name
        })
      }
    })
  },
  // 转换用户当前位置经纬度
  reverseGeo(lat, lgt) {
    let _this = this
    let _data = _this.data
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: lat,
        longitude: lgt
      },
      success(res) {
        console.log(res)
        let rst = res.result
        let ac = rst.address_component
        let _prv = ac.province
        let _city = ac.city
        let _dist = ac.district
        _data.province = _prv
        _data.city = _city
        _data.cityId = ''
        _data.circle = _dist
        _data.circleId = ''
        let _prvId = _this.getCurrentId(_data.newProvince, _prv)
        console.log(_data.newCity)
        _data.newValue[0] = _this.getCurrentIdx(_data.newProvince, _prv)
        _this.setData({
          newValue: _data.newValue,
          provinceId: _prvId,
          Isqqmap: true
        })
        // 获取对应的市
        _this.getNewCity(_prvId)
      },
      fail(res) {
        console.log(res)
      }
    })
  },
  nameIpt(evt){
    this.setData({
      tackName: evt.detail.value
    })
  },
  phoneIpt(evt){
    this.setData({
      tackPhone: evt.detail.value
    })
  },
  addrIpt(evt){
    this.setData({
      address: evt.detail.value
    })
  },
  addAddr(){
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
        success(res){
        },
        showCancel: false
      })
      return false
    }
    if (!_tp || !_tp.replace(/\s| /g, '').length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入联系人手机号码！',
        success(res){
        },
        showCancel: false
      })
      return false
    }
    if (!_addr || !_addr.replace(/\s| /g, '').length) {
      wx.showModal({
        title: '温馨提示',
        content: '请输入详细地址！',
        success(res){
        },
        showCancel: false
      })
      return false
    }
    let _nval = _data.newValue
    console.log(_nval)
    let param = {
      tackName: _tn,
      tackPhone: _tp,
      address: _addr,
      addId: _data.addId,
      buyerId: app.globalData.buyerId || '',
      preferred: _data.inited ? 1 : 0,
      provinceId: _data.newProvince[_nval[0]].id,
      province: _data.newProvince[_nval[0]].name,
      cityId: _data.newCity[_nval[1]].id,
      city: _data.newCity[_nval[1]].name,
      circleId: _data.newCounty[_nval[2]].id,
      circle: _data.newCounty[_nval[2]].name
    }
    let _region = _data.newRegion
    if (_region && _region.length && _region[_data.subValue[0]]) {
      param.areaId = _region[_data.subValue[0]].id || 0
      param.area = _region[_data.subValue[0]].name || ''
    }
    console.log(param)
    _this.submitAddr(param)
  },
  submitAddr(params){
    let _this = this
    let _gd = app.globalData
    let _url = '/emallMiniApp/address/add'
    let _id = params.addId
    if (_id && _id !== '') {
      _url = '/emallMiniApp/address/edit'
    }
    _url += ('/' + _gd.shopId + '/' + app.getStoreId())
    utils.$http(_gd.baseUrl + _url, params, 'POST').then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.addrCallback(res)
      }
    })
  },
  addrCallback(_res){
    let _this = this
    wx.showModal({
      title: '温馨提示',
      content: '收货地址更新成功！',
      success(res){
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
              wx.navigateBack({
                delta: 1
              })
            }
          })
        }
      },
      showCancel: false
    })
  },
  setInit(evt) {
    this.setData({
      inited: !this.data.inited
    })
  },
  getCurrentIdx(list, str) {//通过id或名称获取当前索引值
    let newStr = str.replace("省", "");
    let idx = 0
    list.forEach((item, index) => {
      if (item.id === newStr || item.name === newStr) {
        idx = index
      }
    })
    return idx
  },
  getCurrentId(list, name) {
    let newStr = name.replace("省", "");
    let id = ''
    list.forEach((item) => {
      if (item.name === newStr) {
        id = item.id
      }
    })
    return id
  },
  getNewProvince() {//获取省份
    let _this = this
    let _data = _this.data
    // isSet-是否是修改地址
    let isSet = _data.IsSet
    let _gd = app.globalData
    let _prm = {
      shopId: _gd.shopId,
      storeId: _gd.storeId,
      deliveryType: _data.deliveryType,
      goodsId: _data.goodsId || ''
    }
    utils.$http(`${_gd.baseUrl}/emallMiniApp/address/province/${_prm.shopId}/${_prm.storeId}/${_prm.deliveryType}`, _prm, 'GET', true).then(res => {
      let _rst = res.result || []
      _this.setData({
        newProvince: _rst
      })
      // 如果是修改地址
      if (isSet) {
        //这里获取省份ID
        let ProId = _data.SetId[0]
        let Nval = _data.newValue
        _rst.map((item, i) => {
          if (item.id == ProId) {
            Nval[0] = i
          }
        })
        _this.setData({
          newValue: Nval,
          cacheNewProvince: _rst,
          cacheNewValue: Nval
        })
      } else {
        // 如果不是修改地址就执行
        // 获取省份后，把第一个省份ID传给获取城市的方法
        _this.getNewCity(_data.newProvince[0].id)
      }
    }).catch(res => { })
  },
  getNewCity(provinceId) {//获取城市
    let _this = this
    let _data = _this.data
    // isSet-是否是修改地址
    let isSet = _data.IsSet
    let _gd = app.globalData
    let _prm = {
      shopId: _gd.shopId,
      storeId: _gd.storeId,
      provinceId: provinceId || '',
      deliveryType: _data.deliveryType,
      goodsId: _data.goodsId || ''
    }
    _this.setData({
      newCity: []
    })
    utils.$http(`${_gd.baseUrl}/emallMiniApp/address/city/${_prm.shopId}/${_prm.storeId}/${_prm.provinceId}/${_prm.deliveryType}`, _prm, 'GET', true).then(res => {
      let _rst = res.result || []
      _this.setData({
        newCity: _rst
      })
      // 如果是通过QQ地图获取当前位置，需要获取当前位置的市区
      if (_data.Isqqmap) {
        let Nval = _data.newValue
        Nval[1] = _this.getCurrentIdx(_rst, _data.city) || 0
        _this.setData({
          newValue: Nval,
          cacheNewValue: Nval
        })
        _this.getNewCounty(_rst[Nval[1]].id)
      } else {
        console.log(isSet)
        if (isSet) {
          //这里获取城市ID
          let cityId = _data.SetId[1]
          let Nval = _data.newValue
          _rst.map((item, i) => {
            if (item.id == cityId) {
              Nval[1] = i
            }
          })
          _this.setData({
            newValue: Nval,
            cacheNewCity: _rst,
            cacheNewValue: Nval
          })
        } else {
          _this.getNewCounty(_data.newCity[0].id)
        }
      }
    }).catch(res =>{})
  },
  getNewCounty(cityId) {//获取区县
    let _this = this
    let _data = _this.data
    // isSet-是否是修改地址
    let isSet = _data.IsSet
    let _gd = app.globalData
    let _prm = {
      shopId: _gd.shopId,
      storeId: _gd.storeId,
      cityId: cityId || '',
      deliveryType: _data.deliveryType,
      goodsId: _data.goodsId || ''
    }
    _this.setData({
      newCounty: []
    })
    utils.$http(`${_gd.baseUrl}/emallMiniApp/address/county/${_prm.shopId}/${_prm.storeId}/${_prm.cityId}/${_prm.deliveryType}`, _prm, 'GET', true).then(res => {
      //utils.globalShowTip(false)
      let _rst = res.result || []
      _this.setData({
        newCounty: _rst
      })
      // 如果是通过QQ地图获取当前位置，需要获取当前位置的区
      if (_data.Isqqmap) {
        let Nval = _data.newValue
        Nval[2] = _this.getCurrentIdx(_rst, _data.circle) || 0
        _this.setData({
          newValue: Nval,
          cacheNewValue: Nval
        })
        _this.getTownship(_rst[Nval[2]].id)
      } else {
        if (isSet) {
          //这里获取区县ID
          let CountId = _data.SetId[2]
          let Nval = _data.newValue
          _rst.map((item, i) => {
            if (item.id == CountId) {
              Nval[2] = i
            }
          })
          _this.setData({
            newValue: Nval,
            cacheNewCounty: _rst,
            cacheNewValue: Nval
          })
        } else {
          _this.getTownship(_data.newCounty[0].id)
        }
      }
    }).catch(res => {})
  },
  // 获取四级乡镇
  getTownship(areaId) {
    let _this = this
    let _data = _this.data
    // isSet-是否是修改地址
    let isSet = _data.IsSet
    let _gd = app.globalData
    let _prm = {
      shopId: _gd.shopId,
      storeId: _gd.storeId,
      cityId: areaId || '',
      deliveryType: _data.deliveryType,
      goodsId: _data.goodsId || ''
    }
    _this.setData({
      newRegion: [{ id: 0, name: '其他' }]
    })
    utils.$http(`${_gd.baseUrl}/emallMiniApp/address/county/${_prm.shopId}/${_prm.storeId}/${_prm.cityId}/${_prm.deliveryType}`, _prm, 'GET', true).then(res => {
      //utils.globalShowTip(false)
      let _rst = res.result.length ? res.result : [{id: 0,name: '其他'}]
      _this.setData({
        newRegion: _rst
      })
      if (isSet) {
        //这里获取乡镇ID
        let areasId = _data.SetId[3]
        let subval = _data.subValue
        _rst.map((item, i) => {
          if (item.id == areasId) {
            subval[0] = i
          }
        })
        _this.setData({
          subValue: subval,
          cacheRegion: _rst,
          cacheSubValue: subval,
          Isqqmap: false // 每次都关闭下是否QQ地图获取当前位置的判断
        })
      }
    }).catch(res => {})
  },
  bindNewChange(e) {
    this.setData({
      IsSet: false
    })
    let _data = this.data
    const val = e.detail.value
    if (val[0] !== _data.newValue[0]) {
      let proId = _data.newProvince[val[0]].id
      if (proId) {
        // 获取市
        this.getNewCity(proId)
      }
    } else if (val[1] !== _data.newValue[1]) {
      let cityId = _data.newCity[val[1]] && _data.newCity[val[1]].id
      if (cityId) {
        // 获取区县
        this.getNewCounty(cityId)
      }
    } else if (val[2] !== _data.newValue[2]) {
      let areaId =_data.newCounty[val[2]] && _data.newCounty[val[2]].id
      // 获取乡镇地址
      if (areaId) {
        this.getTownship(areaId)
      }
    }
    this.setData({
      newValue: val
    })
  },
  bindSubChange(e) {
    let _data = this.data
    const val = e.detail.value
    console.log(val)
    // _data.cusRegion1 = _data.newRegion[val[0]].areaName
    this.setData({
      IsSet: false,
      subValue: val
    })
  },
  // 省市区-弹出框取消及打开按钮
  togPickPop(e) {
    let _data = this.data
    this.setData({
      isshowPop: !_data.isshowPop
    })
    // 如果用户点击的是取消按钮
    if (e.currentTarget.dataset.cancel) {      
      if (_data.cacheNewProvince && _data.cacheNewProvince.length) {
        this.setData({
          newProvince: _data.cacheNewProvince,
          newCity: _data.cacheNewCity,
          newCounty: _data.cacheNewCounty,
          newValue: _data.cacheNewValue,
          newRegion: _data.cacheRegion || [{id: 0,name:'其他'}],
          subValue: _data.cacheSubValue
        })
      }
    }
  },
  // 省市区-弹出框确认按钮
  surePick() {
    let _data = this.data
    this.setData({
      isshowPop: false
    })
    _data.cacheNewProvince = _data.newProvince
    _data.cacheNewCity = _data.newCity
    _data.cacheNewCounty = _data.newCounty
    _data.cacheNewValue = _data.newValue
    _data.cacheRegion = _data.newRegion
    _data.cacheSubValue = _data.subValue
  },
  // 区域-开启及弹出框取消按钮
  togSubPop(e){
    this.setData({
      issubPop: !this.data.issubPop
    })
    console.log(e.currentTarget.dataset)
    // 如果用户点取消
    if (e.currentTarget.dataset.cancel) {
      let _data = this.data
      if (_data.cacheRegion && _data.cacheRegion.length) {
        this.setData({
          newRegion: _data.cacheRegion
        },()=>{
          this.setData({
            subValue: _data.cacheSubValue
          })
        })
      }
    }
  },
  // 区域-确认按钮
  sureSubPick(){
    let _data = this.data
    this.setData({
      issubPop: false
    })
    _data.cacheRegion = _data.newRegion
    _data.cacheSubValue = _data.subValue
  }
})