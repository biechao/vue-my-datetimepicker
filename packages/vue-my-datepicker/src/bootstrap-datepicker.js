	(function ($) {
		var MIN_HOUR = 0;
		var MAX_HOUR = 23;
		var MIN_MINUTE = 0;
		var MAX_MINUTE = 59;
		var MIN_SECOND = 0;
		var MAX_SECOND = 59;

		var TIME_REG = /\d{2}(\D{1})\d{2}(\D{1})\d{2}/;
		var KEY = {
			DOWN: 'D',
			UP: 'U',
			LEFT: 'L',
			RIGHT: 'R',
			TAB: 'T'
		};
		var H_POS = {
			start: 0,
			end: 2,
			length: 2,
			indicate: 'H',
			prev: function prev() {
				return null;
			},
			next: function next() {
				return M_POS;
			}
		};
		var M_POS = {
			start: 3,
			end: 5,
			length: 2,
			indicate: 'M',
			prev: function prev() {
				return H_POS;
			},
			next: function next() {
				return S_POS;
			}
		};
		var S_POS = {
			start: 6,
			end: 8,
			length: 2,
			indicate: 'S',
			prev: function prev() {
				return M_POS;
			},
			next: function next() {
				return null;
			}
		};

		/* Utilities */
		function pad(num, n) {

			var len = num.toString().length;
			while (len < n) {
				num = "0" + num;
				len++;
			}
			return num;
		}

		function getChunkPosition(start, end) {

			var position = {};
			if (start >= H_POS.start && start <= H_POS.end && end >= H_POS.start && end <= H_POS.end) {
				position = H_POS;
			} else if (start >= M_POS.start && start <= M_POS.end && end >= M_POS.start && end <= M_POS.end) {
				position = M_POS;
			} else if (start >= S_POS.start && start <= S_POS.end && end >= S_POS.start && end <= S_POS.end) {
				position = S_POS;
			}
			return position;
		}

		function getChunkNumber(value, position) {

			return parseInt(value.substring(position.start, position.end), 10);
		}

		function textReplace(hour, minute, second, splitter) {

			return pad(hour, 2) + splitter + pad(minute, 2) + splitter + pad(second, 2);
		}

		// TimePickerBehavior
		// ========================
		var TimepickerBehavior = function TimepickerBehavior(element, option) {

			this.options = option;
			this.input = element; // Original javascript DOM
			this.element = $(element); // jQuery DOM
			this.iconLabel = this.element.next(); // Dependent DOM

			var value = this.element.val();

			// To extract user splitter
			value.match(TIME_REG, '$1');
			this.splitter = RegExp.$1;

			// Initial varaibles
			this.orgH = getChunkNumber(value, H_POS);
			this.orgM = getChunkNumber(value, M_POS);
			this.orgS = getChunkNumber(value, S_POS);
			this.tmpH = [];
			this.tmpM = [];
			this.tmpS = [];

			// Bind events
			this._attachEvents();
		};

		TimepickerBehavior.prototype = {

			constructor: TimepickerBehavior,

			_attachEvents: function _attachEvents() {

				var _this = this;

				this.element.on('click', $.proxy(this._doEdit, this)).on('keydown', $.proxy(this._doKeydown, this)).on('focus', $.proxy(this._doFocus, this)).on('blur', $.proxy(this._doBlur, this));

				$(document).on('click', $.proxy(this._doUnEdit, this));
			},

			_doEdit: function _doEdit(e) {

				var input = this.element;
				var value = input.val();
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');

				var position = getChunkPosition(start, end);

				if (!this._tmpCheck(position)) {

					this.orgH = getChunkNumber(value, H_POS);
					this.orgM = getChunkNumber(value, M_POS);
					this.orgS = getChunkNumber(value, S_POS);
					this.tmpH = [];
					this.tmpM = [];
					this.tmpS = [];
				}

				if (position.indicate) {
					this._showField(position);
					this._edit(input.val());
				}
			},

			_doUnEdit: function _doUnEdit(e) {

				var target = $(e.target);
				var container = target.closest('.input-icon-group');
				var timepickerInput = container.children('input');

				if (target.is('.input-icon-group') || timepickerInput.length === 0 || !timepickerInput.is(this.element)) {
					this._unedit();
				}
			},

			_doKeydown: function _doKeydown(e) {

				var input = this.element;
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');
				var position = getChunkPosition(start, end);
				var enterNum = e.key;
				var splitter = this.splitter;
				var timeText;

				if (position.indicate) {

					// Up/Down arrow Key to change the digits
					if (e.keyCode == 40) this._doUpDown(KEY.DOWN, position);else if (e.keyCode == 38) this._doUpDown(KEY.UP, position);

					// Tab and Left/Right arrow Key to move selected position
					if (e.keyCode == 39) {
						return this._doLeftRight(KEY.RIGHT, position);
					} else if (e.keyCode == 37) {
						return this._doLeftRight(KEY.LEFT, position);
					} else if (e.keyCode == 9) {
						if (e.shiftKey === true) {
							return this._doLeftRight(KEY.LEFT, position);
						} else {
							return this._doLeftRight(KEY.RIGHT, position);
						}
					}

					// Insert Number
					if (/^\d$/.test(enterNum)) {

						this._doInsertNumber(enterNum, position);
					} else {
						// Allow: Ctrl/cmd+C
						if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;

						e.preventDefault();
						return false;

						// 	// // Allow: Delete/Backword
						// 	// // if (e.keyCode === 8 || e.keyCode === 46) {
						// 	// // 	this._doBack(position);
						// 	// // }
						// 	// e.preventDefault();
						//  //   	return false;
					}
				} else {

					// Allow: Ctrl/cmd+C
					if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;

					e.preventDefault();
					return false;
				}

				return false;
			},

			_doUpDown: function _doUpDown(direction, position) {

				var timeText;

				this._applyTemp(position.indicate);
				if (position.indicate === 'H') {

					if (direction === KEY.DOWN) this.orgH > MIN_HOUR ? this.orgH-- : this.orgH === MIN_HOUR ? this.orgH = MAX_HOUR : this.orgH = MIN_HOUR;else this.orgH < MAX_HOUR ? this.orgH++ : this.orgH === MAX_HOUR ? this.orgH = MIN_HOUR : this.orgH = MAX_HOUR;
				} else if (position.indicate === 'M') {

					if (direction === KEY.DOWN) this.orgM > MIN_MINUTE ? this.orgM-- : this.orgM === MIN_MINUTE ? this.orgM = MAX_MINUTE : this.orgM = MIN_MINUTE;else this.orgM < MAX_MINUTE ? this.orgM++ : this.orgM === MAX_MINUTE ? this.orgM = MIN_MINUTE : this.orgM = MAX_MINUTE;
				} else if (position.indicate === 'S') {

					if (direction === KEY.DOWN) this.orgS > MIN_SECOND ? this.orgS-- : this.orgS === MIN_SECOND ? this.orgS = MAX_SECOND : this.orgS = MIN_SECOND;else this.orgS < MAX_SECOND ? this.orgS++ : this.orgS === MAX_SECOND ? this.orgS = MIN_SECOND : this.orgS = MAX_SECOND;
				}

				timeText = this._autoCorrect(position.indicate);

				this.element.val(timeText);
				this._showField(position);
				this._change(timeText);
			},

			_doLeftRight: function _doLeftRight(direction, position) {

				var tabable = false;

				if (position.indicate === 'H') {
					// Selected on year position	

					if (direction === KEY.RIGHT) {
						this._correctVal(H_POS);
						this._showField(H_POS.next());
					} else {
						tabable = true;
						this._prev();
					}
				} else if (position.indicate === 'M') {
					// Selected on month position	

					this._correctVal(M_POS);

					if (direction === KEY.RIGHT) this._showField(M_POS.next());else this._showField(M_POS.prev());
				} else if (position.indicate === 'S') {
					// Selected on day position

					if (direction === KEY.LEFT) {
						this._correctVal(S_POS);
						this._showField(S_POS.prev());
					} else {
						tabable = true;
						this._next();
					}
				}

				return tabable;
			},

			_doInsertNumber: function _doInsertNumber(enterNum, position) {

				var timeText;
				var splitter = this.splitter;
				var tmp = this['tmp' + position.indicate];
				tmp.push(enterNum);

				var tmpString = tmp.join('');
				var tmpNumber = parseInt(tmpString, 10);

				if (position.indicate === 'H') {

					if (tmpNumber > 2 && tmpNumber < 10 || tmp.length === 2) {

						this['org' + position.indicate] = tmpNumber;

						if (tmpNumber > MAX_HOUR) this.orgM = MAX_HOUR;
						if (tmpNumber < MIN_HOUR) this.orgM = MIN_HOUR;

						timeText = this._autoCorrect(position.indicate);
						this.element.val(timeText);
						this._showField(position.next());
						this._change(timeText);
					} else {

						timeText = textReplace(tmpString, this.orgM, this.orgS, splitter);
						this.element.val(timeText);
						this._showField(position);
						this._change(timeText);
					}
				} else if (position.indicate === 'M') {

					if (tmpNumber > 5 && tmpNumber < 10 || tmp.length === 2) {

						this['org' + position.indicate] = tmpNumber;

						if (tmpNumber > MAX_MINUTE) this.orgM = MAX_MINUTE;
						if (tmpNumber < MIN_MINUTE) this.orgM = MIN_MINUTE;

						timeText = this._autoCorrect(position.indicate);
						this.element.val(timeText);
						this._showField(position.next());
						this._change(timeText);
					} else {

						timeText = textReplace(this.orgH, tmpString, this.orgS, splitter);
						this.element.val(timeText);
						this._showField(position);
						this._change(timeText);
					}
				} else if (position.indicate === 'S') {

					if (tmpNumber > 5 && tmpNumber < 10 || tmp.length === 2) {

						this['org' + position.indicate] = tmpNumber;

						if (tmpNumber > MAX_SECOND) this.orgS = MAX_SECOND;
						if (tmpNumber < MIN_SECOND) this.orgS = MIN_SECOND;

						timeText = this._autoCorrect(position.indicate);
						this.element.val(timeText);
						this._showField(position);
						this._change(timeText);
					} else {

						timeText = textReplace(this.orgH, this.orgM, tmpString, splitter);
						this.element.val(timeText);
						this._showField(position);
						this._change(timeText);
					}
				}
				if(this.element.hasClass("pane-time-start-input")){
					var start_time = this.element.val();
					var start_date = this.element.parent().prev().children(".pane-date-start-input").val();
					console.log(start_date+" "+start_time);
				}else{

				}
			},

			_doFocus: function _doFocus(e) {

				var input = this.element;
				var value = input.val();
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');
				var position = getChunkPosition(start, end);

				if (start === 0 && end === 0) {} else {
					this._showField(H_POS);
					this._doEdit();
				}
			},

			_doBlur: function _doBlur(e) {

				this._tmpCheck({});
			},

			/* Events Triggerer */

			_edit: function _edit(time) {

				this.element.trigger($.Event('edit'), [time]);
			},

			_unedit: function _unedit() {

				this.element.trigger($.Event('unedit'));
			},

			_change: function _change(time) {

				this.element.trigger($.Event('change'), [time]);
			},

			_prev: function _prev() {

				this.element.trigger($.Event('prev'), [this.element.val()]);
			},

			_next: function _next() {

				this.element.trigger($.Event('next'), [this.element.val()]);
			},

			/* Validators */
			_tmpCheck: function _tmpCheck(position) {

				var indicate = position.indicate;

				if (this.tmpH.length > 0 || this.tmpM.length > 0 || this.tmpS.length > 0) {

					if (indicate) {
						if (indicate !== 'H' && this.tmpH.length > 0) {
							this._correctVal(H_POS);
							return true;
						}
						if (indicate !== 'M' && this.tmpM.length > 0) {
							this._correctVal(M_POS);
							return true;
						}
						if (indicate !== 'S' && this.tmpS.length > 0) {
							this._correctVal(S_POS);
							return true;
						}
					} else {
						if (this.tmpH.length > 0) this._correctVal(H_POS);
						if (this.tmpM.length > 0) this._correctVal(M_POS);
						if (this.tmpS.length > 0) this._correctVal(S_POS);
					}
				}

				return false;
			},

			_correctVal: function _correctVal(position) {

				var timeText;
				if (this._applyTemp(position.indicate) != undefined) {
					timeText = this._autoCorrect(position.indicate);
					this.element.val(timeText);
					this._change(timeText);
				}
			},

			_applyTemp: function _applyTemp(indicate) {

				var tmp = this['tmp' + indicate];

				if (tmp.length > 0) {
					this['org' + indicate] = parseInt(tmp.join(''), 10);
					this['tmp' + indicate] = [];
					return true;
				}

				return false;
			},

			_autoCorrect: function _autoCorrect(indicate) {

				var splitter = this.splitter;
				var lastDate;

				if (indicate === 'H') {

					if (this.orgH < MIN_HOUR) this.orgH = MIN_HOUR;
					if (this.orgH > MAX_HOUR) this.orgH = MAX_HOUR;
				}

				if (indicate === 'M') {

					if (this.orgM < MIN_MINUTE) this.orgM = MIN_MINUTE;
					if (this.orgM > MAX_MINUTE) this.orgM = MAX_MINUTE;
				}

				if (indicate === 'S') {

					if (this.orgS < MIN_SECOND) this.orgS = MIN_SECOND;
					if (this.orgS > MAX_SECOND) this.orgS = MAX_SECOND;
				}

				this['tmp' + indicate] = [];

				return pad(this.orgH, 2) + splitter + pad(this.orgM, 2) + splitter + pad(this.orgS, 2);
			},

			_showField: function _showField(position) {
				var _this = this;
				this.input.setSelectionRange(position.start, position.end);
				setTimeout(function () {
					_this.input.setSelectionRange(position.start, position.end);
				}, 20);
			},

			showField: function showField(indicate) {
				if (indicate === 'H') this._showField(H_POS);
				if (indicate === 'M') this._showField(M_POS);
				if (indicate === 'S') this._showField(S_POS);
			}
		};

		$.fn.timepickerBehavior = function (option) {
			var args = Array.apply(null, arguments);
			args.shift();

			return this.each(function () {
				var $this = $(this);
				var data = $this.data('timepickerBehavior');
				var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;
				if (!data) $this.data('timepickerBehavior', data = new TimepickerBehavior(this, $.extend({}, $.fn.timepickerBehavior.defaults, options)));
				if (typeof option == 'string' && typeof data[option] == 'function') {
					data[option].apply(data, args);
				}
			});
		};

		// Bind constructor on the plugin
		$.fn.timepickerBehavior.Constructor = TimepickerBehavior;

		$.fn.timepickerBehavior.defaults = {};
	})(jQuery);

	// DatePicker Behavior Plugin
	// ========================
	(function ($) {

		var MIN_YEAR = 1900;
		var MAX_YEAR = 9999;
		var DATE_REG = /\d{4}(\D{1})\d{2}(\D{1})\d{2}/;
		var KEY = {
			DOWN: 'D',
			UP: 'U',
			LEFT: 'L',
			RIGHT: 'R',
			TAB: 'T'
		};
		var Y_POS = {
			start: 0,
			end: 4,
			length: 4,
			indicate: 'Y',
			prev: function prev() {
				return null;
			},
			next: function next() {
				return M_POS;
			}
		};
		var M_POS = {
			start: 5,
			end: 7,
			length: 2,
			indicate: 'M',
			prev: function prev() {
				return Y_POS;
			},
			next: function next() {
				return D_POS;
			}
		};
		var D_POS = {
			start: 8,
			end: 10,
			length: 2,
			indicate: 'D',
			prev: function prev() {
				return M_POS;
			},
			next: function next() {
				return null;
			}
		};

		/* Utilities */
		function pad(num, n) {

			var len = num.toString().length;
			while (len < n) {
				num = "0" + num;
				len++;
			}
			return num;
		}

		function getChunkPosition(start, end) {

			var position = {};
			if (start >= Y_POS.start && start <= Y_POS.end && end >= Y_POS.start && end <= Y_POS.end) {
				position = Y_POS;
			} else if (start >= M_POS.start && start <= M_POS.end && end >= M_POS.start && end <= M_POS.end) {
				position = M_POS;
			} else if (start >= D_POS.start && start <= D_POS.end && end >= D_POS.start && end <= D_POS.end) {
				position = D_POS;
			}
			return position;
		}

		function getChunkNumber(value, position) {

			return parseInt(value.substring(position.start, position.end), 10);
		}

		function getLastDate(year, month) {

			return moment(pad(year, 4) + '-' + pad(month, 2) + '-01').endOf('month')._d.getDate();
		}

		function textReplace(year, month, date, splitter) {

			return pad(year, 4) + splitter + pad(month, 2) + splitter + pad(date, 2);
		}

		// Constructor
		function DatepickerBehavior(element, option) {

			this.options = option;
			this.input = element; // Original javascript DOM
			this.element = $(element); // jQuery DOM
			this.iconLabel = this.element.next(); // Dependent DOM

			var value = this.element.val();

			// To extract user splitter
			value.match(DATE_REG, '$1');
			this.splitter = RegExp.$1;

			// Initial varaibles
			this.orgY = getChunkNumber(value, Y_POS);
			this.orgM = getChunkNumber(value, M_POS);
			this.orgD = getChunkNumber(value, D_POS);
			this.tmpY = [];
			this.tmpM = [];
			this.tmpD = [];

			// Bind events
			this._attachEvents();
		};

		DatepickerBehavior.prototype = {

			constructor: DatepickerBehavior,

			_attachEvents: function _attachEvents() {

				var _this = this;

				this.element.on('click', $.proxy(this._doEdit, this)).on('keydown', $.proxy(this._doKeydown, this)).on('blur', $.proxy(this._doBlur, this)).on('focus', $.proxy(this._doFocus, this));

				$(document).on('click', $.proxy(this._doUnEdit, this));
			},

			_doEdit: function _doEdit(e) {

				var input = this.element;
				var value = input.val();
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');
				var position = getChunkPosition(start, end);

				if (!this._tmpCheck(position)) {

					this.orgY = getChunkNumber(value, Y_POS);
					this.orgM = getChunkNumber(value, M_POS);
					this.orgD = getChunkNumber(value, D_POS);
					this.tmpY = [];
					this.tmpM = [];
					this.tmpD = [];
				}

				if (position.indicate) {
					this._showField(position);
					this._edit(input.val());
				}
			},

			_doUnEdit: function _doUnEdit(e) {

				var target = $(e.target);
				var container = target.closest('.input-icon-group');
				var datepickerInput = container.children('input');

				if (target.is('.input-icon-group') || datepickerInput.length === 0 || !datepickerInput.is(this.element)) {
					this._unedit();
				}
			},

			_doKeydown: function _doKeydown(e) {

				var input = this.element;
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');
				var position = getChunkPosition(start, end);
				var enterNum = e.key;
				var splitter = this.splitter;
				var dateText;

				if (position.indicate) {

					// Up/Down arrow Key to change the digits
					if (e.keyCode == 40) this._doUpDown(KEY.DOWN, position);else if (e.keyCode == 38) this._doUpDown(KEY.UP, position);

					// Tab and Left/Right arrow Key to move selected position
					if (e.keyCode == 39) {
						return this._doLeftRight(KEY.RIGHT, position);
					} else if (e.keyCode == 37) {
						return this._doLeftRight(KEY.LEFT, position);
					} else if (e.keyCode == 9) {
						if (e.shiftKey === true) {
							return this._doLeftRight(KEY.LEFT, position);
						} else {
							return this._doLeftRight(KEY.RIGHT, position);
						}
					}

					// Insert Number
					if (/^\d$/.test(enterNum)) {

						this._doInsertNumber(enterNum, position);
					} else {
						// Allow: Ctrl/cmd+C
						if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;

						e.preventDefault();
						return false;
						// // Allow: Delete/Backword
						// // if (e.keyCode === 8 || e.keyCode === 46) {
						// // 	this._doBack(position);
						// // }
						// e.preventDefault();
						//   	return false;
					}
				} else {

					// Allow: Ctrl/cmd+C
					if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;

					e.preventDefault();
					return false;
				}

				return false;
			},

			_doUpDown: function _doUpDown(direction, position) {

				var dateText;
				var lastDate;

				this._applyTemp(position.indicate);

				if (position.indicate === 'Y') {

					if (direction === KEY.DOWN) this.orgY > MIN_YEAR ? this.orgY-- : this.orgY === MIN_YEAR ? this.orgY = MAX_YEAR : this.orgY = MIN_YEAR;else this.orgY < MAX_YEAR ? this.orgY++ : this.orgY === MAX_YEAR ? this.orgY = MIN_YEAR : this.orgY = MAX_YEAR;
				} else if (position.indicate === 'M') {

					if (direction === KEY.DOWN) this.orgM > 1 ? this.orgM-- : this.orgM === 1 ? this.orgM = 12 : this.orgM = 1;else this.orgM < 12 ? this.orgM++ : this.orgM === 12 ? this.orgM = 1 : this.orgM = 12;
				} else if (position.indicate === 'D') {

					lastDate = getLastDate(this.orgY, this.orgM);

					if (direction === KEY.DOWN) this.orgD > 1 ? this.orgD-- : this.orgD === 1 ? this.orgD = lastDate : this.orgD = 1;else this.orgD < lastDate ? this.orgD++ : this.orgD === lastDate ? this.orgD = 1 : this.orgD = lastDate;
				}

				dateText = this._autoCorrect(position.indicate);

				this.element.val(dateText);
				this._showField(position);
				this._change(dateText);
			},

			_doLeftRight: function _doLeftRight(direction, position) {

				var tabable = false;

				if (position.indicate === 'Y') {
					// Selected on year position	

					if (direction === KEY.RIGHT) {
						this._correctVal(Y_POS);
						this._showField(Y_POS.next());
					} else {
						tabable = true;
						this._prev();
					}
				} else if (position.indicate === 'M') {
					// Selected on month position	

					this._correctVal(M_POS);

					if (direction === KEY.RIGHT) this._showField(M_POS.next());else this._showField(M_POS.prev());
				} else if (position.indicate === 'D') {
					// Selected on day position

					if (direction === KEY.LEFT) {
						this._correctVal(D_POS);
						this._showField(D_POS.prev());
					} else {
						tabable = true;
						this._next();
					}
				}

				return tabable;
			},

			_doInsertNumber: function _doInsertNumber(enterNum, position) {

				var dateText;
				var splitter = this.splitter;
				var tmp = this['tmp' + position.indicate];
				tmp.push(enterNum);

				var tmpString = tmp.join('');
				var tmpNumber = parseInt(tmpString, 10);
				var lastDate;

				if (position.indicate === 'Y') {

					if (tmp.length === 4) {

						this['org' + position.indicate] = tmpNumber;
						dateText = this._autoCorrect(position.indicate);
						this.element.val(dateText);
						this._showField(position.next());
						this._change(dateText);
					} else {

						dateText = textReplace(tmpString, this.orgM, this.orgD, splitter);
						this.element.val(dateText);
						this._showField(position);
					}
				} else if (position.indicate === 'M') {

					if (tmpNumber > 1 && tmpNumber < 10 || tmp.length === 2) {

						this['org' + position.indicate] = tmpNumber;

						if (tmpNumber > 12) this.orgM = 12;
						if (tmpNumber < 1) this.orgM = 1;

						dateText = this._autoCorrect(position.indicate);
						this.element.val(dateText);
						this._showField(position.next());
						this._change(dateText);
					} else {

						dateText = textReplace(this.orgY, tmpString, this.orgD, splitter);
						this.element.val(dateText);
						this._showField(position);

						if (tmpNumber == 1) {
							this._change(dateText);
						}
					}
				} else if (position.indicate === 'D') {

					lastDate = getLastDate(this.orgY, this.orgM);

					if (tmp.length === 2) {

						this['org' + position.indicate] = tmpNumber;

						if (tmpNumber > lastDate) this['org' + position.indicate] = lastDate;
						if (tmpNumber < 1) this['org' + position.indicate] = 1;

						dateText = this._autoCorrect(position.indicate);

						this.element.val(dateText);
						this._showField(position);
						this._change(dateText);
					} else {

						dateText = textReplace(this.orgY, this.orgM, tmpString, splitter);

						var lastDate = getLastDate(this.orgY, this.orgM);
						var canContinue = false;

						for (var i = 0; i < 10; i++) {
							var targetDate = parseInt(tmpString + i.toString(), 10);
							if (targetDate <= lastDate) canContinue = true;
						}

						if (canContinue) {
							this.element.val(dateText);
							this._showField(position);
							if (tmpNumber > 0) {
								this._change(dateText);
							}
						} else {
							this.orgD = tmpNumber;
							dateText = this._autoCorrect(position.indicate);
							this.element.val(dateText);
							this._showField(position);
							this._change(dateText);
						}
					}
				}
			},

			_doFocus: function _doFocus(e) {

				var input = this.element;
				var value = input.val();
				var start = input.prop('selectionStart');
				var end = input.prop('selectionEnd');
				var position = getChunkPosition(start, end);

				if (start === 0 && end === 0) {} else {
					this._showField(Y_POS);
					this._doEdit();
				}
			},

			_doBlur: function _doBlur(e) {

				this._tmpCheck({});
			},

			_denyPaste: function _denyPaste(e) {

				e.preventDefault();
				e.stopPropagation();
				return false;
			},

			_doBack: function _doBack(position) {

				// var indicate = position.indicate;
				// var tmp = this['tmp' + indicate];

				// if (tmp.length > 0) {
				// 	tmp.pop();
				// } 	
				// if (tmp.length === 0) {
				// 	this['org' + indicate] = pad(0, position.length)
				// }
				// this._doKeyNumber(null, position);
			},

			/* Events Triggerer */

			_edit: function _edit(date) {

				this.element.trigger($.Event('edit'), [date]);
			},

			_unedit: function _unedit() {

				this.element.trigger($.Event('unedit'));
			},

			_change: function _change(date) {

				this.element.trigger($.Event('change'), [date]);
			},

			_prev: function _prev() {

				this.element.trigger($.Event('prev'), [this.element.val()]);
			},

			_next: function _next() {

				this.element.trigger($.Event('next'), [this.element.val()]);
			},

			/* Validators */
			_tmpCheck: function _tmpCheck(position) {

				var indicate = position.indicate;

				if (this.tmpY.length > 0 || this.tmpM.length > 0 || this.tmpD.length > 0) {

					if (indicate) {
						if (indicate !== 'Y' && this.tmpY.length > 0) {
							this._correctVal(Y_POS);
							return true;
						}
						if (indicate !== 'M' && this.tmpM.length > 0) {
							this._correctVal(M_POS);
							return true;
						}
						if (indicate !== 'D' && this.tmpD.length > 0) {
							this._correctVal(D_POS);
							return true;
						}
					} else {
						if (this.tmpY.length > 0) this._correctVal(Y_POS);
						if (this.tmpM.length > 0) this._correctVal(M_POS);
						if (this.tmpD.length > 0) this._correctVal(D_POS);
					}
				}

				return false;
			},

			_correctVal: function _correctVal(position) {

				var dateText;
				if (this._applyTemp(position.indicate) != undefined) {
					dateText = this._autoCorrect(position.indicate);
					this.element.val(dateText);
					this._change(dateText);
				}
			},

			_applyTemp: function _applyTemp(indicate) {

				var tmp = this['tmp' + indicate];

				if (tmp.length > 0) {
					this['org' + indicate] = parseInt(tmp.join(''), 10);
					this['tmp' + indicate] = [];
					return true;
				}

				return false;
			},

			_autoCorrect: function _autoCorrect(indicate) {

				var splitter = this.splitter;
				var lastDate;

				if (indicate === 'Y') {

					if (this.orgY < MIN_YEAR) this.orgY = MIN_YEAR;
					if (this.orgY > MAX_YEAR) this.orgY = MAX_YEAR;

					lastDate = getLastDate(this.orgY, this.orgM);
					if (this.orgD > lastDate) this.orgD = lastDate;
				}

				if (indicate === 'M') {

					if (this.orgM < 1) {
						if (this.orgY > MIN_YEAR) {
							this.orgY--;
							this.orgM = 12;
						} else {
							this.orgM = 1;
						}
					}

					if (this.orgM > 12) {
						if (this.orgY < MAX_YEAR) {
							this.orgM = 1;
							this.orgY++;
						} else {
							this.orgM = 12;
						}
					}

					lastDate = getLastDate(this.orgY, this.orgM);
					if (this.orgD > lastDate) this.orgD = lastDate;
				}

				if (indicate === 'D') {

					if (this.orgD < 1) {

						if (this.orgY === MIN_YEAR && this.orgM === 1) {
							this.orgD = 1;
						} else {
							if (this.orgM === 1) {
								this.orgY--;
								this.orgM = 12;
								this.orgD = 31;
							} else {
								this.orgM--;
								this.orgD = getLastDate(this.orgY, this.orgM);
							}
						}
					} else {

						lastDate = getLastDate(this.orgY, this.orgM);

						if (this.orgD > lastDate) {
							if (this.orgY === MAX_YEAR && this.orgM === 12) {
								this.orgD = 31;
							} else {
								if (this.orgM === 12) {
									this.orgY++;
									this.orgM = 1;
									this.orgD = 31;
								} else {
									this.orgM++;
									this.orgD = 1;
								}
							}
						}
					}
				}

				this['tmp' + indicate] = [];

				return pad(this.orgY, 4) + splitter + pad(this.orgM, 2) + splitter + pad(this.orgD, 2);
			},

			_validateTmp: function _validateTmp(indicate) {
				// var splitter = this.splitter;
				// var lastDate;
				// var tmp = this[`tmp${indicate}`];
				// console.log(tmp);
				// if (indicate === 'Y') {

				// 	// if (this.orgY < MIN_YEAR) this.orgY = MIN_YEAR;
				// 	// if (this.orgY > MAX_YEAR) this.orgY = MAX_YEAR;
				// }
			},

			_showField: function _showField(position) {
				//lock
				var _this = this;
				this.input.setSelectionRange(position.start, position.end);
				setTimeout(function () {
					_this.input.setSelectionRange(position.start, position.end);
				}, 20);
			},

			showField: function showField(indicate) {
				if (indicate === 'Y') this._showField(Y_POS);
				if (indicate === 'M') this._showField(M_POS);
				if (indicate === 'D') this._showField(D_POS);
			}
		};

		$.fn.datepickerBehavior = function (option) {
			var args = Array.apply(null, arguments);
			args.shift();

			return this.each(function () {
				var $this = $(this);
				var data = $this.data('datepickerBehavior');
				var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;
				if (!data) $this.data('datepickerBehavior', data = new DatepickerBehavior(this, $.extend({}, $.fn.datepickerBehavior.defaults, options)));
				if (typeof option == 'string' && typeof data[option] == 'function') {
					data[option].apply(data, args);
				}
			});
		};

		// Bind constructor on the plugin
		$.fn.datepickerBehavior.Constructor = DatepickerBehavior;

		$.fn.datepickerBehavior.defaults = {};
	})(jQuery);
