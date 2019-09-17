<template>
<div class="vue-date-picker">
    <div class="date-time-range-dropdown dropdown">
        <div v-if="dataTimeLabelPosition == 'left'" class="date-time-range-info">
        	<label class="control-label">{{start}} ~ {{end}}</label>
        </div>
        <button :disabled="is_disabled" class="btn btn-dropdown" @click="show_timerange_list" type="button" v-on-clickaway="hide_timerange_list">
            <span class="date-time-range-text">{{time_range_display(time_range)}}</span>
            <font-awesome-icon class="icon" :icon="['fas','sort-down']" />
	        <div class="custom-wrapper" v-show="timerange_list_show" :class="dataTimeLabelPosition">
	            <div v-show="show_custom_range_panel" class="date-picker-pane" :class="dataTimeLabelPosition">
	                <div class="date-picker-pane-header">
	                    <div class="simple-date-time-container">
	                        <div class="input-icon-group">
	                            <input type="text" class="form-control input-width-xs pane-date-start-input" placeholder="yyyy-mm-dd">
	                            <label class="input-icon-label">
	                                <font-awesome-icon class="icon" :icon="['far','calendar-alt']" />
	                            </label>
	                        </div>
	                        <div class="input-icon-group">
	                            <input type="text" class="form-control input-width-xs pane-time-start-input" placeholder="hh:mm:ss">
	                            <label class="input-icon-label">
	                                <font-awesome-icon class="icon" :icon="['far','clock']" />
	                            </label>
	                        </div>
	                    </div>
	                    <div class="tilde">~</div>
	                    <div class="simple-date-time-container">
	                        <div class="input-icon-group">
	                            <input type="text" class="form-control input-width-xs pane-date-end-input" placeholder="yyyy-mm-dd">
	                            <label class="input-icon-label">
	                                <font-awesome-icon class="icon" :icon="['far','calendar-alt']" />
	                            </label>
	                        </div>
	                        <div class="input-icon-group">
	                            <input type="text" class="form-control input-width-xs pane-time-end-input" placeholder="hh:mm:ss">
	                            <label class="input-icon-label">
	                                <font-awesome-icon class="icon" :icon="['far','clock']" />
	                            </label>
	                        </div>
	                    </div>
	                </div>
	                <div class="date-picker-pane-body">
	                    <div class="date-picker-pane-container date-pane-date-start"></div>
	                    <div class="date-picker-pane-container date-pane-date-end"></div>
	                </div>
	                <div class="date-picker-pane-footer">
	                    <button type="button" class="btn btn-apply">Apply</button>
	                    <button type="button" class="btn btn-cancel">Cancel</button>
	                </div>
	            </div>
	            <ul class="dropdown-menu">
	                <template v-for="item in time_range_list">
	                    <li><a :data="item" :class='{"predefine-range":item != 6,"custom-range":item==6}' href="javascript:;">{{time_range_display(item)}}</a></li>
	                </template>
	            </ul>
	        </div>            
        </button>
        <div v-if="dataTimeLabelPosition =='right'" class="date-time-range-info">
        	<label class="control-label">{{start}} ~ {{end}}</label>
        </div>
    </div>
