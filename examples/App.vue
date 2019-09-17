<template>
  <div id="app">
    <div class="demo">
      <div class="demo_label">Use local datetime:</div> 
      <div class="demo_picker">
        <vueMyDatepicker :param="local_param" v-on:select-time-range="customerSelectTimeRange"></vueMyDatepicker>
      </div>
      <div class="demo_notes">
        If you use local datetime, the component will calculate the start time and end time by time range you selected.
      You only need to listen on the event "selet-time-range" to get the start time and end time return from the component and
      then do whatever you want.
      </div>
    </div>
    <br/>
    <br/>
    <div class="demo">
      <div class="demo_label">Use server datetime:</div> 
      <div class="demo_picker">
        <vueMyDatepicker :param="sever_param" v-on:select-time-range="serverSelectTimeRange" v-on:change-time-range="changeTimeRange"></vueMyDatepicker>
      </div>
      <div class="demo_notes">
        If you use server datetime, you need caculate the date time on your own.
        <br/>
        For timerange except custom range, you need listen to event "change-time-range", and caculate start time and end time from backend API by the current timerange and send it back to the component by call reload function.<br/>
        For custom time range you can listen to event "select-time-range", it will return current start time and end time, and then do whatever you want.
      </div>
    </div>
    <br/>
    <br/>
    <div class="demo">
      <div class="demo_label">Use local time with left panel:</div> 
      <div class="demo_picker">
        <vueMyDatepicker :param="local_param_left" v-on:select-time-range="customerSelectTimeRange"></vueMyDatepicker>
      </div>
      <div class="demo_notes">
        If you use server datetime, you need caculate the date time on your own.
        <br/>
        For timerange except custom range, you need listen to event "change-time-range", and caculate start time and end time from backend API by the current timerange and send it back to the component by call reload function.<br/>
        For custom time range you can listen to event "select-time-range", it will return current start time and end time, and then do whatever you want.
      </div>
    </div>    

  </div>
</template>

<script>
import {vueMyDatepicker} from './../packages/index'

export default {
  name: 'app',
  components: {
    vueMyDatepicker
  },
  data(){
    return {
      local_param:{
        timeRange: 1,
        reloadFlag: false,
        dataTimeLabelPosition: 'right',
        initStart:"2019-09-16 01:43:10",
        initEnd:"2019-09-16 05:43:10",
        useLocalTime:true      
      },
      sever_param:{
        timeRange: 1,
        reloadFlag: false,
        dataTimeLabelPosition: 'right',
        initStart:"2019-09-16 01:43:10",
        initEnd:"2019-09-16 05:43:10",
        useLocalTime:false      
      },
      local_param_left:{
        timeRange: 1,
        reloadFlag: false,
        dataTimeLabelPosition: 'left',
        initStart:"2019-09-16 01:43:10",
        initEnd:"2019-09-16 05:43:10",
        useLocalTime:false      
      },           
    }
  },
  methods:{
    customerSelectTimeRange(time_range){
      console.log(time_range);
    },
    serverSelectTimeRange(time_range){
      console.log(time_range);
    },
    changeTimeRange(time_range_value){
      this.sever_param.timeRange = time_range_value;
      if(time_range_value == 1){
        this.sever_param.initStart = "2019-09-16 01:43:10";
        this.sever_param.initEnd = "2019-09-16 05:43:10";
        this.reloadTimeRange();
      }else if(time_range_value == 2){
        this.sever_param.initStart = "2019-09-15 05:43:10";
        this.sever_param.initEnd = "2019-09-16 05:43:10";
        this.reloadTimeRange();
      }else if(time_range_value == 3){
        this.sever_param.initStart = "2019-09-19 00:00:00";
        this.sever_param.initEnd = "2019-09-16 05:43:10";
        this.reloadTimeRange();        
      }else if(time_range_value == 4){
        this.sever_param.initStart = "2019-08-16 00:00:00";
        this.sever_param.initEnd = "2019-09-16 05:43:10";
        this.reloadTimeRange();        
      }else if(time_range_value == 5){
        this.sever_param.initStart = "2019-06-16 00:00:00";
        this.sever_param.initEnd = "2019-09-16 05:43:10";
        this.reloadTimeRange();        
      }
    },
    reloadTimeRange(){
      this.sever_param.reloadFlag = !this.sever_param.reloadFlag;
    }
  }
}
</script>

<style lang="less" scoped>
#app {
  text-align: left;
  .demo{
    .demo_label{
      display:inline-block;
      margin-right:5px;
      line-height:32px;
    }
    .demo_picker{
      display:inline-block;
    }
    .demo_notes{
      font-style:italic;
      color:green;
      margin-left:20px;
    }
  }
}
</style>
