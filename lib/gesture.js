'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

;
(function (win) {
    "use strict";

    var doc = win.document,
        docEle = doc.documentElement;
    var gestures = {},
        //全局保存手指信息
    lastTap = null; //双击记录
    var Util = {
        extends: function _extends(target, obj) {
            if (Object.assign) {
                Object.assign(target, obj);
            } else {
                for (var prop in obj) {
                    if (obj.hasOwnProperty[prop]) {
                        target[prop] = obj[prop];
                    }
                }
            }
        },

        /**
         * 检查ele1 是否包含 ele2节点
         */
        contains: function contains(ele1, ele2) {
            return ele1.contains ? ele1 != ele2 && ele1.contains(ele2) : !!(ele1.compareDocumentPosition(ele2) & 16);
        }
    };
    /**
     * 寻找两个几点的最小公共根节点
     * @param {HTMLElement} ele1, ele2 节点
     * @return {HTMLElement} 根节点
     * @private
     */
    function _getCommonRootNode(ele1, ele2) {
        while (ele1) {
            if (Util.contains(ele1, ele2) || ele1 === ele2) {
                return ele1;
            }
            ele1 = ele1.parentNode;
        }
        return null;
    }
    /**
     * 触发一个事件
     * @param {HTMLElement} element 目标节点
     * @param {String} type         事件类型
     * @param {Object} extra        对事件对象的扩展
     * @private
     */
    function _fireEvent(element, type, extra) {
        var event = doc.createEvent('HTMLEvents');
        event.initEvent(type, true, true);
        if ((typeof extra === 'undefined' ? 'undefined' : _typeof(extra)) === 'object') {
            Util.extends(event, extra);
        }
        element.dispatchEvent(event);
    }
    /**
     * 计算触控坐标变换
     * 设坐标系上有ABCD四个点， AB为手指起始位置  CD为手指运动到的位置
     * rotate旋转: AB到CD的旋转角度
     * scale 缩放: AB到CD长度的变换比例
     * translate位移: A点到C点的横纵坐标位移
     * @params {Number} ABCD四个点的坐标
     * @return {Object} 返回变换效果
     */
    function _calcAction(x1, y1, x2, y2, x3, y3, x4, y4) {
        var rotate = Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y2 - y1, x2 - x1),
            scale = Math.sqrt((Math.pow(y4 - y3, 2) + Math.pow(x4 - x3, 2)) / (Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2))),
            translate = [x3 - scale * x1 * Math.cos(rotate) + scale * y1 * Math.sin(rotate), y3 - scale * y1 * Math.cos(rotate) - scale * x1 * Math.sin(rotate)];
        return {
            rotate: rotate,
            scale: scale,
            translate: translate,
            /**
             * |ax + cy + e|
             * |bx + dy + f|
             * | 0 +  0 + 1|
             */
            martrix: [[scale * Math.cos(rotate), -scale * Math.sin(rotate), translate[0]], [scale * Math.sin(rotate), scale * Math.cos(rotate), translate[1]], [0, 0, 1]]
        };
    }
    var Handler = {
        touchStart: function touchStart(event) {
            //手势集合中没有内容的时候
            if (Object.keys(gestures).length === 0) {
                docEle.addEventListener('touchmove', Handler.touchMove, false);
                docEle.addEventListener('touchend', Handler.touchEnd, false);
                docEle.addEventListener('touchcancel', Handler.touchCancel, false);
            }
            //记录触发事件时改变的触摸点的集合
            console.log(event.changedTouches);

            var _loop = function _loop(i, len) {
                var touch = event.changedTouches[i],
                    touchRecord = {};
                Util.extends(touchRecord, touch);
                //封装手势信息
                var gesture = {
                    startTouch: touchRecord,
                    startTime: Date.now(),
                    status: "tapping",
                    element: event.target,
                    //500ms后如果还处于tapping则触发press手势
                    pressingHandler: setTimeout(function (element) {
                        return function () {
                            if (gesture.status === "tapping") {
                                gesture.status = "pressing";
                                _fireEvent(element, 'press', {
                                    touchEvent: event
                                });
                            }
                            clearTimeout(gesture.pressingHandler);
                            gesture.pressingHandler = null;
                        };
                    }(event.target), 500)
                };
                //identifier 手指的唯一标识
                gestures[touch.identifier] = gesture;
            };

            for (var i = 0, len = event.changedTouches.length; i < len; i++) {
                _loop(i, len);
            }
            //如果触摸点为2，则触发dualtouchstart手势，该手势的目标结点为两个触点共同的最小根结点
            if (Object.keys(gestures).length === 2) {
                var elements = [];
                for (var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                //console.log(elements);
                console.log(_getCommonRootNode(elements[0], elements[1]));
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), 'dualtouchstart', {
                    touched: [].slice.call(event.touches), //屏幕上所有的触摸点
                    touchEvent: event
                });
            }
        },
        touchMove: function touchMove(event) {
            for (var i = 0, len = event.changedTouches.length; i < len; i++) {
                var touch = event.changedTouches[i],
                    _gesture = gestures[touch.identifier];
                if (!_gesture) {
                    return;
                }
                _gesture.lastTouch = _gesture.lastTouch || _gesture.startTouch;
                _gesture.lastTime = _gesture.lastTime || _gesture.startTime;
                //x, y速率
                _gesture.velocityX = _gesture.velocityX || 0;
                _gesture.velocityY = _gesture.velocityY || 0;
                _gesture.duration = _gesture.duration || 0;
                var time = Date.now() - _gesture.lastTime;
                var vx = (touch.clientX - _gesture.lastTouch.clientX) / time,
                    vy = (touch.clientY - _gesture.lastTouch.clientY) / time;
                //记录时间
                var RECORD_DURATION = 70;
                if (time > RECORD_DURATION) {
                    time = RECORD_DURATION;
                }
                if (_gesture.duration + time > RECORD_DURATION) {
                    _gesture.duration = RECORD_DURATION - time;
                }
                _gesture.velocityX = (_gesture.velocityX * _gesture.duration + vx * time) / (_gesture.duration + time);
                _gesture.velocityY = (_gesture.velocityY * _gesture.duration + vy * time) / (_gesture.duration + time);
                _gesture.duration += time;
                _gesture.lastTouch = {};

                Util.extends(_gesture.lastTouch, touch);
                _gesture.lastTime = Date.now();
                //移动距离
                var distanceX = touch.clientX - _gesture.startTouch.clientX,
                    distanceY = touch.clientY - _gesture.startTouch.clientY,
                    distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

                //pan 平移检测
                if ((_gesture.status === "tapping" || _gesture.status === "pressing") && distance > 10) {
                    _gesture.status = "panning";
                    //是否垂直
                    _gesture.isVertical = !(Math.abs(distanceX) > Math.abs(distanceY));
                    //开始平移
                    _fireEvent(_gesture.element, 'panstart', {
                        touch: touch,
                        touchEvent: event,
                        isVertical: _gesture.isVertical
                    });
                    //方向上的开始平移
                    _fireEvent(_gesture.element, (_gesture.isVertical ? 'vertical' : 'horizontal') + 'panstart', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                //平移中
                if (_gesture.status === "panning") {
                    _gesture.panTime = Date.now();
                    _fireEvent(_gesture.element, "pan", {
                        distanceX: distanceX,
                        distanceY: distanceY,
                        touch: touch,
                        touchEvent: event,
                        isVertical: _gesture.isVertical
                    });
                    if (_gesture.isVertical) {
                        _fireEvent(_gesture.element, 'verticalpan', {
                            distanceY: distanceY,
                            touch: touch,
                            touchEvent: event
                        });
                    } else {
                        _fireEvent(_gesture.element, 'horizontalpan', {
                            distanceX: distanceX,
                            touch: touch,
                            touchEvent: event
                        });
                    }
                }
            }
            //当前的触摸点为2个
            if (Object.keys(gestures).length === 2) {
                var startPosition = [],
                    //触控起始位置
                currentPosition = [],
                    //触控当前位置
                elements = [],
                    //存放当前节点元素
                transform = void 0;
                for (var _i = 0, _len = event.touches.length; _i < _len; _i++) {
                    var _touch = event.touches[_i];
                    var _gesture2 = gestures[_touch.identifier];
                    startPosition.push([_gesture2.startTouch.clientX, _gesture2.startTouch.clientY]);
                    currentPosition.push([_touch.clientX, _touch.clientY]);
                }
                for (var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                transform = _calcAction(startPosition[0][0], startPosition[0][1], startPosition[1][0], startPosition[1][1], currentPosition[0][0], currentPosition[0][1], currentPosition[1][0], currentPosition[1][1]);
                //触发双指触摸
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), "dualtouch", {
                    transform: transform,
                    touches: event.touches,
                    touchEvent: event
                });
            }
        },
        touchEnd: function touchEnd(event) {
            //双指
            if (Object.keys(gestures).length === 2) {
                var elements = [];
                for (var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), 'dualtouchend', {
                    touches: [].slice.call(event.touches),
                    touchEvent: event
                });
            }
            for (var i = 0, len = event.changedTouches.length; i < len; i++) {
                var touch = event.changedTouches[i],
                    id = touch.identifier,
                    _gesture3 = gestures[id];
                if (!_gesture3) {
                    continue;
                }
                //删除按压的定时器
                if (_gesture3.pressingHandler) {
                    clearTimeout(_gesture3.pressingHandler);
                    _gesture3.pressingHandler = null;
                }
                if (_gesture3.status === 'tapping') {
                    _gesture3.timestamp = Date.now();
                    //触发tap事件
                    _fireEvent(_gesture3.element, 'tap', {
                        touch: touch,
                        touchEvent: event
                    });
                    //300ms以内触发双击
                    if (lastTap && _gesture3.timestamp - lastTap.timestamp < 300) {
                        _fireEvent(_gesture3.element, "doubletap", {
                            touch: touch,
                            touchEvent: event
                        });
                    }
                    lastTap = _gesture3;
                }
                if (_gesture3.status === "panning") {
                    var now = Date.now();
                    var duration = now - _gesture3.startTime,
                        distanceX = touch.clientX - _gesture3.startTouch.clientX,
                        distanceY = touch.clientY - _gesture3.startTouch.clientY;
                    var velocity = Math.sqrt(Math.pow(_gesture3.velocityY, 2) + Math.pow(_gesture3.velocityX, 2));
                    //轻抚 合速度 > 0.5 触摸事件小于100ms
                    var isflick = velocity > 0.5 && now - _gesture3.lastTime < 100;
                    var extra = {
                        duration: duration,
                        isflick: isflick,
                        velocityX: _gesture3.velocityX,
                        velocityY: _gesture3.velocityY,
                        distanceX: distanceX,
                        distanceY: distanceY,
                        touch: touch,
                        touchEvent: event,
                        isVertical: _gesture3.isVertical
                    };
                    //平移结束事件
                    _fireEvent(_gesture3.element, 'panend', extra);
                    //轻抚一些列事件触发
                    if (isflick) {
                        _fireEvent(_gesture3.element, 'flick', extra);
                        if (_gesture3.isVertical) {
                            _fireEvent(_gesture3.element, 'verticalflick', extra);
                        } else {
                            _fireEvent(_gesture3.element, 'horizontalflick', extra);
                        }
                    }
                }
                //按压事件结束
                if (_gesture3.status === 'pressing') {
                    _fireEvent(_gesture3.element, 'pressend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                //删除全局记录的手指信息
                delete gestures[id];
            }
            if (Object.keys(gestures).length === 0) {
                docEle.removeEventListener("touchmove", Handler.touchMove, false);
                docEle.removeEventListener("touchend", Handler.touchEnd, false);
                docEle.removeEventListener("toucancel", Handler.touchCancel, false);
            }
        },
        touchCancel: function touchCancel(event) {
            if (Object.keys(gestures).length === 2) {
                var elements = [];
                for (var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), "dualtouchend", {
                    touches: [].slice.call(event.touches),
                    touchEvent: event
                });
            }
            for (var i = 0, len = event.changedTouches.length; i < len; i++) {
                var touch = event.changedTouches[i],
                    id = touch.identifier,
                    _gesture4 = gestures[id];
                if (!_gesture4) {
                    continue;
                }
                if (_gesture4.pressingHandler) {
                    clearTimeout(_gesture4.pressingHandler);
                    _gesture4.pressingHandler = null;
                }
                if (_gesture4.status === 'panning') {
                    _fireEvent(_gesture4.element, 'panend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                if (_gesture4.status === 'pressing') {
                    _fireEvent(_gesture4.element, 'pressend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                delete gestures[id];
            }
            if (Object.keys(gestures).length === 0) {
                docEle.removeEventListener("touchmove", Handler.touchMove, false);
                docEle.removeEventListener("touchend", Handler.touchEnd, false);
                docEle.removeEventListener("toucancel", Handler.touchCancel, false);
            }
        }
    };
    docEle.addEventListener("touchstart", Handler.touchStart, false);
})(window, window.SI || (window.SI = {}));