</div>
</template>
<script>
	import Vue from 'vue'
	import { library } from '@fortawesome/fontawesome-svg-core'
	import { faCalendarAlt,faClock } from '@fortawesome/free-regular-svg-icons'
	import { faSortDown,faChevronLeft,faChevronRight } from '@fortawesome/free-solid-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
	Vue.component('font-awesome-icon', FontAwesomeIcon)
    import { directive as onClickaway } from 'vue-clickaway';
	import * as jQuery from 'jquery';
	import * as $ from 'jquery';
	global.jQuery = jQuery;
	global. $ =  $;
	import moment from 'moment';
	require("./bootstrap-datepicker.js");
	import './vue-date-picker.less';
	library.add(faCalendarAlt,faClock,faSortDown,faChevronLeft,faChevronRight);
	export default{
		name:"vueMyDatepicker",
		directives: {
			onClickaway: onClickaway,
		},		
		props:{
			param:{
				type:Object,
				default:function(){
					return {
						timeRangeList:[1,2,3,4,5,6],
						timeRange:2,
						reloadFlag:false,
						initStart:"",
						initEnd:"",
						disabled:false,
						useLocalTime:false//use localtime instead of from backend service
					}
				}
			}
		},
		mounted:function(){
			this.init();
		},
		data:function (){
			return{
				time_range_list:this.param.timeRangeList || [1,2,3,4,5,6],
				time_range:this.param.timeRange || 2,
				dataTimeLabelPosition:this.param.dataTimeLabelPosition || 'left',
				start:"",
				end:"",
				custom_init_start:"",
				custom_start:"",
				custom_init_end:"",
				custom_end:"",
				today:"",
				is_disabled:this.param.disabled || false,
				timerange_list_show:false,
				custom_range_panel_show:false
			}
		},
		computed:{
			show_custom_range_panel(){
				return this.custom_range_panel_show || this.time_range == 6;
			}
		},	
		methods:{
			time_range_display(range){
				switch(range)
				{
					case 1:
					 return  "Last 4 hours";
					 break;
					case 2:
					 return  "Last 24 hours";
					 break;
					case 3:
					 return  "Last 7 days";
					 break;
					case 4:
					 return  "Last 30 days";
					 break;
					case 5:
					 return  "Last 90 days";
					 break;
					case 6:
					 return  "Custom range";
					 break;
					default:
					 return  "Last 4 hours";
				}
			},
			hide_timerange_list(){
				this.timerange_list_show = false;
				if(this.time_range != 6){
					this.custom_range_panel_show = false;
				}
			},
			show_timerange_list(){
				this.timerange_list_show = true;
			},
			init_timerange(){
				if(this.param.useLocalTime){
					let end_datetime = moment().format('YYYY-MM-DD hh:mm:ss');
					let start_datetime = this.start_datetime(end_datetime);
					this.custom_init_start = start_datetime;
					this.custom_init_end = end_datetime;
					this.start = start_datetime;
					this.end = end_datetime;
					this.custom_start = start_datetime;
					this.custom_end = end_datetime;
					this.today = end_datetime;
					this.$emit('select-time-range',{start:this.start,end:this.end});
				}else{
					this.custom_init_start = this.param.initStart;
					this.custom_init_end = this.param.initEnd;
					this.start = this.param.initStart;
					this.end = this.param.initEnd;
					this.custom_start = this.param.initStart;
					this.custom_end = this.param.initEnd;
					this.today = this.param.initEnd;					
				}
			},
			change_timerange(){
				if(this.param.useLocalTime){
					this.init_timerange();
				}else{
					this.$emit('change-time-range',this.time_range);
				}
				
			},
			start_datetime(end_datetime){
				switch(this.time_range)
				{
					case 1:
						return moment(end_datetime).add(-4, 'h').format('YYYY-MM-DD hh:mm:ss');
					case 2:
						return moment(end_datetime).add(-24, 'h').format('YYYY-MM-DD hh:mm:ss');
					case 3:
						return moment(end_datetime).add(-7, 'd').format('YYYY-MM-DD 00:00:00');
					case 4:
						return moment(end_datetime).add(-30, 'd').format('YYYY-MM-DD 00:00:00');
					case 5:
						return moment(end_datetime).add(-90, 'd').format('YYYY-MM-DD 00:00:00');
				}
			},
			init(){
				this.init_timerange();
				var _vue = this;
				var container = $(this.$el);

				var dateStartInput = $('.pane-date-start-input', container);
				var dateEndInput = $('.pane-date-end-input', container);

				var datePickerPaneStart = $('.date-pane-date-start', container);
				var datePickerPaneEnd = $('.date-pane-date-end', container);

				var timePickerStartInput = $('.pane-time-start-input', container);
				var timePickerEndInput = $('.pane-time-end-input', container);

				var dateTimeRangeDropdown = $('.date-time-range-dropdown', container);
				var datePickerPane = $('.date-picker-pane',container);
				var datePickerPaneButtons = $('.date-picker-pane-footer .btn',container);
				var today = this.param.initEnd?moment(this.param.initEnd).format('YYYY-MM-DD'):moment(this.today).format('YYYY-MM-DD');
				var lastweek = this.param.initStart?moment(this.param.initStart).format('YYYY-MM-DD'):moment(this.today).add(-7, 'd').format('YYYY-MM-DD');
				_vue.custom_init_start = this.param.initStart?this.param.initStart:lastweek + timePickerStartInput.val();

				function isStartTimeGreaterThanEndTime() {
					var startDate = datePickerPaneStart.data('date');
					var endDate = datePickerPaneEnd.data('date');
					var timeStart = timePickerStartInput.val();
					var timeEnd = timePickerEndInput.val();
					if (moment(startDate + ' ' + timeStart).isAfter(moment(endDate + ' ' + timeEnd))) return true;

					return false;
				}

				dateStartInput.val(lastweek).datepickerBehavior().off('change').on('change', function (e, date) {
					datePickerPaneStart.datepicker('update', date);
				});

				dateEndInput.val(today).datepickerBehavior().off('change').on('change', function (e, date) {
					datePickerPaneEnd.datepicker('update', date);
				});

				datePickerPaneStart.data('date', lastweek).datepicker({
					todayHighlight: true,
					autoclose: true,
					format: 'yyyy-mm-dd',
					keyboardNavigation: false,
					language:"en_US"
				}).off('changeDate changeMonth changeTime').on('changeDate changeMonth changeTime', function (e) {
					var selectedDate = moment($(this).data('date'));
					var endDate = datePickerPaneEnd.data('date');
					_vue.custom_start = selectedDate.format('YYYY-MM-DD')+ " "+timePickerStartInput.val();
					dateStartInput.val(selectedDate.format('YYYY-MM-DD'));
					if (selectedDate.isAfter(endDate) || selectedDate.isSame(endDate)) {
						datePickerPaneEnd.datepicker('update', selectedDate.format('YYYY-MM-DD'));
						_vue.custom_end = selectedDate.format('YYYY-MM-DD')+ " "+timePickerStartInput.val();
						if (isStartTimeGreaterThanEndTime()) {
							timePickerEndInput.val(timePickerStartInput.val());
						}
					}
				});

				datePickerPaneEnd.data('date', today).datepicker({
					todayHighlight: true,
					autoclose: true,
					format: 'yyyy-mm-dd',
					keyboardNavigation: false,
					language:"en_US"
				}).off('changeDate changeMonth').on('changeDate changeMonth', function (e) {
					var selectedDate = moment($(this).data('date'));
					var startDate = datePickerPaneStart.data('date');
					_vue.custom_end = selectedDate.format('YYYY-MM-DD')+ " "+timePickerEndInput.val();;
					dateEndInput.val(selectedDate.format('YYYY-MM-DD'));
					if (selectedDate.isBefore(startDate) || selectedDate.isSame(startDate)) {
						datePickerPaneStart.datepicker('update', selectedDate.format('YYYY-MM-DD'));
						_vue.custom_start = selectedDate.format('YYYY-MM-DD')+ " "+timePickerEndInput.val();;
						if (isStartTimeGreaterThanEndTime()) {
							timePickerStartInput.val(timePickerEndInput.val());
						}
					}
				});

				timePickerStartInput.val('12:00:00').timepicker().off('change').on('change', function (e, time) {
					var startDate = moment(dateStartInput.val());
					var endDate = dateEndInput.val();
					if (startDate.isSame(endDate) && isStartTimeGreaterThanEndTime()) {
						timePickerEndInput.val(timePickerStartInput.val()).focus();
					}
				});

				timePickerEndInput.val('12:00:00').timepicker().off('change').on('change', function (e, time) {
					var startDate = moment(dateStartInput.val());
					var endDate = dateEndInput.val();
					if (startDate.isSame(endDate) && isStartTimeGreaterThanEndTime()) {
						timePickerStartInput.val(timePickerEndInput.val()).focus();
					}
				});


				var start_time_part = this.param.initStart?moment(this.param.initStart).format("HH:mm:ss"):"12:00:00";
				var end_time_part = this.param.initEnd?moment(this.param.initEnd).format("HH:mm:ss"):"12:00:00";
				timePickerStartInput.val(start_time_part).timepickerBehavior();
				timePickerEndInput.val(end_time_part).timepickerBehavior();

				$('label', datePickerPane).off('click').on('click', function (e) {
					e.stopPropagation();
				});

				datePickerPane.off('click').on('click', function (e) {
					if (!datePickerPaneButtons.is($(e.target))) {
						e.preventDefault();
						e.stopPropagation();
					}
				});

				$(".prev", datePickerPaneStart).add($(".prev", datePickerPaneEnd)).find("i").attr('class', 'far fa-angle-left').html("&nbsp;");
				$(".next", datePickerPaneStart).add($(".next", datePickerPaneEnd)).find("i").attr('class', 'far fa-angle-right').html("&nbsp;");				

				$('.custom-range',container).off('click').on('click', function (e) {
					_vue.custom_start = _vue.custom_init_start;
					_vue.custom_end = _vue.custom_init_end;
					_vue.custom_range_panel_show = true;		
					e.stopPropagation();
					$(this).addClass('focus');
					datePickerPane.addClass('show');
					
				});

				$('.predefine-range',container).off('click').on('click', function (e) {
					$('.date-time-range-text',container).text($(this).text());
					_vue.time_range = parseInt($(this).attr("data"));
					_vue.custom_range_panel_show = false;
					_vue.hide_timerange_list();
					_vue.change_timerange();
					e.stopPropagation();
					
				});
				$('.btn-apply',container).off('click').on('click',function(e){
					_vue.start = moment(dateStartInput.val()).format('YYYY-MM-DD')+ " "+timePickerStartInput.val();
					_vue.end = moment(dateEndInput.val()).format('YYYY-MM-DD')+ " "+timePickerEndInput.val();
					$('.date-time-range-text',container).text($('.custom-range',container).text());
					_vue.custom_init_start = _vue.start;
					_vue.custom_init_end = _vue.end;
					_vue.$emit('select-time-range',{start:_vue.start,end:_vue.end});
					_vue.time_range = 6;
					_vue.hide_timerange_list();
					_vue.custom_range_panel_show = false;
					e.stopPropagation();
				});
				$('.btn-cancel',container).off('click').on('click',function(e){
					datePickerPaneStart.datepicker('update', moment(_vue.custom_init_start).format('YYYY-MM-DD'));
					datePickerPaneEnd.datepicker('update', moment(_vue.custom_init_end).format('YYYY-MM-DD'));
					_vue.hide_timerange_list();
					_vue.custom_range_panel_show = false;
					e.stopPropagation();
				});				
			}
		},
		watch:{
			"param.reloadFlag":function(){
				this.time_range = (typeof(this.param.timeRange)==="undefined" || this.param.timeRange == 6)?2:this.param.timeRange;
				$('.date-time-range-text',$(this.$el)).text(this.time_range_display(this.time_range));	
				this.init();
			},
			"param.disabled":function(){
				this.is_disabled = this.param.disabled?true:false;
			}
		}				
	};
</script>