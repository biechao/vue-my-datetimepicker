# vue-my-datepicker
> This is a datetimepicker library follow boostrap style for vue, you can use it in vue project and via script tag directly.
> Support fixed and custom timerange and three lauguages.

## Table of contents
* [General info](#general-info)
* [Screenshots](#screenshots)
* [Setup](#setup)
* [Available props and functions](#props)
* [Features](#features)
* [Status](#status)
* [Inspiration](#inspiration)
* [Contact](#contact)
* [Licence](#licence)

## General info
The datetime picker is follow boostrap style, but all of the dependencies has been resolved in this components, you do not need to install any other library anymore.

## Screenshots
![Example screenshot](https://raw.githubusercontent.com/biechao/vue-my-datetimepicker/master/img/screenshot.png)
![Example screenshot](https://raw.githubusercontent.com/biechao/vue-my-datetimepicker/master/img/screenshot_CN.png)
![Example screenshot](https://raw.githubusercontent.com/biechao/vue-my-datetimepicker/master/img/screenshot_JP.png)


## Setup
npm install vue-my-datepicker
Or use script tag directly
```
<script src="vue.js"> </script>
<script src="vueMyDatepicker.umd.js"></script>
<link rel="stylesheet" type="text/css" href="vueMyDatepicker.css">
```

## Available props and functions
<table class="custom">
	<thead>
		<th>Props/methods</th>
		<th>Type</th>
		<th>Default</th>
		<th>Description</th>
	</thead>
	<tbody>
		<tr>
			<td>timeRange</td>
			<td>Int</td>
			<td>2</td>
			<td>The default timerange you want to selected</td>
		</tr>
		<tr>
			<td>reloadFlag</td>
			<td>Boolean</td>
			<td>false</td>
			<td>Use to reload the components, only useful for serve mode</td>
		</tr>
		<tr>
			<td>dataTimeLabelPosition</td>
			<td>String</td>
			<td>right</td>
			<td>The position of the custom timerange panel, can set to left</td>
		</tr>
		<tr>
			<td>initStart</td>
			<td>String</td>
			<td>null</td>
			<td>The default start time, only used for serve mode, the format will be ISO format: "2019-09-18 16:55:12"</td>
		</tr>
		<tr>
			<td>initEnd</td>
			<td>String</td>
			<td>null</td>
			<td>The default end time, only used for serve mode, the format will be ISO format: "2019-09-17 16:55:12"</td>
		</tr>
		<tr>
			<td>useLocalTime</td>
			<td>Boolean</td>
			<td>true</td>
			<td>Whether use local time, if use local time,the start time and end time will be caculate within components with javascript.<br/>
				Set it to false to use serve mode, then you need to get start time and end time from backend server.
			</td>
		</tr>
		<tr>
			<td>locale</td>
			<td>String</td>
			<td>en_US</td>
			<td>The language of this component, support en_US/zh_CN/ja_JP
			</td>
		</tr>		
		<tr>
			<td>select-time-range</td>
			<td>function</td>
			<td>N/A</td>
			<td>
				When user change the timerange inside the component, then this function will return start time and end time to user.
			</td>
		</tr>
		<tr>
			<td>change-time-range</td>
			<td>function</td>
			<td>N/A</td>
			<td>
				Only use for serve mode, if user change time range inside component, this function will return current timerange to user to <br/>get start time and end time from bakend server.
			</td>
		</tr>
	</tbody>
</table>


## Code Examples
For examples please refer to [github](https://biechao.github.io/2019/09/17/how%20to%20use%20vue-my-datepicker/)

## Features
Support local and serve datetime
* Local: use client datetime, the component will caculate the start time and end time in javascript
* Serve: use serve side datetime, you can provide start and end time to the component
Support three languages: 
* en_US
* zh_CN
* ja_JP

To-do list:
* Anything wonderful

## Status
Stable version

## Inspiration
The component is based on [bootstrap datetimepicker](http://www.eyecon.ro/bootstrap-datepicker)

## Contact
Feel free to contact me here [github](https://github.com/biechao/vue-my-datetimepicker)

## Licence
MIT