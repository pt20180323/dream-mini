const utils = require('../../utils/util.js')
const app = getApp()
let sockTask = ''
let sockInterval

Page({

    /**
     * 页面的初始数据
     */
    data: {
        type: '',
        order: '',
        coupon: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
  onLoad: function (options) {
    let empId = options.empId;
    this.setData({empId})
    app.checkUserId(this.initData)
  },

  /**
   * 初始化
   */
  initData: function () {
      let { baseUrl, shopId, storeId, hyUserId } = app.globalData
      let { empId } = this.data
      this.socketMsg(function () {
          console.log('C端' + "发送消息给：" + empId)
          utils.$http(baseUrl + '/emallMiniApp/websocket/sendHyId/' + shopId + '/' + storeId, { hyId: hyUserId, appId: 'lk_mini_el', replyTo: empId }, 'GET', true).then(res => {
              if (res.result) {
                  console.log("发送成功:" + res.result)
              }
              utils.globalShowTip(true, '核销中...')
          }).catch(error => {
              utils.globalShowTip(false)
              console.log(error)
          })
      });
  },

    /**
     * 建立websocket连接
     */
    socketMsg(callback) {
        let _this = this
        let _global = app.globalData
        if (!wx.connectSocket) return false
        //建立连接
        sockTask = wx.connectSocket({
            url: _global.socketUrl,
            success(res) {
                console.log(res)
                _this.setData({
                  sockOpen: true
                })
            },
            fail(err) {
                console.log('链接socket失败')
            }
        })
        sockTask.onOpen((res) => {
            console.log('打开socket')
            let msg = {
                properties: {
                    userId: _global.hyUserId,
                    replyTo: '',
                    appId: 'lk_mini_el',
                    flag: "1",
                    msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
                },
                payload: 'connect'
            }
            sockTask.send({
                data: JSON.stringify(msg)
            }, function (res) {
                console.log("连接上服务器：" + res)
            })
            sockInterval = setInterval(() => {
                let ping = {
                    properties: {
                        userId: _global.hyUserId,
                        replyTo: '',
                        appId: "lk_mini_el",
                        "type": 'ping',
                        flag: "1",
                        isChat: true,
                        msgTime: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
                    },
                    payload: 'ping'
                }
                sockTask.send({
                    data: JSON.stringify(ping)
                })
            }, 10000)
            if (callback) {
                callback();
            }
        })
        sockTask.onMessage((res) => {
            console.log(res)
            let _this = this
            let _data = JSON.parse(res.data)
            if (_data.properties.type === 'pong') {
                return
            }
            if (_data.properties.appId != "lk_mini_el") {
                return
            }
            let _payload = JSON.parse(_data.payload)
            console.log(_data)
            if (_data.type == 'ping') {
                if (_data.properties.hxtype == 1) {
                    _this.setData({
                        type: 'order',
                        order: _payload
                    })
                    wx.setNavigationBarTitle({
                        title: '小票信息'
                    });
                    utils.globalShowTip(false)
                } else if (_data.properties.hxtype == 2) {
                    _this.setData({
                        type: 'coupon',
                        coupon: _payload
                    })
                    wx.setNavigationBarTitle({
                        title: '小票信息'
                    });
                    utils.globalShowTip(false)
                }
            }
            console.log(_payload)
        })
        sockTask.onClose(function (res) {
            if (sockInterval) {
                clearInterval(sockInterval)
                sockTask = null
                sockInterval = null
            }
            console.log("socket已关闭")
            _this.socketMsg()
        })
    },
})