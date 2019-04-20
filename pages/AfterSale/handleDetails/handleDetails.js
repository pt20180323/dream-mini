const utils = require('../../../utils/util.js')
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ReturnAddress: '', // 返件地址
    ReturnVal: 0, // 返件方式下标
    ReturnList: [], // 返件集合
    ReturnData: [], // 返件方式名字集合
    partsAddress: '', // 取件地址
    partsVal: 0, // 取件方式下标
    partsData: [], // 取件方式集合
    addressId: null, // 获取地址Id 1。取件 2。返件
    ImgList: [], // 问题图片集
    ExpectType: null, // 10=退货，20=换货，30=维修
    detData: null, // 商品详情信息
    DescValue: 0, // 包装显示index
    DescData: ['无包装', '包装完整', '包装破损'], // 包装选择
    data: {
      customerContactName:null, // 联系人 ,
      customerExpect:null, // 服务类型 ,
      customerMobilePhone:null, // 联系电话 ,
      customerTel:null, // 手机号 ,
      detailNo:null, // 订单详情编号 ,
      orderDetailId:null, // 订单详情ID ,
      orderNo:null, // 订单编号 ,
      packageDesc: 0, // 包装描述0 无包装, 10包装完整, 20包装破损,
      pickwareAddress: null, // 取件详细地址 ,
      pickwareCityId:null, // 取件市 ,
      pickwareCountyId:null, // 取件县区 ,
      pickwareProvinceId:null, // 取件省 ,
      pickwareType: 4, // 取件方式：4 上门取件 ，7客户送货，40客户发贷,
      pickwareVillageId:null, // 取件乡镇街道 ,
      questionDesc:'', // 问题描述 ,
      questionPic:'', // 问题描述图片 ,
      returnwareAddress: null, // 返件详细地址,
      returnwareVillageId: null, // 返件乡镇 ,
      returnwareCityId:null, // 返件市,
      returnwareCountyId:null, // 返件县区 ,
      returnwareProvinceId:null, // 返件省 ,
      returnwareType: 10, // 返件类型 自营配送(10), 第三方配送(20);换、修这两种情况必填（默认值） ,
      skuNum:null, // 售后申请数量 ,
      supplierId: null, // 供应链商品ID
      supplierSkuId:null // 供应链商品skuID
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {
    let {data} = this.data
    let detData = wx.getStorageSync('detData') || ''
    let { detailNo, orderDetailId, orderNo, total, supplierSkuId, supplierId, supOrderNo } = detData
    // 设置提交参数
    data.detailNo = detailNo
    data.orderDetailId = orderDetailId
    data.orderNo = orderNo
    data.skuNum = total
    data.supplierSkuId = supplierSkuId
    data.supplierId = supplierId
    data.thirdOrderId = supOrderNo
    this.setData({
      ExpectType: opt.id,
      'data.customerExpect': opt.id,
      detData,
      data
    })
    // 获取取件方式
    this.getWareReturn()
    // 获取返件方式
    this.getWareReturnType()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置地址
    this.setAddress()
  },
  // 提交按钮
  submit() {
    let that = this
    let { data, ImgList, ExpectType } = that.data
    // 如果不是退货需要判断返件地址是否为空
    if (!data.pickwareProvinceId) {
      utils.globalToast('请选择取件地址', 'none')
      return false
    }
    // 如果不是退货需要判断返件地址是否为空
    if (ExpectType != 10 && !data.returnwareProvinceId) {
      utils.globalToast('请选择返件地址', 'none')
      return false
    }
    if (!data.customerContactName.trim()) {
      utils.globalToast('请填写联系人', 'none')
      return false
    }
    if (!data.customerTel.trim()) {
      utils.globalToast('请填写联系号码', 'none')
      return false
    }
    // 验证手机号码
    let IsPhone = /^1(3|4|5|7|8)\d{9}$/
    if (!IsPhone.test(data.customerTel)) {
      utils.globalToast('联系号码错误', 'none')
      return false
    }
    // 图片ID转成string以逗号分隔
    data.questionPic = ImgList.map(item => item.pictureId).join()
    // 调用提交接口
    that.submitRequest(data)
  },
  // 提交接口
  submitRequest(data) {
    let that = this
    utils.globalShowTip(true)
    let { baseUrl } = app.globalData
    utils.$http(`${baseUrl}/emallMiniApp/chainAfterSale/afterSaleApply`, data, 'POST').then(res => {
      utils.globalShowTip(false)
      let _rst = res && res.code == 0 && res.result
      if (_rst) {
        wx.redirectTo({
          url: '../serviceSale/serviceSale?applyId=' + _rst.applyAfterSaleId
        })
      } else {
        utils.globalToast('提交申请失败！', 'none')
      }
    })
  },
  // 联系人输入变化
  changeUserName(e) {
    this.setData({
      'data.customerContactName': e.detail.value
    })
  },
  // 联系号码输入变化
  changeUserPhone(e) {
    this.setData({
      'data.customerTel': e.detail.value
    })
  },
  // 设置地址
  setAddress() {
    let that = this
    let { addressId, ReturnAddress, data } = that.data
    let { sendAddObj, updateAddr } = app.globalData
    let addressName = ''
    if (updateAddr && sendAddObj && addressId) {
      if (sendAddObj.region) {
        addressName = sendAddObj.region
      } else {
        // 省
        addressName += sendAddObj.province.indexOf('省') == -1 ? `${sendAddObj.province}省` : sendAddObj.province
        addressName += sendAddObj.city
        addressName += sendAddObj.circle
        addressName += sendAddObj.area
        addressName += sendAddObj.address
      }
      // 赋值联系人
      if (!data.customerContactName && !data.customerTel) {
        data.customerContactName = sendAddObj.tackName
        data.customerTel = sendAddObj.tackPhone
      }
      let { address, areaId, cityId, circleId, provinceId } = sendAddObj
      // 如果addressId = 1 就是取件地址 否者是返件地址
      if (addressId == 1) {
        // 设置取件地址
        data.pickwareAddress = address
        data.pickwareVillageId = areaId
        data.pickwareCountyId = circleId
        data.pickwareCityId = cityId
        data.pickwareProvinceId = provinceId
        if (!ReturnAddress) {
          // 设置返件地址
          data.returnwareAddress = address
          data.returnwareVillageId = areaId
          data.returnwareCountyId = circleId
          data.returnwareCityId = cityId
          data.returnwareProvinceId = provinceId
        }
        that.setData({
          partsAddress: addressName, // 页面显示的取件地址
          ReturnAddress: ReturnAddress ? ReturnAddress : addressName, // 如果没有返件地址，先把取件地址赋值上
        })
      } else {
        // 设置返件地址
        data.returnwareAddress = address
        data.returnwareVillageId = areaId
        data.returnwareCountyId = circleId
        data.returnwareCityId = cityId
        data.returnwareProvinceId = provinceId
        that.setData({ ReturnAddress: addressName })
      }
      that.setData({ addressId: null, data })
    }
  },
  // 选择返件方式
  addressReturnChange(e) {
    let {ReturnList} = this.data
    let i = e.detail.value
    this.setData({
      ReturnVal: i,
      'data.returnwareType': ReturnList[i].code
    })
  },
  // 选择取件方式
  addressPickerChange (e) {
    let i = e.detail.value
    let {wareList} = this.data
    this.setData({
      partsVal: i,
      'data.pickwareType': wareList[i].code
    })
  },
  // 获取取件地址
  getAddress(e) {
    let i = e.currentTarget.dataset.i
    this.setData({ addressId:i})
    wx.navigateTo({
      url: '../../mine/address/select/select',
    })
  },
  // 删除图片
  delImg(e) {
    let i = e.currentTarget.dataset.index
    let { ImgList } = this.data
    ImgList.splice(i, 1)
    this.setData({ ImgList})
  },
  // 上传图片
  bindAddImg() {
    let that = this
    let {ImgList} = that.data
    // 调用获取手机图片API
    wx.chooseImage({
      count: 4 - ImgList.length, // 问题描述图片不能大于4张
      sizeType: 'original',
      sourceType: ['album', 'camera'],
      success(res) {
        const imgs = res.tempFilePaths
        imgs.map(item => {
          // ImgList.push(item)
          that.UploadImg(item)
        })
      }
    })
  },
  // 上传图片
  UploadImg(filePath) {
    let that = this
    let { ImgList, data } = that.data
    let { shopId, storeId, baseUrl} = app.globalData
    utils.globalShowTip(true)
    wx.uploadFile({
      header: {"Content-Type": "multipart/form-data"},
      url: `${baseUrl}/emallMiniApp/refund/uploadRefundPic/${shopId}/${storeId}`,
      filePath: filePath,
      name: 'myPic',
      formData: {},
      success: (res) => {
        let resData = res && res.data && JSON.parse(res.data)
        if (resData && resData.result && resData.code == 0) {
          let { pictureId, picPath } = resData.result
          ImgList.push({picPath, pictureId})
          that.setData({ data, ImgList})
        } else {
          utils.globalToast(resData.errors || resData.message, 'none')
        }
        utils.globalShowTip(false)
      },
      fail: () => {
        utils.globalToast('上传图片失败，请重新上传', 'none')
        utils.globalShowTip(false)
      }
    })
  },
  // 用户输入的问题描述
  textChange(e) {
    this.setData({
      'data.questionDesc': e.detail.value
    })
  },
  // 包装选择
  DescPickerChange(e) {
    // 包装描述 0-无包装 ,10-包装完整,20-包装破损 ,
    let DescValues = [0, 10, 20]
    let i = e.detail.value
    this.setData({
      DescValue: i,
      'data.packageDesc': DescValues[i]
    })
  },
  // 获取返件方式
  getWareReturnType() {
    let that = this
    let { storeId, baseUrl } = app.globalData
    let { detData, ReturnData } = that.data
    utils.$http(`${baseUrl}/emallMiniApp/chainAfterSale/getWareReturnType/${detData.supplierId}/${detData.supOrderNo}/${detData.supplierSkuId}`, {}).then(res => {
      utils.globalShowTip(false)
      let _rst = res && res.result
      if (_rst) {
        console.log(_rst)
        _rst.map(item => {
          ReturnData.push(item.name)
        })
        let ReturnList = _rst
        that.setData({ ReturnData, ReturnList })
      }
    })
  },
  // 获取取件方式
  getWareReturn() {
    let that = this
    let { storeId, baseUrl } = app.globalData
    let { detData, partsData } = that.data
    utils.$http(`${baseUrl}/emallMiniApp/chainAfterSale/getWareReturn/${detData.supplierId}/${detData.supOrderNo}/${detData.supplierSkuId}`, {}).then(res => {
      utils.globalShowTip(false)
      let _rst = res && res.result
      if (_rst) {
        console.log(_rst)
        _rst.map(item => {
          partsData.push(item.name)
        })
        let wareList = _rst
        that.setData({ partsData, wareList})
      }
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.removeStorageSync('detData')
  }
})