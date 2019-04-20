const utils = require('../../../utils/util.js')
let app = getApp()
Page({
  data: {
    picFlag: false,
    listType: '', //列表展示类型：1大图/2中图/3小图1/4小图2/5分类1
    floatBar: 1, //商品列表浮动栏展示 1=展示排序 2=展示分类
    picTypeList: [], // 图片类型list
    categoryList: [], // 一级分类
    defaultCategory: '0',
    level: 0,
    navTab: 0,
    sortFlag: '', //排序状标识 0上架时间 1销量 2价格 3推荐
    asc: 0, //是否升序  0降序 1升序
    sortList: [], //排序列表
    goodsList: [], // 商品列表
    isshowEmpty: false, // 判断商品列表是否为空
    isLastPage: false,
    pageNo: 1,
    flag: false, //默认升序
    isRequest: false,
    loading: false,
    noMsg: '暂无商品',
    tabLoad: false,
    clerkShare:null//是否店员分享途径进来
  },
  onLoad(opt) {
    let _this = this
    this.setData({
      storeId: opt.storeId || '',
      shopId: opt.shopId || '',
      clerkShare: opt.clerkShare||''
    })
    let res = wx.getSystemInfoSync()
    this.setData({
      windowHeight: res.windowHeight - 60, //减去导航和缝隙的高度
    })
    app.checkUnionId(this.initData)
    setTimeout(function() {
      _this.data.tabLoad = true
    }, 1000)
  },
  onShow() {
    let _this = this
    let _global = app.globalData
    let {
      categoryId,
      goodsName,
      priceDouble,
      modelCode
    } = _global
    if (categoryId) { // 点击分类搜索
      _this.setData({
        categoryId: categoryId,//搜索页点击的分类id
        goodsName: '', //名称
        priceDouble: '', //价格
        modelCode: '' //货号
      })
      _this.initData()
      _this.closeCategoryList() //关闭以前展开的分类
      _this.openCategoryList() //打开当前点击的分类
      if (categoryId === '0' && _this.data.floatBar === 2) {
        _this.setData({
          navTab: ''
        })
      }
    } else if (goodsName) {
      // 按照输入框名称搜索
      _this.setData({
        categoryId: '',
        goodsName: goodsName,
        priceDouble:'',
        modelCode: '',
        defaultCategory: '0' //默认一级分类为0时页面样式选中全部分类
      })
      _this.initData()
      _this.closeCategoryList() //关闭以前展开的分类
    } else if (priceDouble) { // 按照输入框价格搜索
      _this.setData({
        categoryId: '',
        priceDouble: priceDouble,
        goodsName: '',
        modelCode: '',
        defaultCategory: '0'
      })
      _this.initData()
      _this.closeCategoryList() //关闭以前展开的分类
    } else if (modelCode) { // 按照输入框货号搜索
      _this.setData({
        categoryId: '',
        modelCode: modelCode,
        goodsName: '',
        priceDouble: '',
        defaultCategory: '0'
      })
      _this.initData()
      _this.closeCategoryList() //关闭以前展开的分类
    } else { //点击导航商品列表正常展示商品列表
      _this.setData({
        categoryId: _global.categoryId || '',
        themeId: _global.themeId || '',
        defaultCategory: '0',
        modelCode: '',
        goodsName: '',
        priceDouble: '',
      })
    }
    // 释放在搜索页带到商品列表页存入globalData中的数据
    _global.categoryId1 = ''
    _global.categoryId2 = ''
    _global.categoryId = ''
    _global.level = ''
    _global.goodsName = ''
    _global.priceDouble = ''
    _global.modelCode = ''
  },
  onTabItemTap(item) {
    if (this.data.tabLoad) {
      wx.showNavigationBarLoading()
      this.setData({
        pageNo: 1,
        loading: true
      }, () => {
        this.getGoodList()
        app.linecarCount()
      })
      setTimeout(function() {
        wx.hideNavigationBarLoading()
      }, 1000)
    }
  },
  onPullDownRefresh: function() {
    wx.showNavigationBarLoading()
    this.setData({
      loading: true,
      pageNo: 1
    }, () => {
      this.getGoodList()
      app.linecarCount()
    })
    setTimeout(function() {
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }, 1000)
  },
  onHide() {
    let {
      behaviorId
    } = this.data
    if (behaviorId) {
      app.reanderZjLeave(2, behaviorId)
    }
  },
  initData() {
    let _this = this
    let {
      storeId
    } = _this.data
    let _global = app.globalData
    // if (_global.businessModel && storeId && storeId !== _global.storeId) {
    //   wx.showModal({
    //     title: '温馨提示',
    //     content: '门店不一致，请切换所属门店',
    //     showCancel: false,
    //     success() {
    //       _this.setData({
    //         storeId: _global.storeId,
    //         shopId: _global.shopId
    //       })
    //       wx.switchTab({
    //         url: '/pages/home/home'
    //       })
    //     }
    //   })
    //   return
    // }
    _this.setData({
      userType: _global.userType
    })
    app.reanderZj(4).then(res => {
      _this.setData({
        behaviorId: res
      })
    })
    _this.getGoodList()
    app.linecarCount()
  },
  onReachBottom() {
    const _this = this
    if (!_this.data.isRequest) {
      return false
    }
    if (!_this.data.isLastPage) {
      _this.setData({
        loading: 1
      }, () => {
        _this.getList(_this.data.pageNo + 1)
      })
    }
  },
  toDetail(opt) {
    const _this = this
    let {
      type,
      gid,
      aid,
      sid,
      stid
    } = opt.currentTarget.dataset
    if (type === 7) { //秒杀
      wx.navigateTo({
        url: '/pages/secondshop/productDetail/productDetail?activityId=' + aid + '&goodsId=' + gid + '&clerkShare=' + _this.data.clerkShare
      })
    } else if (type === 12) { //抱团
      wx.navigateTo({
        url: '/pages/teamshop/productDetail/productDetail?activityId=' + aid + '&goodsId=' + gid + '&storeId=' + stid + '&clerkShare=' + _this.data.clerkShare
      })
    } else {
      wx.navigateTo({
        url: '/pages/commonshop/productDetail/productDetail?goodsId=' + gid + '&storeId=' + stid + '&shopId=' + sid + '&clerkShare=' + _this.data.clerkShare
      })
    }
  },
  // 点击导航查询商品列表
  changeTab: function(opt) {
    let _this = this
    let {
      type,
      id,
      flag
    } = opt.currentTarget.dataset
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    _this.setData({
      navTab: type,
      goodsName: '',
      priceDouble: '',
      modelCode: ''
    })
    if (id) {
      wx.navigateTo({
        url: '../search/search?categoryId=' + id,
      })
    } else {
      _this.setData({
        flag: !flag,
        sortFlag: type
      })
      let arry = _this.data.sortList.map((item, index) => {
        if (index === type) {
          item.flag = _this.data.flag
        }
        return item
      })
      _this.setData({
        sortList: arry
      })
      if (_this.data.flag) {
        _this.setData({
          asc: 1
        })
      } else {
        _this.setData({
          asc: 0
        })
      }
      _this.getList()
    }
  },
  clickSearch: function() {
    wx.navigateTo({
      url: '../search/search',
    })
  },
  // 获取商品显示列表
  getGoodList: function() {
    let _this = this
    let _data = _this.data
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    utils.$http(baseUrl + '/emallMiniApp/goods/goodsShows/' + shopId + '/' + storeId, {}, '', '1').then(res => {
      if (res) {
        if (res.result.length) {
          let defaultObj = res.result.find(item => item.isDefault === 1) // 默认显示
          if (!defaultObj) {
            //默认为分类1
            _this.setData({
              listType: res.result[0].showType,
              floatBar: res.result[0].floatBar,
            })
          } else {
            _this.setData({
              listType: defaultObj.showType,
              floatBar: defaultObj.floatBar
            })
          }
          _this.setData({
            picTypeList: res.result
          })
          if (_this.data.floatBar === 2) {
            _this.setData({
              navTab: ''
            })
          }
        } else {
          //只有分类1
          _this.setData({
            listType: 5
          })
          return
        }
        _this.getGradeList()
      }
    })
  },
  // 获取商品列表
  getList: function(pageNo) {
    let _this = this
    let _data = _this.data
    _this.setData({
      pageNo: pageNo || 1,
      isRequest: false
    })
    // 路径上的参数
    let {
      baseUrl,
      shopId,
      storeId
    } = app.globalData
    //？携带参数
    let _params = {
      pageSize: 10,
      themeId: _data.themeId || '',
      goodsName: _data.goodsName || '',
      priceDouble: _data.priceDouble || '',
      modelCode: _data.modelCode || '',
      asc: _data.asc
    }
    if (_data.sortFlag || _data.sortFlag === 0) {
      _params.sortFlag = _data.sortFlag
    }
    utils.$http(baseUrl + '/emallMiniApp/goods/list/' + shopId + '/' + storeId + '/' + (_data.categoryId || '0') + '/' + _data.listType + '/' + _data.pageNo, _params, 'POST', _data.loading).then(res => {
      if (res) {
        utils.globalShowTip(false)
        _this.setData({
          isLastPage: !res.result.hasNextPage,
          isRequest: true,
          loading: false
        })
        res.result.result = res.result.result.filter(item => item.activityType !== 8) //过滤掉预售
        if (_data.pageNo === 1) {
          _this.setData({
            goodsList: res.result.result
          })
        } else {
          _this.setData({
            goodsList: _data.goodsList.concat(res.result.result)
          })
        }
        if (!_data.goodsList.length) {
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
  // 获取分类列表
  getGradeList: function(id) {
    let _this = this
    let _data = _this.data
    let arry = []
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId
    }
    let _params = {
      categoryId: id || 0
    }
    utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, _params, '', 1).then(res => {
      if (res) {
        _this.setData({
          categoryList: res.result
        })
        // 判断导航排序是按照销量时间价格  还是按照分类
        if (_this.data.floatBar === 1) {
          // 展示排序
          arry = [{
            categoryName: '时间',
            flag: false
          }, {
            categoryName: '销量',
            flag: false
          }, {
            categoryName: '价格',
            flag: false
          }]
        }
        if (_this.data.floatBar === 2) {
          // 展示分类
          arry = _this.data.categoryList
        }
        _this.setData({
          sortList: arry
        })
        _this.getList()
      }
    })
  },
  clickChangePic: function() {
    let _this = this
    _this.setData({
      picFlag: !_this.data.picFlag
    })
  },
  // 点击更换图片显示商品类型
  toggerPicType: function(opt) {
    let {
      showType
    } = opt.currentTarget.dataset
    let _this = this
    _this.setData({
      picFlag: false,
      listType: showType,
      categoryId: '0', //请求所有数据
      defaultCategory: '0' // 分类选中全部
    })
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    _this.closeCategoryList() //合上以前的分类
    _this.getList()
  },
  // 切换分类列表
  changeGrade: function(e) {
    let _this = this
    let _data = _this.data
    let {
      idx,
      index,
      indexsub,
      level,
      hassub
    } = e.currentTarget.dataset
    level = parseInt(level)
    let _list = _this.data.categoryList
    _this.setData({
      categoryId: idx,
      level: level,
      goodsName: '',
      priceDouble: '',
      modelCode: ''
    })
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId,
      categoryId: _data.categoryId || ''
    }
    //点击全部
    if (level === 0) {
      _this.setData({
        defaultCategory: idx,
        defaultCategory2: '',
        defaultCategory3: ''
      })
      if (_this.data.floatBar === 2) {
        _this.setData({
          navTab: ''
        })
      }
      _this.getGradeList(params.categoryId)
      return
    }
    //点击一级分类
    if (level === 1) {
      _this.setData({
        defaultCategory: idx,
        defaultCategory2: '',
        defaultCategory3: ''
      })
      if (_this.data.floatBar === 2) {
        _this.setData({
          navTab: index
        })
      }
      if (!_list[index].sub) {
        utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, params).then(res => {
          if (res) {
            let _rst = res.result
            utils.globalShowTip(false)
            _list[index].sub = _rst
            _list.forEach((itm, i) => {
              if (index === i) {
                itm.open = true
              } else {
                itm.open = false
              }
            })
            this.setData({
              categoryList: _list
            })
          }
        }).catch(err => {
          utils.globalShowTip(false)
        })
      } else {
        _list.forEach((itm, i) => {
          if (index === i) {
            itm.open = !itm.open
          } else {
            itm.open = false
          }
        })
        this.setData({
          categoryList: _list
        })
      }
    }
    // 点击二级分类
    if (level === 2) {
      _this.setData({
        defaultCategory2: idx,
        defaultCategory3: ''
      })
      if (!_list[index].sub[indexsub].sub) {
        utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, params).then(res => {
          if (res) {
            let _rst = res.result
            utils.globalShowTip(false)
            _list[index].sub[indexsub].sub = _rst
            _list[index].sub.forEach((itm, i) => {
              if (indexsub === i) {
                itm.open = true
              } else {
                itm.open = false
              }
            })
            this.setData({
              categoryList: _list
            })
          }
        }).catch(err => {
          utils.globalShowTip(false)
        })
      } else {
        _list[index].sub.forEach((itm, i) => {
          if (indexsub === i) {
            itm.open = !itm.open
          } else {
            itm.open = false
          }
        })
        this.setData({
          categoryList: _list
        })
      }
    }
    // 点击三级分类
    if (level === 3) {
      _this.setData({
        defaultCategory3: idx
      })
    }
    // 判断没有下一级才去请求商品列表
    if (!hassub) {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      })
      _this.getList()
    }
  },
  //从搜索页点击分类进入商品列表页 默认打开对应的分类
  openCategoryList: function() {
    let _this = this
    let _data = this.data
    let index = app.globalData.index // 获取点击一级分类的下标
    let categoryId = _data.categoryId // 获取搜索页点击的分类的id 点击的最后一级
    let categoryId1 = app.globalData.categoryId1
    let categoryId2 = app.globalData.categoryId2
    let level = app.globalData.level //获取点击的级数
    let list = this.data.categoryList
    if (_data.floatBar === 2) {
      _this.setData({
        navTab: index
      })
      app.globalData.index = ''
    }
    let params = {
      shopId: app.globalData.shopId,
      storeId: app.globalData.storeId
    }
    // 遍历一级分类 找到与搜索页对应点击的一级分类 -> 打开(二级分类显示出来)
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === categoryId1) {
        list[i].open = true
        // 判断一级分类下二级分类是否存在 如果存在 遍历找到对应搜索页点击的二级分类 -> 打开(三级分类显示出来)
        if (list[i].sub && list[i].sub.length) {
          for (let j = 0; j < list[i].sub.length; j++) {
            if (list[i].sub[j].id === categoryId2) {
              list[i].sub[j].open = true
              // 判断三级分类是否存在 如果存在直接就会显示  如果不存在根据二级分类id发请求获取
              if (!list[i].sub[j].sub || !list[i].sub[j].sub.length) {
                params.categoryId = categoryId2
                utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, {}).then(res => {
                  if (res) {
                    let _rst = res.result
                    utils.globalShowTip(false)
                    list[i].sub[j].sub = _rst
                    this.setData({
                      categoryList: list
                    })
                  }
                }).catch(err => {
                  utils.globalShowTip(false)
                })
              }
            }
          }
          this.setData({
            categoryList: list
          })
        } else { //如果二级分类不存在则根据一级分类的id去请求获取二级分类 -> 打开
          params.categoryId = categoryId1
          utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, params).then(res => {
            if (res) {
              let _rst = res.result
              utils.globalShowTip(false)
              list[i].sub = _rst
              for (let j = 0; j < list[i].sub.length; j++) {
                if (list[i].sub[j].id === categoryId2) {
                  list[i].sub[j].open = true
                  if (!list[i].sub[j].sub || !list[i].sub[j].sub.length) { // 判断三级分类是否存在 如果存在直接就会显示  如果不存在根据二级分类id发请求获取
                    params.categoryId = categoryId2
                    utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, params).then(res => {
                      if (res) {
                        let _rst = res.result
                        utils.globalShowTip(false)
                        list[i].sub[j].sub = _rst
                        this.setData({
                          categoryList: list
                        })
                      }
                    }).catch(err => {
                      utils.globalShowTip(false)
                    })
                  }
                }
              }
              this.setData({
                categoryList: list
              })
            }
          }).catch(err => {
            utils.globalShowTip(false)
          })
        }
      }
    }
    if (level === 0 || level === 1) {
      _this.setData({
        defaultCategory: categoryId,
        defaultCategory2: '',
        defaultCategory3: ''
      })
    }
    if (level === 2) {
      _this.setData({
        defaultCategory: categoryId1,
        defaultCategory2: categoryId,
        defaultCategory3: ''
      })
    }
    // 点击三级分类
    if (level === 3) {
      _this.setData({
        defaultCategory: categoryId1,
        defaultCategory2: categoryId2,
        defaultCategory3: categoryId
      })
    }
  },
  //点击搜索页的分类后当前页已经展开的分类要合上
  closeCategoryList: function() {
    // 遍历分类列表  关闭已经展开的分类
    let list = this.data.categoryList
    for (let i = 0; i < list.length; i++) {
      list[i].open = false
      if (list[i].sub && list[i].sub.length) {
        for (let j = 0; j < list[i].sub.length; j++) {
          list[i].sub[j].open = false
        }
      }
    }
    this.setData({
      categoryList: list
    })
  },
  goTop: function(e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
  },
  onPageScroll: function(e) { // 获取滚动条当前位置
    this.setData({
      scrollTop: e.scrollTop
    })
  },
  clickPage: function() {
    let _this = this
    _this.setData({
      picFlag: false
    })
  }
})