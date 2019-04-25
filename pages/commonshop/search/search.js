const utils = require('../../../utils/util.js')
let app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        flag: false,
        searchContent: 0,
        categoryList: [], //分类列表
        defaultCategory: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(opt) {
        let _this = this
        _this.setData({
            shopId: opt.shopId || app.globalData.shopId,
            storeId: opt.storeId || app.globalData.storeId,
            categoryId: _this.data.categoryId || ''
        })
        if (opt.categoryId) {
            _this.setData({
                defaultCategory: opt.categoryId
            })
        }
        app.checkUserId(_this.initData)
    },
    initData: function() {
        let _this = this
        _this.getGradeList()
    },
    // 获取分类列表
    getGradeList: function() {
        let _this = this
        let _data = _this.data
        let arry = []
        let params = {
            shopId: app.globalData.shopId,
            storeId: app.globalData.storeId,
            categoryId: _data.categoryId
        }
        utils.$http(app.globalData.baseUrl + '/emallMiniApp/goods/category/list/' + params.shopId + '/' + params.storeId, params).then(res => {
            if (res) {
                utils.globalShowTip(false)
                _this.setData({
                    categoryList: res.result
                })
            }
        })
    },
    // 切换分类列表
    changeGrade: function(e) {
        let _this = this
        let _data = this.data
        let {
            idx,
            index,
            indexsub,
            level,
            hassub
        } = e.currentTarget.dataset
        let _list = _this.data.categoryList
        level = parseInt(level)
        _this.setData({
            categoryId: idx,
            level: level,
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
            _this.getGradeList()
        }
        //点击一级分类
        if (level === 1) {
            _this.setData({
                defaultCategory: idx,
                defaultCategory2: '',
                defaultCategory3: ''
            })
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
            app.globalData.categoryId1 = _this.data.categoryId
            app.globalData.index = index
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
            app.globalData.categoryId2 = _this.data.categoryId
        }
        // 点击三级分类
        if (level === 3) {
            _this.setData({
                defaultCategory3: idx
            })
        }
        // 判断没有下一级才去请求商品列表
        if (!hassub) {
            app.globalData.categoryId = _this.data.categoryId
            app.globalData.level = level
            wx.navigateBack({
                delta: 1
            })
            let pages = getCurrentPages()
            if (pages.length > 1) {
                let prevPage = pages[pages.length - 2]
                prevPage.setData({
                    level: level,
                    categoryId: _this.data.categoryId
                })
                prevPage.getGoodList()
                app.linecarCount()
            }
        }
    },
    finishSearch: function(opt) {
        let _this = this
        let searchContent = _this.data.searchContent
        let inputValue = opt.detail.value
        if (searchContent === 0) { //名称
            app.globalData.goodsName = inputValue
        }
        if (searchContent === 1) { //价格
            app.globalData.priceDouble = inputValue
        }
        if (searchContent === 2) { //货号
            app.globalData.modelCode = inputValue
        }
        wx.navigateBack({
            delta: 1
        })
        let pages = getCurrentPages()
        if (pages.length > 1) {
            let prevPage = pages[pages.length - 2]
            if(searchContent == 0){
                prevPage.data.goodsName = inputValue
            }else if(searchContent == 1){
                prevPage.data.priceDouble = inputValue
            } else if (searchContent == 2) {
                prevPage.data.modelCode = inputValue
            }
            prevPage.getGoodList()
            app.linecarCount()
        }
    },
    changeSearch: function() {
        let _this = this
        _this.setData({
            flag: !_this.data.flag
        })
    },
    clickClose: function() {
        wx.navigateBack({
            delta: 1
        })
    },
    changeContent: function(opt) {
        let _this = this
        let idx = parseInt(opt.currentTarget.dataset.idx)
        _this.setData({
            flag: false,
            searchContent: idx
        })
    },
    clickPage: function() {
        let _this = this
        _this.setData({
            flag: false
        })
    }
})