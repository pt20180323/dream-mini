const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
const formatDay = (date, str) => {
  const _date = new Date(date)
  const year = _date.getFullYear()
  const month = _date.getMonth() + 1
  const day = _date.getDate()
  return [year, month, day].map(formatNumber).join(str || '/')
}
const getTime = date => {
  const _date = new Date(date)
  const year = _date.getFullYear()
  const month = _date.getMonth() + 1
  const day = _date.getDate()
  const hour = _date.getHours()
  const minute = _date.getMinutes()
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}
// 秒杀订单列表取消时间
const milliSecondToDate = msd => {
  var time = parseFloat(msd);
  if (null != time && "" != time) {
    if (time > 60 && time < 60 * 60) {
      time = parseInt(time / 60.0) + "分";
    } else if (time >= 60 * 60 && time < 60 * 60 * 24) {
      time = parseInt(time / 3600.0) + "小时" + parseInt((parseFloat(time / 3600.0) -
        parseInt(time / 3600.0)) * 60) + "分";
    } else if (time >= 60 * 60 * 24) {
      time = parseInt(time / 3600.0 / 24) + "天" + parseInt((parseFloat(time / 3600.0 / 24) -
          parseInt(time / 3600.0 / 24)) * 24) + "小时" + parseInt((parseFloat(time / 3600.0) -
          parseInt(time / 3600.0)) * 60) + "分钟" +
        parseInt((parseFloat((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) -
          parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60)) * 60) + "秒";
    } else {
      time = parseInt(time) + "秒";
    }
  }
  return time;
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const formatSecond = () => {
  const date = new Date()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return [hour, minute].map(formatNumber).join(':')
}
Date.prototype.Format = function(fmt) {
  let o = {
    "M+": this.getMonth() + 1,
    "d+": this.getDate(),
    "h+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S": this.getMilliseconds()
  }
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length))
  for (let k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
  return fmt
}
/**
 * url：接口地址
 * method：请求方式，默认GET
 * data：请求参数
 * hideTipe：是否显示加载效果(布尔值)
 * sendtype：数据传递方式，默认以流的形式
 */
const $http = (url, data, method, hideTip, sendtype = '') => {
  let promise = new Promise((resolve, reject) => {
    let typeobj = {}
    let header = {
      'content-type': 'application/json'
    }
    if (method === 'POST') {
      if (sendtype && sendtype === 'JSON') {
        header['content-type'] = 'application/json'
        typeobj.dataType = 'json'
      } else {
        header['content-type'] = 'application/x-www-form-urlencoded'
      }
    }
    let _session = wx.getStorageSync('sessionKeyShopC')
    if (_session) {
      header.sessionId = _session
      header.sessionKey = _session
    }
    if (hideTip) {
      globalShowTip(false)
    } else {
      globalShowTip(true)
    }
    let _httparam = {
      url: url,
      data: data || {},
      method: method || 'GET',
      header: header,
      success(res) {
        if (res && res.data) {
          let _data = res.data
          if (parseInt(_data.code) !== 0) {
            setTimeout(function() {
              globalToast(_data.message || '网络异常，请稍后重试！', 'none')
              reject(res.data)
            }, 2000)
            return
          }
          resolve(res.data)
        }
      },
      fail(error) {
        reject(error)
      },
      complete(res) {
        if (res && res.data) {
          let returnCode = res.data.msgCode;
          if (returnCode === 'E100003') {
            wx.removeStorageSync('token')
            resolve(res.data)
            wx.showModal({
              title: '温馨提示',
              content: '登录已失效，请重新登录！',
              success: function(res) {},
              showCancel: false
            })
          }
        }
      }
    }
    wx.request(Object.assign(typeobj, _httparam))
  })
  return promise
}
const globalShowTip = (tog, tit) => {
  if (tog) {
    wx.showLoading({
      title: tit || '加载中...',
      mask: true
    })
  } else {
    wx.hideLoading()
  }
}

/**
 * 判断a数组是否包含b数组
 */
const isContained = (a, b) => {
  if (!(a instanceof Array) || !(b instanceof Array)) return false
  if (a.length < b.length) return false
  let aStr = a.toString()
  for (let i = 0, len = b.length; i < len; i++) {
    if (aStr.indexOf(b[i]) == -1) return false
  }
  return true
}


/* @param { Array } a 集合A  
 * @param { Array } b 集合B  
 * @returns { Array } 两个集合的交集
 */
const intersect = (a, b) => {
  return Array.from(new Set([...a].filter(x => b.includes(x))))
}

/* @param { Array } a 集合A  
 * @param { Array } b 集合B  
 * @returns { Array } 两个集合的差集
 */
const minus = (a, b) => {
  return Array.from(new Set([...a].filter(x => !b.includes(x))))
}

const globalToast = (tit, isicon, time) => {
  wx.showToast({
    title: tit || '校验通过',
    icon: isicon || 'success',
    mask: true,
    duration: time || 2000
  })
}
const getStr = (url, paramName) => {
  let reg = new RegExp('[?&]' + paramName + '=([^&#]+)')
  let query = url.match(reg)
  let originValue = query ? query[1] : null
  return originValue
}

const strip = (num, precision = 12) => {
  return +parseFloat(num.toPrecision(precision))
}

module.exports = {
  milliSecondToDate,
  formatTime,
  formatDay,
  getTime,
  $http,
  globalShowTip,
  globalToast,
  formatSecond,
  isContained,
  intersect,
  minus,
  getStr,
  strip
}