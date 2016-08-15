;
(function (win) {
    "use strict";
    const doc = win.document,
        docEle = doc.documentElement;
    let gestures = {},        //全局保存手指信息
        lastTap = null;       //双击记录
    let Util = {
        extends(target, obj) {
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
        contains(ele1, ele2) {
            return ele1.contains ? ele1 != ele2 && ele1.contains(ele2) : !!(ele1.compareDocumentPosition(ele2) & 16);
        }
    }
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
        if (typeof extra === 'object') {
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
        let rotate = Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y2 - y1, x2 - x1),
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
            martrix: [
                [scale * Math.cos(rotate), -scale * Math.sin(rotate), translate[0]],
                [scale * Math.sin(rotate), scale * Math.cos(rotate), translate[1]],
                [0, 0, 1]
            ]
        }
    }
    let Handler = {
        touchStart(event) {
            //手势集合中没有内容的时候
            if (Object.keys(gestures).length === 0) {
                docEle.addEventListener('touchmove', Handler.touchMove, false);
                docEle.addEventListener('touchend', Handler.touchEnd, false);
                docEle.addEventListener('touchcancel', Handler.touchCancel, false);
            }
            //记录触发事件时改变的触摸点的集合
            console.log(event.changedTouches);
            for (let i = 0, len = event.changedTouches.length; i < len; i++) {
                let touch = event.changedTouches[i],
                    touchRecord = {};
                Util.extends(touchRecord, touch);
                //封装手势信息
                let gesture = {
                    startTouch: touchRecord,
                    startTime: Date.now(),
                    status: "tapping",
                    element: event.target,
                    //500ms后如果还处于tapping则触发press手势
                    pressingHandler: setTimeout(function (element) {
                        return function() {
                            if (gesture.status === "tapping") {
                                gesture.status = "pressing";
                                _fireEvent(element, 'press', {
                                    touchEvent: event
                                })
                            }
                            clearTimeout(gesture.pressingHandler);
                            gesture.pressingHandler = null;
                        }
                    } (event.target), 500)
                }
                //identifier 手指的唯一标识
                gestures[touch.identifier] = gesture;
            }
            //如果触摸点为2，则触发dualtouchstart手势，该手势的目标结点为两个触点共同的最小根结点
            if (Object.keys(gestures).length === 2) {
                let elements = [];
                for (var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                //console.log(elements);
                console.log(_getCommonRootNode(elements[0], elements[1]));
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), 'dualtouchstart', {
                    touched: [].slice.call(event.touches),    //屏幕上所有的触摸点
                    touchEvent: event
                })
            }
        },
        touchMove(event) {
            for (let i = 0, len = event.changedTouches.length; i < len; i++) {
                let touch = event.changedTouches[i],
                    gesture = gestures[touch.identifier];
                if(!gesture) {
                    return;
                }
                gesture.lastTouch = gesture.lastTouch || gesture.startTouch;
                gesture.lastTime = gesture.lastTime || gesture.startTime;
                //x, y速率
                gesture.velocityX = gesture.velocityX || 0;
                gesture.velocityY = gesture.velocityY || 0;
                gesture.duration = gesture.duration || 0;
                let time = Date.now() - gesture.lastTime;
                let vx = (touch.clientX - gesture.lastTouch.clientX) / time,
                    vy = (touch.clientY - gesture.lastTouch.clientY) / time;
                //记录时间
                const RECORD_DURATION = 70;
                if(time > RECORD_DURATION) {
                    time = RECORD_DURATION;
                }
                if(gesture.duration + time > RECORD_DURATION) {
                    gesture.duration = RECORD_DURATION - time;
                }
                gesture.velocityX = (gesture.velocityX * gesture.duration + vx * time) / (gesture.duration+ time);
                gesture.velocityY = (gesture.velocityY * gesture.duration + vy * time) / (gesture.duration+ time);
                gesture.duration += time;
                gesture.lastTouch = {};

                Util.extends(gesture.lastTouch, touch);
                gesture.lastTime = Date.now();
                //移动距离
                let distanceX = touch.clientX - gesture.startTouch.clientX,
                    distanceY = touch.clientY - gesture.startTouch.clientY,
                    distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

                //pan 平移检测
                if((gesture.status === "tapping" || gesture.status === "pressing") && distance > 10) {
                    gesture.status = "panning";
                    //是否垂直
                    gesture.isVertical = !(Math.abs(distanceX) > Math.abs(distanceY));
                    //开始平移
                    _fireEvent(gesture.element, 'panstart', {
                        touch:touch,
                        touchEvent:event,
                        isVertical: gesture.isVertical
                    });
                    //方向上的开始平移
                    _fireEvent(gesture.element, (gesture.isVertical ? 'vertical' : 'horizontal') + 'panstart', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                //平移中
                if(gesture.status === "panning") {
                    gesture.panTime = Date.now();
                    _fireEvent(gesture.element, "pan", {
                        distanceX: distanceX,
                        distanceY: distanceY,
                        touch: touch,
                        touchEvent: event,
                        isVertical: gesture.isVertical
                    });
                    if(gesture.isVertical) {
                        _fireEvent(gesture.element, 'verticalpan', {
                            distanceY: distanceY,
                            touch: touch,
                            touchEvent: event
                        })
                    }else {
                        _fireEvent(gesture.element, 'horizontalpan', {
                            distanceX: distanceX,
                            touch: touch,
                            touchEvent: event
                        })
                    }
                }
            }
            //当前的触摸点为2个
            if(Object.keys(gestures).length === 2) {
                let startPosition = [],       //触控起始位置
                    currentPosition = [],     //触控当前位置
                    elements = [],            //存放当前节点元素
                    transform;
                for(let i = 0, len = event.touches.length; i < len; i++) {
                    let touch = event.touches[i];
                    let gesture = gestures[touch.identifier];
                    startPosition.push([gesture.startTouch.clientX, gesture.startTouch.clientY]);
                    currentPosition.push([touch.clientX, touch.clientY]);
                }
                for(var prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                transform = _calcAction(startPosition[0][0], startPosition[0][1], startPosition[1][0], startPosition[1][1], currentPosition[0][0], currentPosition[0][1], currentPosition[1][0], currentPosition[1][1]);
                //触发双指触摸
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), "dualtouchmove", {
                    transform: transform,
                    touches: event.touches,
                    touchEvent: event
                })
            }
        },
        touchEnd(event) {
            //双指
            if(Object.keys(gestures).length === 2) {
                let elements = [];
                for(let prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), 'dualtouchend', {
                    touches: [].slice.call(event.touches),
                    touchEvent: event
                });
            }
            for(let i = 0, len = event.changedTouches.length; i < len; i++) {
                let touch = event.changedTouches[i],
                    id = touch.identifier,
                    gesture = gestures[id];
                if(!gesture) {
                    continue;
                }
                //删除按压的定时器
                if(gesture.pressingHandler) {
                    clearTimeout(gesture.pressingHandler);
                    gesture.pressingHandler = null;
                }
                if(gesture.status === 'tapping') {
                    gesture.timestamp = Date.now();
                    //触发tap事件
                    _fireEvent(gesture.element, 'tap', {
                        touch: touch,
                        touchEvent: event
                    })
                    //300ms以内触发双击
                    if(lastTap && gesture.timestamp - lastTap.timestamp < 300) {
                        _fireEvent(gesture.element, "doubletap", {
                            touch: touch,
                            touchEvent: event
                        })
                    }
                    lastTap = gesture;
                }
                if(gesture.status === "panning") {
                    let now = Date.now();
                    let duration = now - gesture.startTime,
                        distanceX = touch.clientX - gesture.startTouch.clientX,
                        distanceY = touch.clientY - gesture.startTouch.clientY;
                    let velocity = Math.sqrt(Math.pow(gesture.velocityY, 2) + Math.pow(gesture.velocityX, 2));
                    //轻抚 合速度 > 0.5 触摸事件小于100ms
                    let isflick = velocity > 0.5 && (now - gesture.lastTime) < 100;
                    let extra = {
                        duration: duration,
                        isflick: isflick,
                        velocityX: gesture.velocityX,
                        velocityY: gesture.velocityY,
                        distanceX: distanceX,
                        distanceY: distanceY,
                        touch: touch,
                        touchEvent: event,
                        isVertical: gesture.isVertical
                    }
                    //平移结束事件
                    _fireEvent(gesture.element, 'panend', extra);
                    //轻抚一些列事件触发
                    if(isflick) {
                        _fireEvent(gesture.element, 'flick', extra);
                        if(gesture.isVertical) {
                            _fireEvent(gesture.element, 'verticalflick', extra);
                        }else {
                            _fireEvent(gesture.element, 'horizontalflick', extra);
                        }
                    }
                }
                //按压事件结束
                if(gesture.status === 'pressing') {
                    _fireEvent(gesture.element, 'pressend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                //删除全局记录的手指信息
                delete gestures[id];
            }
            if(Object.keys(gestures).length === 0) {
                docEle.removeEventListener("touchmove", Handler.touchMove, false);
                docEle.removeEventListener("touchend", Handler.touchEnd, false);
                docEle.removeEventListener("toucancel", Handler.touchCancel, false);
            }
        },
        touchCancel(event) {
            if(Object.keys(gestures).length === 2) {
                let elements = [];
                for(let prop in gestures) {
                    elements.push(gestures[prop].element);
                }
                _fireEvent(_getCommonRootNode(elements[0], elements[1]), "dualtouchend", {
                    touches: [].slice.call(event.touches),
                    touchEvent: event
                });
            }
            for(let i = 0, len = event.changedTouches.length; i < len; i++) {
                let touch = event.changedTouches[i],
                    id = touch.identifier,
                    gesture = gestures[id];
                if(!gesture) {
                    continue;
                }
                if(gesture.pressingHandler) {
                    clearTimeout(gesture.pressingHandler);
                    gesture.pressingHandler = null;
                }
                if(gesture.status === 'panning') {
                    _fireEvent(gesture.element, 'panend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                if (gesture.status === 'pressing') {
                    _fireEvent(gesture.element, 'pressend', {
                        touch: touch,
                        touchEvent: event
                    });
                }
                delete gestures[id];
            }
            if(Object.keys(gestures).length === 0) {
                docEle.removeEventListener("touchmove", Handler.touchMove, false);
                docEle.removeEventListener("touchend", Handler.touchEnd, false);
                docEle.removeEventListener("toucancel", Handler.touchCancel, false);
            }
        }
    }
    docEle.addEventListener("touchstart", Handler.touchStart, false);
})(window, window.SI || (window.SI = {}))