/* =========================================================
 * bootstrap-datepicker.js
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

!function( $ ) {

	function UTCDate(){
		return new Date(Date.UTC.apply(Date, arguments));
	}
	function UTCToday(){
		var today = new Date();
		return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	}

	// Picker object

	var Datepicker = function(element, options) {
		var that = this;

		this.element = $(element);
		this.language = options.language||this.element.data('date-language')||"en_US";
		this.language = this.language in dates ? this.language : "en_US";
		this.isRTL = dates[this.language].rtl||false;
		this.format = DPGlobal.parseFormat(options.format||this.element.data('date-format')||'mm/dd/yyyy');
		this.isInline = false;
		this.isInput = this.element.is('input');
		this.component = this.element.is('.date') ? this.element.find('.add-on') : false;
		this.hasInput = this.component && this.element.find('input').length;
		if(this.component && this.component.length === 0)
			this.component = false;

		this._attachEvents();

		this.forceParse = true;
		if ('forceParse' in options) {
			this.forceParse = options.forceParse;
		} else if ('dateForceParse' in this.element.data()) {
			this.forceParse = this.element.data('date-force-parse');
		}
		 

		this.picker = $(DPGlobal.template)
							.appendTo(this.isInline ? this.element : 'body')
							.on({
								click: $.proxy(this.click, this),
								mousedown: $.proxy(this.mousedown, this)
							});

		if(this.isInline) {
			this.picker.addClass('datepicker-inline');
		} else {
			this.picker.addClass('datepicker-dropdown dropdown-menu');
		}
		if (this.isRTL){
			this.picker.addClass('datepicker-rtl');
			this.picker.find('.prev i, .next i')
						.toggleClass('icon-arrow-left icon-arrow-right');
		}
		$(document).on('mousedown', function (e) {
			// Clicked outside the datepicker, hide it
			if ($(e.target).closest('.datepicker').length === 0) {
				that.hide();
			}
		});

		this.autoclose = false;
		if ('autoclose' in options) {
			this.autoclose = options.autoclose;
		} else if ('dateAutoclose' in this.element.data()) {
			this.autoclose = this.element.data('date-autoclose');
		}

		this.keyboardNavigation = true;
		if ('keyboardNavigation' in options) {
			this.keyboardNavigation = options.keyboardNavigation;
		} else if ('dateKeyboardNavigation' in this.element.data()) {
			this.keyboardNavigation = this.element.data('date-keyboard-navigation');
		}

		this.viewMode = this.startViewMode = 0;
		switch(options.startView || this.element.data('date-start-view')){
			case 2:
			case 'decade':
				this.viewMode = this.startViewMode = 2;
				break;
			case 1:
			case 'year':
				this.viewMode = this.startViewMode = 1;
				break;
		}

		this.todayBtn = (options.todayBtn||this.element.data('date-today-btn')||false);
		this.todayHighlight = (options.todayHighlight||this.element.data('date-today-highlight')||false);

		this.weekStart = ((options.weekStart||this.element.data('date-weekstart')||dates[this.language].weekStart||0) % 7);
		this.weekEnd = ((this.weekStart + 6) % 7);
		this.startDate = -Infinity;
		this.endDate = Infinity;
		this.daysOfWeekDisabled = [];
		this.setStartDate(options.startDate||this.element.data('date-startdate'));
		this.setEndDate(options.endDate||this.element.data('date-enddate'));
		this.setDaysOfWeekDisabled(options.daysOfWeekDisabled||this.element.data('date-days-of-week-disabled'));
		this.fillDow();
		this.fillMonths();
		this.update();
		this.showMode();

		if(this.isInline) {
			this.show();
		}
	};

	Datepicker.prototype = {
		constructor: Datepicker,

		_events: [],
		_attachEvents: function(){
			this._detachEvents();
			if (this.isInput) { // single input
				this._events = [
					[this.element, {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}]
				];
			}
			else if (this.component && this.hasInput){ // component: input + button
				this._events = [
					// For components that are not readonly, allow keyboard nav
					[this.element.find('input'), {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}],
					[this.component, {
						click: $.proxy(this.show, this)
					}]
				];
			}
						else if (this.element.is('div')) {  // inline datepicker
							this.isInline = true;
						}
			else {
				this._events = [
					[this.element, {
						click: $.proxy(this.show, this)
					}]
				];
			}
			for (var i=0, el, ev; i<this._events.length; i++){
				el = this._events[i][0];
				ev = this._events[i][1];
				el.on(ev);
			}
		},
		_detachEvents: function(){
			for (var i=0, el, ev; i<this._events.length; i++){
				el = this._events[i][0];
				ev = this._events[i][1];
				el.off(ev);
			}
			this._events = [];
		},

		show: function(e) {
			this.picker.show();
			this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
			this.update();
			this.place();
			$(window).on('resize', $.proxy(this.place, this));
			if (e ) {
				e.stopPropagation();
				e.preventDefault();
			}
			this.element.trigger({
				type: 'show',
				date: this.date
			});
		},

		hide: function(e){
			if(this.isInline) return;
			this.picker.hide();
			$(window).off('resize', this.place);
			this.viewMode = this.startViewMode;
			this.showMode();
			if (!this.isInput) {
				$(document).off('mousedown', this.hide);
			}

			if (
				this.forceParse &&
				(
					this.isInput && this.element.val() ||
					this.hasInput && this.element.find('input').val()
				)
			)
				this.setValue();
			this.element.trigger({
				type: 'hide',
				date: this.date
			});
		},

		remove: function() {
			this._detachEvents();
			this.picker.remove();
			delete this.element.data().datepicker;
		},

		getDate: function() {
			var d = this.getUTCDate();
			return new Date(d.getTime() + (d.getTimezoneOffset()*60000));
		},

		getUTCDate: function() {
			return this.date;
		},

		setDate: function(d) {
			this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset()*60000)));
		},

		setUTCDate: function(d) {
			this.date = d;
			this.setValue();
		},

		setValue: function() {
			var formatted = this.getFormattedDate();
			if (!this.isInput) {
				if (this.component){
					this.element.find('input').val(formatted);
				}
				this.element.data('date', formatted);
			} else {
				this.element.val(formatted);
			}
		},

		getFormattedDate: function(format) {
			if (format === undefined)
				format = this.format;
			return DPGlobal.formatDate(this.date, format, this.language);
		},

		setStartDate: function(startDate){
			this.startDate = startDate||-Infinity;
			if (this.startDate !== -Infinity) {
				this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language);
			}
			this.update();
			this.updateNavArrows();
		},

		setEndDate: function(endDate){
			this.endDate = endDate||Infinity;
			if (this.endDate !== Infinity) {
				this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language);
			}
			this.update();
			this.updateNavArrows();
		},

		setDaysOfWeekDisabled: function(daysOfWeekDisabled){
			this.daysOfWeekDisabled = daysOfWeekDisabled||[];
			if (!$.isArray(this.daysOfWeekDisabled)) {
				this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
			}
			this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
				return parseInt(d, 10);
			});
			this.update();
			this.updateNavArrows();
		},

		place: function(){
						if(this.isInline) return;
			var zIndex = parseInt(this.element.parents().filter(function() {
							return $(this).css('z-index') != 'auto';
						}).first().css('z-index'))+10;
			var offset = this.component ? this.component.offset() : this.element.offset();
			var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(true);
			this.picker.css({
				top: offset.top + height,
				left: offset.left,
				zIndex: zIndex
			});
		},

		update: function(){
			var date, fromArgs = false;
			if(arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
				date = arguments[0];
				fromArgs = true;
			} else {
				date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
			}

			this.date = DPGlobal.parseDate(date, this.format, this.language);

			if(fromArgs) this.setValue();

			var oldViewDate = this.viewDate;
			if (this.date < this.startDate) {
				this.viewDate = new Date(this.startDate);
			} else if (this.date > this.endDate) {
				this.viewDate = new Date(this.endDate);
			} else {
				this.viewDate = new Date(this.date);
			}

			if (oldViewDate && oldViewDate.getTime() != this.viewDate.getTime()){
				this.element.trigger({
					type: 'changeDate',
					date: this.viewDate
				});
			}
			this.fill();
		},

		fillDow: function(){
			var dowCnt = this.weekStart,
			html = '<tr>';
			while (dowCnt < this.weekStart + 7) {
				html += '<th class="dow">'+dates[this.language].daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.picker.find('.datepicker-days thead').append(html);
		},

		fillMonths: function(){
			var html = '',
			i = 0;
			while (i < 12) {
				html += '<span class="month">'+dates[this.language].monthsShort[i++]+'</span>';
			}
			this.picker.find('.datepicker-months td').html(html);
		},

		fill: function() {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				startYear = this.startDate !== -Infinity ? this.startDate.getUTCFullYear() : -Infinity,
				startMonth = this.startDate !== -Infinity ? this.startDate.getUTCMonth() : -Infinity,
				endYear = this.endDate !== Infinity ? this.endDate.getUTCFullYear() : Infinity,
				endMonth = this.endDate !== Infinity ? this.endDate.getUTCMonth() : Infinity,
				currentDate = this.date && this.date.valueOf(),
				today = new Date();
			this.picker.find('.datepicker-days thead th:eq(1)')
						.text(dates[this.language].months[month]+' '+year);
			this.picker.find('tfoot th.today')
						.text(dates[this.language].today)
						.toggle(this.todayBtn !== false);
			this.updateNavArrows();
			this.fillMonths();
			var prevMonth = UTCDate(year, month-1, 28,0,0,0,0),
				day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while(prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() == this.weekStart) {
					html.push('<tr>');
				}
				clsName = '';
				if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month)) {
					clsName += ' old';
				} else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month)) {
					clsName += ' new';
				}
				// Compare internal UTC date with local today, not UTC today
				if (this.todayHighlight &&
					prevMonth.getUTCFullYear() == today.getFullYear() &&
					prevMonth.getUTCMonth() == today.getMonth() &&
					prevMonth.getUTCDate() == today.getDate()) {
					clsName += ' today';
				}
				if (currentDate && prevMonth.valueOf() == currentDate) {
					clsName += ' active';
				}
				if (prevMonth.valueOf() < this.startDate || prevMonth.valueOf() > this.endDate ||
					$.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1) {
					clsName += ' disabled';
				}
				html.push('<td class="day'+clsName+'">'+prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() == this.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate()+1);
			}
			this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
			var currentYear = this.date && this.date.getUTCFullYear();

			var months = this.picker.find('.datepicker-months')
						.find('th:eq(1)')
							.text(year)
							.end()
						.find('span').removeClass('active');
			if (currentYear && currentYear == year) {
				months.eq(this.date.getUTCMonth()).addClass('active');
			}
			if (year < startYear || year > endYear) {
				months.addClass('disabled');
			}
			if (year == startYear) {
				months.slice(0, startMonth).addClass('disabled');
			}
			if (year == endYear) {
				months.slice(endMonth+1).addClass('disabled');
			}

			html = '';
			year = parseInt(year/10, 10) * 10;
			var yearCont = this.picker.find('.datepicker-years')
								.find('th:eq(1)')
									.text(year + '-' + (year + 9))
									.end()
								.find('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year'+(i == -1 || i == 10 ? ' old' : '')+(currentYear == year ? ' active' : '')+(year < startYear || year > endYear ? ' disabled' : '')+'">'+year+'</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		updateNavArrows: function() {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth();
			switch (this.viewMode) {
				case 0:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear() && month <= this.startDate.getUTCMonth()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear() && month >= this.endDate.getUTCMonth()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 1:
				case 2:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
			}
		},

		click: function(e) {
			e.stopPropagation();
			e.preventDefault();
			var target = $(e.target).closest('span, td, th');
			if (target.length == 1) {
				switch(target[0].nodeName.toLowerCase()) {
					case 'th':
						switch(target[0].className) {
							case 'switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
								switch(this.viewMode){
									case 0:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										break;
									case 1:
									case 2:
										this.viewDate = this.moveYear(this.viewDate, dir);
										break;
								}
								this.fill();
								break;
							case 'today':
								var date = new Date();
								date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

								this.showMode(-2);
								var which = this.todayBtn == 'linked' ? null : 'view';
								this._setDate(date, which);
								break;
						}
						break;
					case 'span':
						if (!target.is('.disabled')) {
							this.viewDate.setUTCDate(1);
							if (target.is('.month')) {
								var month = target.parent().find('span').index(target);
								this.viewDate.setUTCMonth(month);
								this.element.trigger({
									type: 'changeMonth',
									date: this.viewDate
								});
							} else {
								var year = parseInt(target.text(), 10)||0;
								this.viewDate.setUTCFullYear(year);
								this.element.trigger({
									type: 'changeYear',
									date: this.viewDate
								});
							}
							this.showMode(-1);
							this.fill();
						}
						break;
					case 'td':
						if (target.is('.day') && !target.is('.disabled')){
							var day = parseInt(target.text(), 10)||1;
							var year = this.viewDate.getUTCFullYear(),
								month = this.viewDate.getUTCMonth();
							if (target.is('.old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.is('.new')) {
								if (month == 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this._setDate(UTCDate(year, month, day,0,0,0,0));
						}
						break;
				}
			}
		},

		_setDate: function(date, which){
			if (!which || which == 'date')
				this.date = date;
			if (!which || which  == 'view')
				this.viewDate = date;
			this.fill();
			this.setValue();
			this.element.trigger({
				type: 'changeDate',
				date: this.date
			});
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component){
				element = this.element.find('input');
			}
			if (element) {
				element.change();
				if (this.autoclose && (!which || which == 'date')) {
					this.hide();
				}
			}
		},

		moveMonth: function(date, dir){
			if (!dir) return date;
			var new_date = new Date(date.valueOf()),
				day = new_date.getUTCDate(),
				month = new_date.getUTCMonth(),
				mag = Math.abs(dir),
				new_month, test;
			dir = dir > 0 ? 1 : -1;
			if (mag == 1){
				test = dir == -1
					// If going back one month, make sure month is not current month
					// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
					? function(){ return new_date.getUTCMonth() == month; }
					// If going forward one month, make sure month is as expected
					// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
					: function(){ return new_date.getUTCMonth() != new_month; };
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11)
					new_month = (new_month + 12) % 12;
			} else {
				// For magnitudes >1, move one month at a time...
				for (var i=0; i<mag; i++)
					// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
					new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function(){ return new_month != new_date.getUTCMonth(); };
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()){
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function(date, dir){
			return this.moveMonth(date, dir*12);
		},

		dateWithinRange: function(date){
			return date >= this.startDate && date <= this.endDate;
		},

		keydown: function(e){
			if (this.picker.is(':not(:visible)')){
				if (e.keyCode == 27) // allow escape to hide and re-show picker
					this.show();
				return;
			}
			var dateChanged = false,
				dir, day, month,
				newDate, newViewDate;
			switch(e.keyCode){
				case 27: // escape
					this.hide();
					e.preventDefault();
					break;
				case 37: // left
				case 39: // right
					if (!this.keyboardNavigation) break;
					dir = e.keyCode == 37 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey){
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
					}
					if (this.dateWithinRange(newDate)){
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 38: // up
				case 40: // down
					if (!this.keyboardNavigation) break;
					dir = e.keyCode == 38 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (e.shiftKey){
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else {
						newDate = new Date(this.date);
						newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
						newViewDate = new Date(this.viewDate);
						newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
					}
					if (this.dateWithinRange(newDate)){
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 13: // enter
					this.hide();
					e.preventDefault();
					break;
				case 9: // tab
					this.hide();
					break;
			}
			if (dateChanged){
				this.element.trigger({
					type: 'changeDate',
					date: this.date
				});
				var element;
				if (this.isInput) {
					element = this.element;
				} else if (this.component){
					element = this.element.find('input');
				}
				if (element) {
					element.change();
				}
			}
		},

		showMode: function(dir) {
			if (dir) {
				this.viewMode = Math.max(0, Math.min(2, this.viewMode + dir));
			}
			/*
				vitalets: fixing bug of very special conditions:
				jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
				Method show() does not set display css correctly and datepicker is not shown.
				Changed to .css('display', 'block') solve the problem.
				See https://github.com/vitalets/x-editable/issues/37

				In jquery 1.7.2+ everything works fine.
			*/
			//this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
			this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
			this.updateNavArrows();
		}
	};

	$.fn.datepicker = function ( option ) {
		var args = Array.apply(null, arguments);
		args.shift();
		return this.each(function () {
			var $this = $(this),
				data = $this.data('datepicker'),
				options = typeof option == 'object' && option;
			if (!data) {
				$this.data('datepicker', (data = new Datepicker(this, $.extend({}, $.fn.datepicker.defaults,options))));
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				data[option].apply(data, args);
			}
		});
	};

	$.fn.datepicker.defaults = {
	};
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
		en_US: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today"
		},
		en_GB: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today"
		},
		iso: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today"
		},		
		zh_CN:{
			days: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
			daysShort: ['周日','周一','周二','周三','周四','周五','周六'],
			daysMin: ['日','一','二','三','四','五','六'],
			months: ['一月','二月','三月','四月','五月','六月',
	'七月','八月','九月','十月','十一月','十二月'],
			monthsShort: ['一月','二月','三月','四月','五月','六月',
	'七月','八月','九月','十月','十一月','十二月'],
			today: "Today"			
		},
		ja_JP:{
			days: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
			daysShort: ['日','月','火','水','木','金','土'],
			daysMin: ['日','月','火','水','木','金','土'],
			months: ['1月','2月','3月','4月','5月','6月',
	'7月','8月','9月','10月','11月','12月'],
			monthsShort: ['1月','2月','3月','4月','5月','6月',
	'7月','8月','9月','10月','11月','12月'],
			today: "Today"				
		}
	};

	var DPGlobal = {
		modes: [
			{
				clsName: 'days',
				navFnc: 'Month',
				navStep: 1
			},
			{
				clsName: 'months',
				navFnc: 'FullYear',
				navStep: 1
			},
			{
				clsName: 'years',
				navFnc: 'FullYear',
				navStep: 10
		}],
		isLeapYear: function (year) {
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
		},
		getDaysInMonth: function (year, month) {
			return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function(format){
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
				parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0){
				throw new Error("Invalid date format.");
			}
			return {separators: separators, parts: parts};
		},
		parseDate: function(date, format, language) {
			if (date instanceof Date) return date;
			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
				var part_re = /([\-+]\d+)([dmwy])/,
					parts = date.match(/([\-+]\d+)([dmwy])/g),
					part, dir;
				date = new Date();
				for (var i=0; i<parts.length; i++) {
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					switch(part[2]){
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
			}
			var parts = date && date.match(this.nonpunctuation) || [],
				date = new Date(),
				parsed = {},
				setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
				setters_map = {
					yyyy: function(d,v){ return d.setUTCFullYear(v); },
					yy: function(d,v){ return d.setUTCFullYear(2000+v); },
					m: function(d,v){
						v -= 1;
						while (v<0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() != v)
							d.setUTCDate(d.getUTCDate()-1);
						return d;
					},
					d: function(d,v){ return d.setUTCDate(v); }
				},
				val, filtered, part;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length != fparts.length) {
				fparts = $(fparts).filter(function(i,p){
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			if (parts.length == fparts.length) {
				for (var i=0, cnt = fparts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)) {
						switch(part) {
							case 'MM':
								filtered = $(dates[language].months).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(function(){
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				for (var i=0, s; i<setters_order.length; i++){
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s]))
						setters_map[s](date, parsed[s]);
				}
			}
			return date;
		},
		formatDate: function(date, format, language){
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			var date = [],
				seps = $.extend([], format.separators);
			for (var i=0, cnt = format.parts.length; i < cnt; i++) {
				if (seps.length)
					date.push(seps.shift());
				date.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		headTemplate: '<thead>'+
							'<tr>'+
								'<th class="prev"><i class="icon-arrow-left"/></th>'+
								'<th colspan="5" class="switch"></th>'+
								'<th class="next"><i class="icon-arrow-right"/></th>'+
							'</tr>'+
						'</thead>',
		contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr></tfoot>'
	};
	DPGlobal.template = '<div class="datepicker">'+
							'<div class="datepicker-days">'+
								'<table class=" table-condensed">'+
									DPGlobal.headTemplate+
									'<tbody></tbody>'+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-months">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-years">'+
								'<table class="table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
						'</div>';

	$.fn.datepicker.DPGlobal = DPGlobal;


}( window.jQuery );
    (function ($) {
        'use strict';

        var timepickerWrapper = '<div class="timepicker-wrapper input-icon-group"></div>';
        var timepickerLabel = '<label class="input-icon-label"><i class="tmicon tmicon-clock"></i></label>';
        //var TIME_REG = /^\d{0,2}(\D{1})\d{1,2}(\D{1})\d{1,2}$/;
        var KEY = {
            DOWN: 'D',
            UP: 'U',
            LEFT: 'L',
            RIGHT: 'R',
            TAB: 'T'
        };
        var formatError = new Error('Invalid Time Format!');
        var valueError = new Error('Invalid Value!');
        /* Utilities */
        function pad(num, n) {
            var len = num.toString().length;
            while (len < n) {
                num = "0" + num;
                len++;
            }
            return num;
        }

        function timeValidate(time) {
            var splitters = this.splitters;
            var formaters = this.formaters;
            var maxHours = this.options.maxHours;
            var maxMinutes = this.options.maxMinutes;
            var maxSeconds = this.options.maxSeconds;
            var timeArray;
            var timeText = '';

            if (time) {
                if (!time.match(this.valueReg)) throw valueError;
                formaters.forEach(function (format, index) {
                    var currentVal = RegExp['$' + (index + 1)];
                    if (format === 'hh' && currentVal > maxHours) throw valueError;
                    if (format === 'mm' && currentVal > maxMinutes) throw valueError;
                    if (format === 'ss' && currentVal > maxSeconds) throw valueError;
                    timeText += pad(currentVal, 2) + (splitters[index] || '');
                });
            } else if (this.notEmpty === false) {
                var $time = new Date();
                formater.forEach(function (format, index) {
                    if (format === 'hh') timeText += pad($time.getHours(), 2) + (splitters[index] || '');
                    if (format === 'mm') timeText += pad($time.getMinutes(), 2) + (splitters[index] || '');
                    if (format === 'ss') timeText += pad($time.getSeconds(), 2) + (splitters[index] || '');
                });
            }
            return timeText;
        }

        function parseFormat() {
            var formaters = this.formaters;
            var splitters = this.splitters;
            formaters.forEach(function (format, index) {
                var unit = format.substr(0, 1).toUpperCase();
                var pos = this[unit + '_POS'];
                var prepos, nextpos;

                formaters[index - 1] && (prepos = this[formaters[index - 1].substr(0, 1).toUpperCase() + '_POS']);
                formaters[index + 1] && (nextpos = this[formaters[index + 1].substr(0, 1).toUpperCase() + '_POS']);
                pos.length = format.length;
                if (index === 0) {
                    pos.start = 0;
                    //pos.end = pos.length - 1 + (splitters[index]? splitters[index].length : 0);
                    pos.end = splitters[index] ? pos.start + pos.length - 1 + splitters[index].length : pos.start + pos.length;
                    pos.prev = undefined;
                    pos.next = nextpos;
                } else {
                    pos.start = prepos.end + 1;
                    pos.end = splitters[index] ? pos.start + pos.length - 1 + splitters[index].length : pos.start + pos.length;
                    pos.prev = prepos;
                    pos.next = nextpos || undefined;
                }
                this.position.push(pos);
            }, this);
        }

        function getChunkPosition(start, end) {
            var position = this.position[0];
            if (start >= this.H_POS.start && start <= this.H_POS.end && end >= this.H_POS.start && end <= this.H_POS.end) {
                position = this.H_POS;
            }
            if (start >= this.M_POS.start && start <= this.M_POS.end && end >= this.M_POS.start && end <= this.M_POS.end) {
                position = this.M_POS;
            }
            if (start >= this.S_POS.start && start <= this.S_POS.end && end >= this.S_POS.start && end <= this.S_POS.end) {
                position = this.S_POS;
            }
            return position;
        }

        function getChunkNumber(value, position) {

            return parseInt(value.substring(position.start, position.end), 10);
        }

        function textReplace(value, position) {
            var splitter = this.splitters.slice(0);

            return this.position.reduce.call(this.position, function (acc, current) {
                if (current === position) {
                    return acc + pad(value, position.length) + (splitter.shift() || "");
                } else {
                    return acc + pad(this['org' + current.indicate], current.length) + (splitter.shift() || "");
                }
            }.bind(this), "");
        }

        // DATEPICKER CLASS DEFINITION
        // ===========================
        var Timepicker = function Timepicker(element, options) {
            this.H_POS = { indicate: 'H' };
            this.M_POS = { indicate: 'M' };
            this.S_POS = { indicate: 'S' };
            this.position = [];
            this.options = options;
            this.$body = $(document.body);
            this.$timepickerWrapper = $(timepickerWrapper);
            this.$element = $(element);
            this.$label = $(timepickerLabel).attr('for', this.$element.attr('id'));
            this.formaters = options.format.match(/(hh|mm|ss)/gi);
            this.splitters = options.format.match(/\W+/gi) || [];
            this.valueReg = new RegExp('^' + this.formaters.map(function (current, index) {
                var regText = '(\\d{2,2})';
                return regText += this.splitters[index] ? '\\D?' : '';
            }.bind(this)).join('') + '$', 'gi');
            this.orgValue = this.$element.val();
            this.orgClass = this.$element.attr('class');
            this.value = timeValidate.call(this, options.value || this.$element.val() || '');
            this.minHours = options.minHours;
            this.maxHours = options.maxHours;
            this.minMinutes = options.minMinutes;
            this.maxMinutes = options.maxMinutes;
            this.minSeconds = options.minSeconds;
            this.maxSeconds = options.maxSeconds;
            this.$element.addClass('form-control input-width-xs').attr({ 'data-role': 'timepicker-input' });
            this.$timepickerWrapper.insertBefore(this.$element).append(this.$element, this.$label);
            parseFormat.call(this);
            this._init();
        };

        Timepicker.VERSION = '1.0.0';

        Timepicker.DEFAULTS = {
            disabled: false,
            format: 'hh:mm:ss',
            notEmpty: true,
            minHours: 0,
            maxHours: 23,
            minMinutes: 0,
            maxMinutes: 59,
            minSeconds: 0,
            maxSeconds: 59,
            value: ''
        };

        Timepicker.prototype = {
            _init: function _init() {
                this.$element.val(this.value);
                //Initial varaibles
                this.position.forEach(function (pos) {
                    this['org' + pos.indicate] = getChunkNumber(this.value, pos);
                    this['tmp' + pos.indicate] = [];
                }, this);

                if (this.options.disabled === true) {
                    this.disable();
                }
            },
            _doFocus: function _doFocus(e) {
                var input = this.$element;
                var value = input.val();
                var start = input.prop('selectionStart');
                var end = input.prop('selectionEnd');
                if (!(start === 0 && end === 0)) {
                    this._showField(this.position[0]);
                    this._doEdit();
                }
            },
            _doBlur: function _doBlur(e) {
                this._tmpCheck({});
            },
            _doEdit: function _doEdit(e) {
                var input = this.$element;
                var value = input.val();
                var start = input.prop('selectionStart');
                var end = input.prop('selectionEnd');
                var position = getChunkPosition.call(this, start, end);

                if (!this._tmpCheck(position)) {
                    this.orgH = getChunkNumber(value, this.H_POS);
                    this.orgM = getChunkNumber(value, this.M_POS);
                    this.orgS = getChunkNumber(value, this.S_POS);
                    this.tmpH = [];
                    this.tmpM = [];
                    this.tmpS = [];
                }

                if (position.indicate) {
                    this._showField(position);
                    this._edit(value);
                }
            },
            _doKeydown: function _doKeydown(e) {
                var input = this.$element;
                var start = input.prop('selectionStart');
                var end = input.prop('selectionEnd');
                var position = getChunkPosition.call(this, start, end);
                var enterNum = e.key;
                var splitter = this.splitters;
                var timeText;
                if (!(start === 0 && end === 8) && position.indicate) {
                    // Up/Down arrow Key to change the digits
                    if (e.keyCode == 40) {
                        this._doUpDown(KEY.DOWN, position) || e.preventDefault();
                    } else if (e.keyCode == 38) {
                        this._doUpDown(KEY.UP, position) || e.preventDefault();
                    }
                    // Tab and Left/Right arrow Key to move selected position
                    if (e.keyCode == 39) {
                        this._doLeftRight(KEY.RIGHT, position) && e.preventDefault();
                    } else if (e.keyCode == 37) {
                        this._doLeftRight(KEY.LEFT, position) && e.preventDefault();
                    } else if (e.keyCode == 9) {
                        if (e.shiftKey === true) {
                            if (this._doLeftRight(KEY.LEFT, position) === true) {
                                return true;
                            } else {
                                e.preventDefault();
                            }
                        } else {
                            if (this._doLeftRight(KEY.RIGHT, position) === true) {
                                return true;
                            } else {
                                e.preventDefault();
                            }
                        }
                    }

                    //  Insert Number
                    if (/^\d$/.test(enterNum)) {
                        this._doInsertNumber(enterNum, position) || e.preventDefault();
                    }
                    //  Allow: Ctrl/cmd+C
                    if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;
                    // Allow: Delete/Backword
                    // if (e.keyCode === 8 || e.keyCode === 46) {
                    // 	this._doBack(position);
                    // }
                    e.preventDefault();
                } else {
                    // Allow: Ctrl/cmd+C
                    if (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) return true;
                    e.preventDefault();
                }
                return false;
            },
            _doInsertNumber: function _doInsertNumber(enterNum, position) {

                var tmp = this['tmp' + position.indicate];
                tmp.push(enterNum);

                var tmpString = tmp.join('');
                var tmpNumber = parseInt(tmpString, 10);

                if (position.indicate === 'H') {
                    var reachMax = true;
                    for (var i = 0; i < 10; i++) {
                        if (parseInt(tmpString + i, 10) <= this.maxHours) {
                            reachMax = false;
                        }
                    }
                    if (reachMax || tmp.length === position.length) {
                        if (tmpNumber > this.maxHours) {
                            this.orgH = this.maxHours;
                        } else if (tmpNumber < this.minHours) {
                            this.orgH = this.minHours;
                        } else {
                            this.orgH = tmpNumber;
                        }
                        this._jumpNextChunk(position);
                    } else {
                        var timeText = this._stayCurrentChunk(position);
                        this._change(timeText);
                    }
                }

                if (position.indicate === 'M') {
                    var reachMax = true;
                    for (var i = 0; i < 10; i++) {
                        if (parseInt(tmpString + i, 10) <= this.maxMinutes) {
                            reachMax = false;
                        }
                    }
                    if (reachMax || tmp.length === position.length) {
                        if (tmpNumber > this.maxMinutes) {
                            this.orgM = this.maxMinutes;
                        } else if (tmpNumber < this.minMinutes) {
                            this.orgM = this.minMinutes;
                        } else {
                            this.orgM = tmpNumber;
                        }
                        this._jumpNextChunk(position);
                    } else {
                        var timeText = this._stayCurrentChunk(position);
                        this._change(timeText);
                    }
                }

                if (position.indicate === 'S') {
                    var reachMax = true;
                    for (var i = 0; i < 10; i++) {
                        if (parseInt(tmpString + i, 10) <= this.maxSeconds) {
                            reachMax = false;
                        }
                    }
                    if (reachMax || tmp.length === position.length) {
                        if (tmpNumber > this.maxSeconds) {
                            this.orgS = this.maxSeconds;
                        } else if (tmpNumber < this.minSeconds) {
                            this.orgS = this.minSeconds;
                        } else {
                            this.orgS = tmpNumber;
                        }
                        this._jumpNextChunk(position);
                    } else {
                        var timeText = this._stayCurrentChunk(position);
                        this._change(timeText);
                    }
                }
            },
            _doUpDown: function _doUpDown(direction, position) {

                var timeText;

                this._applyTemp(position.indicate);

                if (position.indicate === 'H') {
                    if (direction === KEY.DOWN) this.orgH > this.minHours ? this.orgH-- : this.orgH === this.minHours ? this.orgH = this.maxHours : this.orgH = this.minHours;else this.orgH < this.maxHours ? this.orgH++ : this.orgH === this.maxHours ? this.orgH = this.minHours : this.orgH = this.maxHours;
                } else if (position.indicate === 'M') {

                    if (direction === KEY.DOWN) this.orgM > this.minMinutes ? this.orgM-- : this.orgM === this.minMinutes ? this.orgM = this.maxMinutes : this.orgM = this.minMinutes;else this.orgM < this.maxMinutes ? this.orgM++ : this.orgM === this.maxMinutes ? this.orgM = this.minMinutes : this.orgM = this.maxMinutes;
                } else if (position.indicate === 'S') {

                    if (direction === KEY.DOWN) this.orgS > this.minSeconds ? this.orgS-- : this.orgS === this.minSeconds ? this.orgS = this.maxSeconds : this.orgS = this.minSeconds;else this.orgS < this.maxSeconds ? this.orgS++ : this.orgS === this.maxSeconds ? this.orgS = this.minSeconds : this.orgS = this.maxSeconds;
                }

                timeText = this._autoCorrect(position.indicate);
                this.$element.val(timeText);
                this._showField(position);
                this._change(timeText);
            },
            _doLeftRight: function _doLeftRight(direction, position) {

                var tabable = false;

                if (direction === KEY.RIGHT) {
                    if (position.next) {
                        this._correctVal(position);
                        this._showField(position.next);
                    } else {
                        this._showField(position);
                        tabable = true;
                        //this._next();
                    }
                } else {
                    if (position.prev) {
                        this._correctVal(position);
                        this._showField(position.prev);
                    } else {
                        this._showField(position);
                        tabable = true;
                        //this._prev();
                    }
                }

                return tabable;
            },
            _denyPaste: function _denyPaste(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            },
            _jumpNextChunk: function _jumpNextChunk(position) {
                var timeText = this._autoCorrect(position.indicate);
                this.$element.val(timeText);
                this._showField(position.next || position);
                this._change(timeText);
            },
            _stayCurrentChunk: function _stayCurrentChunk(position) {
                var value = parseInt(this['tmp' + position.indicate].join(''), 10);
                var timeText = textReplace.call(this, value, position);
                this.$element.val(timeText);
                this._showField(position);
                return timeText;
            },
            _showField: function _showField(position) {
                var _this = this;
                this.$element[0].setSelectionRange(position.start, position.end);
                setTimeout(function () {
                    _this.$element[0].setSelectionRange(position.start, position.end);
                }, 20);
            },
            /* Events Triggerer */
            _edit: function _edit(time) {
                this.$element.trigger($.Event('edit'), [time]);
            },
            _change: function _change(time) {
                if (time === this.value) return;else this.value = time;

                this.$element.trigger($.Event('change'), [time]);
            },
            _prev: function _prev() {
                this.$element.trigger($.Event('prev'), [this.$element.val()]);
            },
            _next: function _next() {
                this.$element.trigger($.Event('next'), [this.$element.val()]);
            },
            /* Validators */
            _tmpCheck: function _tmpCheck(position) {
                var indicate = position.indicate;
                var useChrunk = false;
                if (this.tmpH.concat(this.tmpM, this.tmpS).length > 0) {
                    if (indicate) {
                        this.position.forEach(function (pos) {
                            if (this['tmp' + pos.indicate].length > 0 && indicate !== pos.indicate) {
                                this._correctVal(pos);
                                useChrunk = true;
                            }
                        }, this);
                    } else {
                        this.position.forEach(function (pos) {
                            if (this['tmp' + pos.indicate].length > 0) {
                                this._correctVal(pos);
                            }
                        }, this);
                    }
                }
                return useChrunk;
            },
            _correctVal: function _correctVal(position) {

                var timeText;
                if (this._applyTemp(position.indicate)) {
                    timeText = this._autoCorrect(position.indicate);
                    this.$element.val(timeText);
                    this._change(timeText);
                }
            },
            _applyTemp: function _applyTemp(indicate) {
                var tmp = this['tmp' + indicate];
                if (tmp.length > 0) {
                    this['org' + indicate] = parseInt(tmp.join(''), 10);
                    this['tmp' + indicate] = [];
                    return true;
                }
                return false;
            },
            _autoCorrect: function _autoCorrect(indicate) {
                var splitter = this.splitters.slice(0);
                if (indicate === 'H') {
                    if (this.orgH < this.minHours) this.orgH = this.minHours;
                    if (this.orgH > this.maxHours) this.orgH = this.maxHours;
                }

                if (indicate === 'M') {
                    if (this.orgM < this.minMinutes) this.orgM = this.minMinutes;
                    if (this.orgM > this.maxMinutes) this.orgM = this.maxMinutes;
                }

                if (indicate === 'S') {
                    if (this.orgS < this.minSeconds) this.orgS = this.minSeconds;
                    if (this.orgS > this.maxSeconds) this.orgS = this.maxSeconds;
                }

                this['tmp' + indicate] = [];

                return this.position.reduce.call(this.position, function (acc, current) {
                    return acc + pad(this['org' + current.indicate], current.length) + (splitter.shift() || "");
                }.bind(this), "");
            },
            _detachEvents: function _detachEvents() {},
            /* Public Methods */
            getTime: function getTime() {
                return this.value;
            },
            setValue: function setValue(value) {
                this.value = timeValidate.call(this, value);
                this._init();
            },
            getHours: function getHours() {
                return this.orgH;
            },
            setHours: function setHours(hour) {
                if (!isNaN(hour) && hour >= this.minHours && hour <= this.maxHours) {
                    this.orgH = hour;
                    this._autoCorrect(this.H_POS);
                    this.$element.val(this.value);
                    this._change(this.value);
                }
            },
            getMinutes: function getMinutes() {
                return this.orgM;
            },
            setMinutes: function setMinutes(min) {
                if (!isNaN(min) && min >= this.minMinutes && min <= this.maxMinutes) {
                    this.orgM = min;
                    this._autoCorrect(this.M_POS);
                    this.$element.val(this.value);
                    this._change(this.value);
                }
            },
            getSeconds: function getSeconds() {
                return this.orgS;
            },
            setSeconds: function setSeconds(sec) {
                if (!isNaN(sec) && sec >= this.minSeconds && sec <= this.maxSeconds) {
                    this.orgS = sec;
                    this._autoCorrect(this.S_POS);
                    this.$element.val(this.value);
                    this._change(this.value);
                }
            },
            disable: function disable() {
                this.$element.attr('disabled', true);
            },
            destroy: function destroy() {
                this.$element.removeAttr('class data-role').addClass(this.orgClass).val(this._value).insertBefore(this.$timepickerWrapper);
                this.$timepickerWrapper.add(this.$label).remove();
                delete this.$element.data()['bs.timepicker'];
            }
        };

        // DATEPICKER PLUGIN DEFINITION
        // ============================
        var Plugin = function Plugin(option, param) {
            var retval = null;
            this.each(function () {
                var $this = $(this);
                var data = $this.data('bs.timepicker');
                var options = $.extend({}, Timepicker.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);

                if (!data) $this.data('bs.timepicker', data = new Timepicker(this, options));
                if (typeof option == 'string') retval = data[option].call(data, param);
            });
            if (!retval) {
                retval = this;
            }
            return retval;
        };

        var old = $.fn.timepicker;

        $.fn.timepicker = Plugin;
        $.fn.timepicker.Constructor = Timepicker;

        // DATEPICKER NO CONFLICT
        // ======================

        $.fn.timepicker.noConflict = function () {
            $.fn.timepicker = old;
            return this;
        };

        // DATEPICKER DATA-API
        // ===================
        $(document).on('focus click blur keydown', '[data-role="timepicker-input"]', function (e) {
            var $this = $(this);
            var instance = $this.data('bs.timepicker');

            if (e.type === 'focusin') {
                instance._doFocus(e);
            }
            if (e.type === 'focusout') {
                instance._doBlur(e);
            }
            if (e.type === 'click') {
                instance._doEdit(e);
            }
            if (e.type === 'keydown') {
                instance._doKeydown(e);
            }
        });
    })(jQuery);