const utils = require('utils/util.js')
const dtime = '_deadtime'
App({
  globalData: {
    baseUrl: 'http://localhost:8080',//后台访问地址
    protocol: 'http:',
    appId: 'wx247f3c3cde3ba29c',
    userBase: {},
    retryNo: 0, //授权失败重新授权一次 
    shareTit: '',
    code: '',
    imgUrl: '',
    isIphone: false,
    isIpx: false, //判断是否是iPhoneX
    isIos: false,
    isActive: false, //判断激活
    jumpAppB: false
  },
  onLaunch(opt) {
    let _this = this
    if (opt) {
      let _qry = opt.query
      console.log("_qry:"+JSON.stringify(_qry))      
      let _prm = _this.getPathParams(_qry)
      _this.globalData.scene = opt.scene
      _this.globalData.authToPage = opt.path ? (opt.path + (_prm.indexOf('?') === 0 ? _prm : '?' + _prm)) : '/pages/home/home'
    }    

    //获取系统信息--企业微信运行时，会额外返回一个environment=wxwork，在微信里面运行时则不返 回该字段
    wx.getSystemInfo({ 
      success: function(res) {
        //判断是否是iphone手机
        let model = res.model
        let isiphone = model.indexOf('iPhone')
        if (isiphone != -1) {
          _this.globalData.isIphone = true
        }
        if (res.platform == 'ios') {
          _this.globalData.isIos = true
        }
        let modelX = model.substring(0, model.indexOf("X")) + "X";
        if (modelX == "iPhone X") {
          _this.globalData.isIpx = true
        }
        let environment = res.environment
        if (environment && environment !== '') {
          _this.globalData.environment = environment
        }
      }
    })
   
    //小程序强制更新
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate)
      })
      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate()
            }
          }
        })
      })
      updateManager.onUpdateFailed(function() {
        // 新的版本下载失败
      })
    }
  },
  getPathParams(obj) { //拼接启动页面的路径参数
    let _prm = []
    obj = obj || {}
    for (let key in obj) {
      _prm.push(key + '=' + obj[key])
    }
    return _prm.join('&')
  },
  getUCode(callback) {//获取用户登录授权码
    let _this = this
    let _global = _this.globalData
    let _environment = _global.environment
    if (_environment && _environment.toLowerCase() === 'wxwork') {
      if (wx.qy && wx.qy.checkSession) {
        wx.qy.checkSession({
          success(res) {
            wx.qy.login({
              success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
                console.info("code====>"+res.code)
                if (res.code) {
                  _this.globalData.code = res.code
                  _this.checkAuthUser(callback)
                } else {
                  console.log('获取用户登录态失败！' + res.errMsg)
                }
              },
              fail(res) {
                console.log(res)
              }
            })
          },
          fail(res) {
            // session_key 已经失效，需要重新执行登录流程
            wx.removeStorageSync('_localUserInfoB')
            // 登录
            wx.qy.login({
              success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
                if (res.code) {
                  _this.globalData.code = res.code
                  _this.checkAuthUser(callback)
                } else {
                  console.log('获取用户登录态失败！' + res.errMsg)
                }
              },
              fail(res) {
                console.log(res)
              }
            })
          }
        })
      } else {
        wx.showModal({
          title: '温馨提示',
          content: '只支持最新版本的企业微信，请更新！',
          showCancel: false
        })
      }
    } else {
      wx.checkSession({
        success(res) {
          // 登录
          wx.login({
            success: res => {
              console.info("code====>" + res.code)
              // 发送 res.code 到后台换取 openId, sessionKey, unionId        
              if (res.code) {
                _this.globalData.code = res.code
                _this.checkAuthUser(callback)
              } else {
                console.log('获取用户登录态失败！' + res.errMsg)
              }
            },
            fail(res) {
              console.log(res)
            }
          })
        },
        fail(res) {
          // 登录
          wx.login({
            success: res => {
              // 发送 res.code 到后台换取 openId, sessionKey, unionId        
              if (res.code) {
                _this.globalData.code = res.code
                _this.checkAuthUser(callback)
              } else {
                console.log('获取用户登录态失败！' + res.errMsg)
              }
            },
            fail(res) {
              console.log(res)
            }
          })
        }
      })
    }
  },
  gotoAuth() { //跳去授权页
    wx.redirectTo({
      url: '/pages/authorize/authorize'
    })
  },
  checkAuthUser(callback) {//用户鉴权
    var _this = this
    // 获取用户信息
    if (wx.getSetting) {
      _this.getUserInfo(null, callback)
      return false
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用getUserInfo获取头像昵称，不会弹框
            _this.getUserInfo(null, callback)
          } else {
            wx.authorize({
              scope: 'scope.userInfo',
              success() {
                // 用户已经同意, 调用getUserInfo获取头像昵称
                _this.getUserInfo(null, callback)
              },
              fail() {
                _this.gotoAuth()
              }
            })
          }
        }
      })
    } else {
      console.log('获取用户信息设置信息失败，请升级到最新微信版本后重试')
    }
  },
  getUserInfo(userInfoReadyCallback, callback) {//获取用户信息
    let _this = this
    if (wx.getUserInfo) {
      wx.getUserInfo({
        //withCredentials: true,
        success: res => {
          console.info("微信用户信息:"+res)
          if (_this.globalData.isRepeatGet) {
            _this.globalData.iv = res.iv
            _this.globalData.encryptedData = res.encryptedData
          }
          // 可以将 res 发送给后台解码出 unionId
          _this.globalData.userBase = res
          // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
          // 所以此处加入 callback 以防止这种情况
          if (userInfoReadyCallback && typeof userInfoReadyCallback === 'function') {
            userInfoReadyCallback(res)
            return false
          }
          if (callback && typeof callback === 'function') {
            _this.getAppInfo(callback)
          }
        },
        fail() {
          _this.gotoAuth()
        }
      })
    } else {
      _this.gotoAuth()
    }
  },
  checkUserId(callback) {
    let _this = this
    let userId = _this.globalData.userId
    if (userId && userId !== '') {
      if (callback && typeof callback === 'function') {
        callback()
      }
    } else {
      if (_this.globalData.isActive) {
        _this.gotoActive(callback)
      } else {
        _this.getAppInfo(callback)
      }
    }
  },
  getAppInfo(callback) { //查询小程序基本信息  
    let _this = this
    let _global = _this.globalData
    let uCode = _global.code
    if (uCode && uCode !== '') {
      //console.log(_this.globalData.userBase)
      let _environment = _global.environment
      let param = {
        code: uCode,
        appId: _global.appId,
        empId: _global.shareEmpId || _global.empId || '',
        storeId: _global.shareStoreId || '',
        appFlag: 2,
        nickname: _this.globalData.userBase.userInfo.nickName || '',
        avatarUrl: _global.userBase.userInfo ? _global.userBase.userInfo.avatarUrl : ''
      }
      if (_environment && _environment.toLowerCase() === 'wxwork') {
        param.environment = _environment
      }
      if (_this.getStorageSync("sessionKeyShopC")) {
        param.sessionKey = _this.getStorageSync("sessionKeyShopC")
      }
    
      utils.$http(_global.baseUrl + '/user/login', param, 'POST').then(res => {
        let _rst = res.result
        console.log("login:" + JSON.stringify(res.result));
        if (_rst) {
          _global.bindEmpId = ''
          _global.code = ''
          if (_rst.reTry && _global.retryNo < 1) {
            _global.retryNo = 1
            _this.checkUserId(callback)
            return false
          } else {
            _global.retryNo = 0
          }
          _this.setGlobalData(_rst)
          if (_rst.sessionKey) {
            _this.setStorageSync("sessionKeyShopC", _rst.sessionKey, 1500)
          }

         
          if (!_rst.unionId || _rst.unionId === '') {
            _global.isRepeatGet = true
            _this.setUserInfo(callback)
            return false
          }
         
          let params = {
            sessionId: _rst.sessionId
          }
         

        }
      }).catch(res => {
        utils.globalShowTip(false)
      })
    } else {
      _this.getUCode(callback)
    }
  },  
  gotoActive(callback) {//用户激活，获取用户信息
    let _this = this
    let _global = _this.globalData
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log(res)
        if (res.code) {
          _global.code = res.code
          let param = {
            code: _global.code,
            appId: _global.appId
          }
          param.environment = 'wx'
          if (_this.getStorageSync("sessionKeyShopC")) {
            param.sessionKey = _this.getStorageSync("sessionKeyShopC")
          }        
         

        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      },
      fail(res) {
        console.log(res)
      }
    })
  },
  setUserInfo(callback) {
    let _this = this
    // 获取用户信息
    if (wx.getSetting) {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            _this.getUserInfo(function() {
              _this.doSetUserInfo(callback)
            })
          } else {
            wx.authorize({
              scope: 'scope.userInfo',
              success() {
                // 用户已经同意, 调用getUserInfo获取头像昵称
                _this.getUserInfo(function() {
                  _this.doSetUserInfo(callback)
                })
              },
              fail() {
                _this.gotoAuth()
              }
            })
          }
        }
      })
    } else {
      console.log('获取用户信息设置信息失败，请升级到最新微信版本后重试')
    }
  },
  doSetUserInfo(callback) {
    let _this = this    
    let param = {
      sessionKey: _this.globalData.sessionKey,
      iv: _this.globalData.iv,
      encryptedData: _this.globalData.encryptedData,
      nickname: _this.globalData.userBase.userInfo.nickName || '',
      environment: _this.globalData.environment || 'wx'
    }
    utils.$http(_this.globalData.baseUrl + '/user/register', param, 'POST').then(res => {
      utils.globalShowTip(false)
      let _rst = res.result
      console.log("register:" + JSON.stringify(_rst));
      if (_rst) {
        _this.setGlobalData(_rst)
        if (callback && typeof callback === 'function') {
          console.log('repeating')
          callback()
        }
      }
    }).catch(res => {
      utils.globalShowTip(false)
    })
  },
  setGlobalData(res) {//设置全局变量信息
    let _this = this
    let _global = _this.globalData
    let _rst = res || {}
    let obj = {}
    if (_rst.userType) {
      _global.userType = _rst.userType
      obj.userType = _rst.userType
    }
    if (_rst.sessionKey) {
      _global.sessionKey = _rst.sessionKey
      obj.sessionKey = _rst.sessionKey
    }
    if (_rst.sessionId) {
      _global.sessionId = _rst.sessionId
      obj._sessionId = _rst.sessionId
    }
    if (_rst.unionId) {
      _global.unionId = _rst.unionId
      obj.unionId = _rst.unionId
    }
    if (_rst.miniOpenId) {
      _global.openId = _rst.miniOpenId
      obj.openId = _rst.miniOpenId
    }
    if (_rst.openId) {
      _global.wxOpenId = _rst.openId
      obj.wxOpenId = _rst.openId
    }   
    if (_rst.userId) { //粉丝ID
      _global.userId = _rst.userId
      obj.userId = _rst.userId
    }
    if (_rst.wxName || _rst.nick) {
      _global.wxName = _rst.wxName || _rst.nick
      obj.wxName = _rst.wxName || _rst.nick
    }
    if (_rst.photo) {
      _global.wxPhoto = _rst.photo
      obj.photo = _rst.photo
    }
    if (_rst.appletName) {
      _global.appletName = _rst.appletName
      obj.appletName = _rst.appletName
    }  

    let objStr = JSON.stringify(obj)
    wx.setStorageSync('_localUserInfo', objStr)
  },
  setStorageSync(k, v, t) {
    wx.setStorageSync(k, v)
    let seconds = parseInt(t)
    if (seconds > 0) {
      let timestamp = Date.parse(new Date())
      timestamp = timestamp / 1000 + seconds
      wx.setStorageSync(k + dtime, timestamp + "")
    } else {
      wx.removeStorageSync(k + dtime)
    }
  },
  getStorageSync(k, def) {
    let deadtime = parseInt(wx.getStorageSync(k + dtime))
    if (deadtime) {
      if (parseInt(deadtime) < Date.parse(new Date()) / 1000) {
        wx.removeStorageSync(k)
        wx.removeStorageSync(k + dtime)
        if (def) {
          return def
        } else {
          return
        }
      }
    }
    let res = wx.getStorageSync(k)
    if (res) {
      return res
    } else if (def) {
      return def
    } else {
      return
    }
  }
 
})