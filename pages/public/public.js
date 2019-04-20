Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (opt) {
        let _this = this
        let URI = decodeURIComponent(opt.link)
        _this.setData({
            path: URI
        })
    }
})