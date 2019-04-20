Component({  
  properties: {//组件属性
    value_length: {//输入框密码位数
      type: Number,
      value: 0,      
      observer(newVal, oldVal) {//监听输入框密码变化
        let that = this
        let input_value = that.data.input_value
        that.triggerEvent('valueNow', input_value)
        // 当输入框的值等于6时（发起支付等...）
        if (newVal == 6) {
          // 设定延时事件处理
          setTimeout(()=>{            
            that.triggerEvent('valueSix', input_value)// 引用组件页面的自定义函数(前一个参数为函数，后一个为传递给父页面的值)
            // 当没有
            if(!that.data.isNext){
              // 回到初始样式
              that.setData({
                get_focus: false,
                value_length: 0,
                input_value: ""
              })
            }
          }, 100)
        }
      }
    },    
    interval: {// 是否显示间隔输入框
      type: Boolean,
      value: true,
      observer(newVal, oldVal){

      }
    },    
    isNext: {// 是否有下一步按钮（如果有则当输入6位数字时不自动清空内容）
      type: Boolean,
      value: false,
      observer(newVal, oldVal){

      }
    },
    get_focus: {//输入框聚焦状态
      type: Boolean,
      value: false,
      observer(newVal, oldVal){

      }
    },    
    input_value: {//输入框初始内容
      type: String,
      value: "",
      observer(newVal, oldVal){
        console.log(newVal)
      }
    },    
    focus_class: {//输入框聚焦样式 
      type: Boolean,
      value: false,
      observer(newVal, oldVal){

      }
    },    
    value_num: {//输入框格子数
      type: Array,
      value: [1, 2, 3, 4, 5, 6],
      observer(newVal, oldVal){

      }
    },    
    height: {//输入框高度
      type: String,
      value: "80rpx",
      observer(newVal, oldVal){

      }
    },    
    width: {//输入框宽度
      type: String,
      value: "528rpx",
      observer(newVal, oldVal){

      }
    },    
    see: {//是否明文展示
      type: Boolean,
      value: false,
      observer(newVal, oldVal){

      }
    }
  },
  data: {// 初始化数据
  },
  methods: {// 组件方法
    get_focus() {// 获得焦点时
      let that = this
      that.setData({
        focus_class: true
      })
    },    
    blur() {// 失去焦点时
      let that = this
      that.setData({
        focus_class: false
      })
    },
    set_focus() {// 点击聚焦
      let that = this
      that.setData({
        get_focus: true
      })
    },
    get_value(data) {// 获取输入框的值
      let that = this      
      let val_arr = [] // 设置空数组用于明文展现      
      let now_val = data.detail.value // 获取当前输入框的值
      for (let i = 0; i < 6; i++) {// 遍历把每个数字加入数组
        val_arr.push(now_val.substr(i, 1))
      }      
      let value_length = data.detail.value.length // 获取输入框值的长度     
      that.setData({// 更新数据
        value_length: value_length,
        val_arr: val_arr,
        input_value: now_val
      })
    }
  }
})
