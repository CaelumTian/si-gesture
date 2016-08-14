;
(function(win) {
    "use strict";
    const doc = win.document,
          docEle = doc.documentElement;
    let gestures = {},        //全局保存手指信息
        lastTap = null;
    let Util = {
        extends(target, obj) {
            if(Object.assign) {
                Object.assign(target, obj);
            }else {
                for(var prop in obj) {
                    if(obj.hasOwnProperty[prop]) {
                        target[prop] = obj[prop];
                    }
                }
            }
        },
        /**
         * 检查ele1 是否包含 ele2节点
         */
        contains(ele1, ele2) {
            return a.contains ? a != b && a.contains(b) : !!(a.compareDocumentPosition(b) & 16);
        }
    }
    /**
     * 寻找两个几点的最小公共根节点
     * @param {HTMLElement} ele1, ele2 节点
     * @return {HTMLElement} 根节点
     * @private
     */
    function _getCommonRootNode(ele1, ele2) {
        while(ele1) {
            if(Util.contains(ele1, ele2) || ele1 === ele2) {
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
        if(typeof extra === 'object') {
            Util.extends(events, extra);
        }
        element.dispatchEvent(event);
    }
    let Handler = {
        touchStart(event) {
            //手势集合中没有内容的时候
            if(Object.keys(gestures).length === 0) {
                docEl.addEventListener('touchmove', Handler.touchMove, false);
                docEl.addEventListener('touchend', Handler.touchEnd, false);
                docEl.addEventListener('touchcancel', Handler.touchCancel, false);
            }
            //记录触发事件时改变的触摸点的集合
            for(let i = 0, len = event.changedTouches.length; i < len; i++) {
                let touch = event.changedTouches[i],
                    touchRecord = {};
                Util.extends(touchRecord, touch);
                //封装手势信息
                let gesture = {
                    startTouch: touchRecord,
                    startTime = Date.now(),
                    status: "tapping",
                    element: event.target,
                    //500ms后如果还处于tapping则触发press手势
                    pressingHandler: setTimeout(function(event, gesture) {
                        return tapTest;
                    }(event, this), 500)
                }
                //identifier 手指的唯一标识
                gestures[touch.identifier] = gesture;
            }
            function tapTest(gesture, event) {
                if(gesture.status === "tapping") {
                    gesture.status = "pressing";
                    fireEvent(event.target, 'press', {
                        touchEvent: event
                    })
                }
                clearTimeout(gesture.pressingHandler);
                gesture.pressingHandler = null;
            }
            //如果触摸点为2，则触发dualtouchstart手势，该手势的目标结点为两个触点共同的最小根结点
            if(Object.keys(gesture).length === 2) {
                let elements = [];
                for(var prop in gestures) {
                    elements.push(gestures.element);
                }
                _fireEvent(_getCommonRootNode(element[0], element[1]), 'dualtouchstart', {
                    touched: [].slice.call(event.touches),    //屏幕上所有的触摸点
                    touchEvent: event
                })
            }
         },
         touchMove() {

         }
    }
    docEle.addEventListener("touchstart", Handler.touchStart, false);
})(window, window.SI || (window.SI = {}))