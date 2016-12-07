/*
 *基于整页滚动的上啦加载与下拉刷新组件，依赖jQuery
 *由于依赖整页滚动，每个页面最多只能有1个实例
 *版本1.0
 * */
(function($) {
	if(!$) {
		throw new Error('no jQuery');
	}
	var Refresh = function(el, opation) {
		this.init(el);
	}
	Refresh.prototype.init = function(el) { //初始化
		var self = this;
		var iscroll = self.$el = $(el);
		var pullToRefresh = iscroll.find('.fullPage-refresh');
		var pullToLoadMore = iscroll.find('.fullPage-loadMore');
		var touchY0;
		var moveDown;
		var moveY = 0;
		//滚动方向，y轴
		self.directionY = 0;
		//最后一次的y值
		var lastY = self.y;
		//事件列表
		this._listener = {
			beforeScrollStart: [], //滚动开始以前
			scrollStart: [], // 滚动开始
			scroll: [], //滚动中
			scrollEnd: [], //滚动结束
		}

		iscroll.css('min-height', '100%');
		if(!pullToRefresh.length) {
			pullToRefresh = $('<div class="fullPage-refresh start">\
						<div class="mui-spinner"></div>\
						<div class="mui-icon mui-icon-pulldown"></div>\
						<div class="text"></div>\
					</div>');

			iscroll.prepend(pullToRefresh);
		}
		if(!pullToLoadMore.length) {
			pullToLoadMore = $('<div class="fullPage-loadMore "></div>');
			iscroll.append(pullToLoadMore);
		}
		//下拉刷新状态读写
		pullToRefresh._type = 'start';
		Object.defineProperty(pullToRefresh, "type", {
			get: function() {
				return this._type;
			},
			set: function(type) {
				var types = ['start', 'loading', 'end'];
				var index = types.indexOf(type);

				for(var i = 0; i < types.length; i++) {
					if(index === i) {
						this.addClass(types[i]);
					} else {
						this.removeClass(types[i]);
					}
				}
				switch(type) {
					case 'loading':
						iscroll.css({
							'-webkit-transition': '-webkit-transform 0.3s ease-out',
							'-webkit-transform': 'translate3d(0px, ' + 44 + 'px, 0px) translateZ(0px)',
						});
						break;
					case 'start':
						if(this._type === 'loading') {
							iscroll.css({
								'-webkit-transition': '-webkit-transform 0.3s ease-out',
								'-webkit-transform': 'translate3d(0px, ' + 0 + 'px, 0px) translateZ(0px)',
							});
						}
						break;
				}
				this._type = type;
			}
		});
		// 上拉加载状态读写
		pullToLoadMore._type = '';
		Object.defineProperty(pullToLoadMore, "type", {
			get: function() {
				return this._type;
			},
			set: function(type) {
				var types = ['none', 'start', 'loading', 'end'];
				var index = types.indexOf(type);
				this._type = type;
				for(var i = 0; i < types.length; i++) {
					if(index === i) {
						this.addClass(types[i]);
					} else {
						this.removeClass(types[i]);
					}
				}
			}
		});

		//下拉刷新
		function touchmove() {
			var touchY = event.touches[0].pageY;
			if(!moveDown) {
				if(touchY < touchY0) {
					iscroll.off('touchmove', touchmove);
					return;
				} else {
					moveDown = true;
				}
			}
			var moveY1 = ((touchY - touchY0) / 2) | 0;
			if(moveY1 !== moveY) {
				moveY = moveY1;
				iscroll.css('-webkit-transform', 'translate(0px, ' + moveY + 'px) translateZ(0px)');
				//下拉刷新状态
				if(moveY > 44) {
					self.pullToRefresh.type = 'end';
				} else {
					self.pullToRefresh.type = 'start';

				}
			}
			return false;
		}
		iscroll.on('touchstart', function() {
			iscroll.css({
				'-webkit-transition': 'none',
			});
			if(self.y === 0 && pullToRefresh.type === 'start') {
				touchY0 = event.touches[0].pageY;
				moveDown = false;
				iscroll.on('touchmove', touchmove);
				// return false;
			}
			self.fireEvent('beforeScrollStart'); //触发滚动前事件
		}).on('touchend', function() {
			iscroll.off('touchmove', touchmove);

			if(moveDown && pullToRefresh.type !== 'loading') {
				if(moveY > 44) {
					pullToRefresh.type = 'loading';

					if(typeof self.onPullToRefresh === 'function') {
						setTimeout(function() {
							self.onPullToRefresh();
						}, 200);
					}
				} else {
					iscroll.css({
						'-webkit-transition': '-webkit-transform 0.3s ease-out',
						'-webkit-transform': 'translate3d(0px, ' + 0 + 'px, 0px) translateZ(0px)',
					});
				}
				return false;
			}

		});

		//上拉加载
		function loadMore() {
			if(pullToLoadMore.type === 'start') {
				self.pullToLoadMore.type = 'loading';
				if(typeof self.onPullToLoadMore === 'function') {
					self.onPullToLoadMore();
				}
			}
		}
		//监听滚动到底部
		if(!!navigator.userAgent.match(/Html5Plus/i)) { //app内使用h5+页面滚动到底部事件
			document.addEventListener("plusscrollbottom", loadMore, false);
		} else { //app外使用window滚动事件
			document.addEventListener("scroll", function() {
				if(screen.height + window.scrollY === document.body.scrollHeight) {
					loadMore();
				}
			}, false);
		}

		self.pullToRefresh = pullToRefresh;
		self.pullToLoadMore = pullToLoadMore;
		self.onPullToRefresh = function() {
			console.log('onPullToRefresh');
		}
		self.onPullToLoadMore = function() {
			console.log('onPullToLoadMore');
		}

		//y坐标读取
		Object.defineProperty(self, "y", {
			get: function() {
				return -window.scrollY;
			}
		});

		//触发滚动事件 scrollStart scroll scrollEnd
		var isScroll = false; //是否滚动
		var STOPTIME = 100; //滚动停止判断时间，毫秒
		var lastTime = 0; //最后一次滚动的时间

		var timing = function() { //计时
			setTimeout(function() {
				var now = Date.now();
				if(now - lastTime > STOPTIME) { //判定为停止
					isScroll = false;
					self.directionY = 0;
					self.fireEvent('scrollEnd'); //触发滚动停止事件
				} else {
					timing();
				}
			}, STOPTIME);
		}

		document.addEventListener("scroll", function() {
			if(!isScroll) {
				isScroll = true;
				self.fireEvent('scrollStart'); //触发滚动开始事件
				timing();
			}
			//更新滚动方向
			if(lastY > self.y) { //向上滚动
				self.directionY = 1;
			} else {
				self.directionY = -1;
			}
			lastY = self.y;

			lastTime = Date.now();
			self.fireEvent('scroll'); //触发滚动事件
		}, false);

	}

	//刷新滚动（不需要仅占位）
	Refresh.prototype.refresh = function() {
		//console.log('refresh');
	}

	//滚动到
	Refresh.prototype.scrollTo = function(x, y, t) { //x:x轴位置，y：y轴位置，t，滚动的总时间（实际只支持y轴滚动）
		var self = this;
		var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
		var startTime = Date.now();
		var startY = self.y;

		function scroll() {
			requestAnimationFrame(function() {
				var newY = (startY + (y - startY) / t * (Date.now() - startTime)) | 0;
				if(y === newY || (y > startY && y < newY) || (y < startY && y > newY)) { //已滚到目标位置
					newY = y;
				} else {
					scroll();
				}
				window.scrollTo(x, -newY);
			});

		}
		scroll();
	}

	//定义事件相关

	//监听事件
	Refresh.prototype.on = function(eventName, callback) {
		var self = this;
		var events = eventName.split(' ');
		events.forEach(function(eventName) {
			if(typeof callback === 'function') {
				self._listener[eventName].push(callback);
			}
		});
	}

	//触发事件
	Refresh.prototype.fireEvent = function(eventName, data) {
		var listener = this._listener[eventName];
		if(listener && listener.length) {
			listener.forEach(function(event) {
				event(data);
			});
		}
	}

	//取消监听 
	Refresh.prototype.off = function(eventName, callback) {
		var self = this;
		var events = eventName.split(' ');
		events.forEach(function(eventName) {
			if(callback) {
				var index = self._listener[eventName].indexOf(callback);
				self._listener[eventName].splice(index);
			} else {
				self._listener[eventName] = [];
			}
		});
	}

	//定义到全局
	window.Refresh = Refresh;

})(jQuery);