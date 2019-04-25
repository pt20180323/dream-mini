const utils = require('../../utils/util.js')
let app = getApp()
Page({
    data: {
      slideUp: false,
      isloaded: false
    },
    onShow(){
      let _this = this
      app.checkUserId(_this.initData)
    },
    initData(){
      app.linecarCount()
      this.getCartList()
    },
    getCartList(){
      const _this = this
      let { baseUrl, shopId, storeId} = app.globalData
      let _url = `${baseUrl}/emallMiniApp/linecar/list/${shopId}/${storeId}`
      utils.$http(_url, {}).then(res => {
        utils.globalShowTip(false)
        let _rst = (res && res.result) || false
        console.log(_rst)
        if (_rst && _rst.linecarStoreGroupResponseList && _rst.linecarStoreGroupResponseList.length) {
          _this.setData({
            isloaded: true,
            cartlist: _rst.linecarStoreGroupResponseList,
            memberLevel: _rst.memberLevel,
            isPaidMember: _rst.paidMember
          })
        } else {
          _this.setData({
            isloaded: false
          })
        }
      }).catch(res => {
      })
    },
    editCart(params, select){//select是否调用选择的接口（布尔值）
      console.log(params)
      const _this = this
      let { baseUrl, shopId, storeId} = app.globalData
      let _url = `${baseUrl}/emallMiniApp/linecar/${select ? 'selected' : 'edit'}/${shopId}/${storeId}`
      utils.$http(_url, params, 'POST', false,'JSON').then(res => {
        console.log(res)
        this.closeSlide()
        _this.getCartList()
      }).catch(res => {})
    },
    getSkuTree(e) { //获取商品的sku属性
      let dst = e.currentTarget.dataset
      let _this = this
      let url = `${app.globalData.baseUrl}/emallMiniApp/goods/detail/skuTree/${dst.shop}/${dst.store}/${dst.goods}`
      console.log(dst.detail)
      _this.setData({
        goodsDetail: dst.detail || {}
      })
      utils.$http(url, {skuId: dst.sku || ''}).then(res => {
        if (res) {
          utils.globalShowTip(false)
          _this.renderSkuTree(res)
        }
      }).catch(res => {})
    },
    renderSkuTree(res){ //渲染skuTree
      console.log(res)
      let _this = this
      if (res) {
        let _rst = res.result
        let goods = _this.data.goodsDetail
        let arry = []
        let skuArry = [] //获取当前skuId的对应项
        for (let item in _rst.skuIdMap) { //重写skuIdMap值
          arry.push({ key: item, skuId: _rst.skuIdMap[item] })
        }
        console.log(arry)
        let skuMap = _rst.skuMap
        let _skuShow = [] //初始的sku值
        for (let item in skuMap) {
          let _item = skuMap[item]
          skuArry.push(_item)
          if (_item.skuId === goods.skuId) {
            _skuShow = _item
          }
        }
        console.log(_skuShow)
        console.log(skuArry)
        _this.setData({
          optionList: _rst.showAttributeList,
          skuList: skuArry,
          showSku: _skuShow,
          attrLinkList: arry, //组合后得到的skuId
          slideUp: true
        })
      }
    },
    selectAttr (evt) {
      let dst = evt.target.dataset
      let idx = dst.list
      let sidx = dst.sidx
      let _list = this.data.optionList
      _list[idx].cur = sidx
      let isAll = false
      _list.forEach((itm)=>{
        if (itm.cur !== '') {
          isAll = true
        } else {
          isAll = false
        }
      })
      let _sku = []
      if (isAll) {
        let _arr = []
        let str = ''
        _list.forEach((itm)=>{
          if (itm.cur || itm.cur === 0) {
            _arr.push(itm.attributeOptionList[itm.cur].optionId)
            str = _arr.join('@')
          }
        })
        _sku = this.data.attrLinkList.filter((item)=>{
          return item.key === str
        })
      }
      //console.log(this.data.attrLinkList)
      let showSkuArry = this.data.skuList.filter(item => {
        if (_sku.length) {
          return item.skuId === _sku[0].skuId
        }
      })
      console.log(_list)
      this.setData({
        optionList: _list,
        showSku: showSkuArry[0] || {}
      })
      console.log(this.data.showSku)
    },
    moveItem(e){
      console.log(e)
    },
    getMaxObj(obj){
      let msg = '库存不足' //限购提示
      let _rem = obj.remain //剩余库存
      let max = _rem //最大限购数
      let glimit = obj.goodsLimit //普通商品限购
      let alimit = obj.actLimit //活动商品限购
      if(alimit){ //优先判断活动
        let amaxbuy = alimit.maxBuyNumber
        if (amaxbuy < max){
          msg = alimit.limitMsg
          max = amaxbuy
        }
      }
      if(glimit){
        let gmaxbuy = glimit.maxBuyNumber
        if (gmaxbuy < max) {
          msg = glimit.limitMsg
          max = gmaxbuy
        }
      }
      this.setData({
        limitMsg: msg
      })
      console.log(max)
      return max
    },
    togNum(evt){
      let dst = evt.target.dataset
      let _this = this
      let _data = _this.data
      let _list = _data.cartlist
      let _item = _list[dst.item][dst.str].linecarSupplierGroupList[dst.groupi].linecarResponseList[dst.sitem]
      let max = _this.getMaxObj({
        remain: _item.goodsSkuResponse ? _item.goodsSkuResponse.stock : 1000000, //库存
        goodsLimit: _item.goodsLimitBuyResponse,
        actLimit: _item.activityLimitBuyResponse
      })
      let _type = parseInt(dst.type)
      let _num = _item.numbers
      console.log(_num, max, _item.goodsLimitBuyResponse)
      if(_type === 1){
        if(_num === max){
          wx.showToast({
            title: _data.limitMsg,
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        if(max > 0){
          _num = _num < max ? ++_num : max
        }
      }else{
        if(_num === 1){
          wx.showToast({
            title: '至少购买一件商品',
            icon: 'none',
            mask: true,
            duration: 1500
          })
          return false
        }
        _num = _num <= 1 ? _num : --_num
      }
      _this.editCart([{
        linecarId: dst.cart,
        goodsId: dst.goods,
        skuId: dst.sku,
        numbers: _num
      }])
    },
    numChange(evt){
      let _this = this
      let _data = _this.data
      let _v = evt.detail.value
    },
    iptBlur(evt){
      let dst = evt.target.dataset
      let _this = this
      let _data = _this.data
      let _list = _data.cartlist
      let _item = _list[dst.item][dst.str].linecarSupplierGroupList[dst.groupi].linecarResponseList[dst.sitem]
      let max = _this.getMaxObj({
        remain: _item.goodsSkuResponse.stock, //库存
        goodsLimit: _item.goodsLimitBuyResponse,
        actLimit: _item.activityLimitBuyResponse
      })
      let _num = parseInt(evt.detail.value)
      if(!_num){
        _this.setData({
          cartlist: _data.cartlist
        })
        return false
      }
      if (_num > max) {
        _num = max
      }
      _this.editCart([{
        linecarId: dst.cart,
        goodsId: dst.goods,
        skuId: dst.sku,
        numbers: _num
      }])
    },
    popTogNum(evt){
      let dst = evt.target.dataset
      let _this = this
      let _data = _this.data
      let _type = parseInt(dst.type)
      let max = _data.showSku.stock || _data.goodsDetail.goodsSkuResponse.stock
      let _num = _data.popNum || _data.goodsDetail.numbers
      if (_type === 1) {
        if (_num === max) {
          return false
        }
        _num = _num < max ? ++_num : max
      } else {
        if (_num === 1) {
          return false
        }
        _num = _num <= 1 ? _num : --_num
      }
      _this.setData({
        popNum: _num
      })
    },
    popIptChange(evt){
      let _this = this
      let _data = _this.data
      let _v = evt.detail.value
      _this.setData({
        popNum: _v //Math.max(_v, 1)
      })
    },
    popIptBlur(evt){
      let dst = evt.target.dataset
      let _data = this.data
      let _num = parseInt(evt.detail.value) || 1
      let max = _data.showSku.stock || _data.goodsDetail.goodsSkuResponse.stock
      this.setData({
        popNum: Math.min(max,_num)
      })
    },
    showProp(){ //弹出属性选择框
      this.setData({
        slideUp: true
      })
    },
    closeSlide() {//关闭属性选择框
      this.setData({
        slideUp: false
      })
      setTimeout(()=>{
        this.setData({
        popNum: 0
      })
      },300)
    },
    sureEdit(e){//确认更改购物车
      console.log(e)
      let _data = this.data
      let _goods = _data.goodsDetail
      this.editCart([{
        linecarId: _goods.linecarId,
        goodsId: _goods.goodsId,
        skuId: _data.showSku.skuId || _goods.goodsSkuResponse.skuId,
        numbers: _data.popNum || _goods.numbers
      }])
    },
    selectAll(evt){//全选
      let _this = this
      let {cartlist} = _this.data
      let { carti, str, groupi} = evt.currentTarget.dataset
      cartlist.map((item, i) => {//遍历整个购物车列表
        if (i != carti) return false
        Object.keys(item).map(key => {// 配送方式列表
          if (key != str || !item[key]) return false
          item[key]['linecarSupplierGroupList'].map((Supitem, Supi) => {// 供应商列表
            if (Supi != groupi) return false
            Supitem.linecarResponseList.map(GoodsItem => {// 供应商下商品列表
              // 设置商品是否选中
              GoodsItem.selected = !Supitem.isAllSelected
            })
            // 设置全选按钮
            Supitem.isAllSelected = !Supitem.isAllSelected
          })
        })
      })
      _this.setData({cartlist})
      _this.editCart(_this.getSelectItem(str, carti, groupi), true)
    },
    selectItem(evt){//单选
      let _this = this
      let {cartlist} = _this.data
      // idx-购物车列表点击下标，sidx-当前点击商品列表下标，str-当前点击配送方式key、groupi-当前点击供应商下标
      let { sidx, idx, str, groupi} = evt.currentTarget.dataset
      cartlist.map((item, i) => {//购物车列表
        if (i != idx) return false
        Object.keys(item).map(key => {// 配送方式
          if (str != key || !item[key]) return false // 如果不是当前配送方式 或 item[key]为空、就返回
          item[key]['linecarSupplierGroupList'].map((Supitem, SupI) => {//供应商列表
            if (SupI != groupi) return false // 如果不是当前供应商就返回
            Supitem['linecarResponseList'].map((ResItem, ResI) => {//供应商商品列表
              if (ResI != sidx) return false //如果不是当前商品
              ResItem.selected = !Boolean(ResItem.selected)
            })
          })
        })
      })
      _this.setData({cartlist})
      _this.editCart(_this.getSelectItem(str, idx, groupi), true)
    },
    getSelectItem(str, idx, groupi = false) {// str 当前点击的配送方式 idx 当前点击的下标 groupi 当前点击的供应商下标
      let { cartlist } = this.data
      let _arr = [] //列表选中项
      cartlist.map((item, i) => {//购物车列表
        if (i != idx) return false // 如果不是当前下标的列表，就返回
        Object.keys(item).map(key => { // 配送方式列表
          if (key != str || !item[key]) return false // 如果当前配送方式和点击的配送方式不一致，就返回
          // 找到当前点击配送方式下的购物车信息
          let SupList = item[key]['linecarSupplierGroupList']
          SupList.map((SupItem, Supi) =>{// 供应商列表
            if (groupi != Supi) return false
            SupItem.linecarResponseList.map(GoodsItem => {//供应商下商品列表
              let { linecarId, goodsId, skuId, numbers } = GoodsItem
              // 如果是已下架的商品，全部返回
              if (str == 'expireLinecar') {
                _arr.push({ linecarId, goodsId, skuId, numbers })
              } else {
                if (GoodsItem.selected) {
                  _arr.push({ linecarId, goodsId, skuId, numbers })
                }
              }
            })
          })
        })
      })
      console.log(_arr)
      return _arr
    },
    // 删除商品
    removeCart(e){
      let { idx, str, groupi} = e.currentTarget.dataset
      let that = this
      let ids = that.getSelectItem(str, idx, groupi)
      this.sureRemoveCart(ids)
    },
    // 删除所选的所选商品
    sureRemoveCart(ids){
      const _this = this
      let { baseUrl, shopId, storeId} = app.globalData
      if (!ids.length){
        utils.globalToast('至少选择一件商品', 'none', 1500)
        return false
      }
      let cards = ids.map((item) => item.linecarId)
      let _url = `${baseUrl}/emallMiniApp/linecar/remove/${shopId}/${storeId}`
      let params = {
        shopId,storeId,
        linecarIds: cards.join(',')
      }
      utils.$http(_url, params, 'POST').then(res => {
        console.log(res)
        utils.globalShowTip(false)
        _this.getCartList()
      }).catch(res => {})
    },
    gotoOrder(evt){
      console.log(evt)
      let _dst = evt.currentTarget.dataset
      let _lidx = parseInt(_dst.lidx)
      let settle = parseInt(_dst.settle)
      if(settle){
        const _this = this
        let _global = app.globalData
        let _arr = _this.getSelectItem(false, _lidx)
        let cards = []
        _arr.forEach((item) => {
            cards.push(item.linecarId)
        })
        let _url = `${_global.baseUrl}/emallMiniApp/linecar/settle/${_global.shopId}/${_global.storeId}`
        let params = {
          shopId: _global.shopId,
          storeId: _global.storeId,
          linecarIds: cards.join(',')
        }
        utils.$http(_url, params, 'POST').then(res => {
          console.log(res)
          utils.globalShowTip(false)
          wx.navigateTo({
            url: '/pages/commonshop/orderInfor/orderInfor?iscart=1'
          })
        }).catch(res => {})
      }
    }
})