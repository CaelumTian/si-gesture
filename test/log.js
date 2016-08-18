(function(win) {
    var self = document.scripts[document.scripts.length - 1];
    href = win.location.href;
    var logEle,
        logEleClassName = self.getAttribute("data-class") || "m-log",
        showLog = self.getAttribute("data-showlog") || false,
        match = href.match(/[?|&]showlog=([^&]+)/i);    //匹配url中showlog字段
    if(match) {
        showLog = match[1].toLowerCase() === "true";
    }
    var console = window.console || {},
        _log = console.log,
        _warn = console.warn,
        _error = console.error,
        status = "log-normal";
    function prompt() {
        if(showLog !== "true") {
            return;
        }
        var msg = "";
        for(var i = 0, len = arguments.length; i < len; i++) {
            var obj = arguments[i];
            if(typeof obj !== "string" && typeof obj !== "number") {
                try {
                    if(JSON.stringify(obj)) {
                        obj = JSON.stringify(obj);
                    }else {
                        obj = obj.toString();
                    }
                }catch(e){}
            }
            //防止XSS
            if (typeof obj === 'string') {
                obj = obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            if (i == 0) {
                msg = obj;
            }else {
                msg += ' ' + obj;
            }
        }
        //没有log容器则创建
        var elem = logEle || (logEle = createLogElem());
        elem.innerHTML += '<span class="' + status + '">➜ </span>' + msg + '<br/>';
        elem.scrollTop = elem.scrollHeight - elem.clientHeight;
    }
    function createLogElem() {
        var elem = document.createElement('div');
        elem.className = logEleClassName;
        var css = '.' + logEleClassName + '{position:fixed;top:0;left:0;width:100%;max-height:305px;-webkit-box-sizing:border-box;box-sizing:border-box;font:12px Courier New;background-color:rgba(0,0,0,0.2);word-wrap:break-word;word-break:break-all;overflow-y:scroll;padding:5px;z-index:100000;background-color:#0d0d0d;color:#cacac0;}';
        css += '.' + logEleClassName + ':before{content:"﹀";position:fixed;top:0;right:0;height:20px;overflow:hidden;padding:8px 5px;-webkit-box-sizing:border-box;box-sizing:border-box;font:12px Arial;-webkit-transform-origin:50% 50%;}';
        css += '.' + logEleClassName + '.minimize{height:20px;}';
        css += '.' + logEleClassName + '.minimize:before{-webkit-transform:rotate(180deg);}';
        css += '.' + logEleClassName + ' .log-normal{color:#6ff876;}';
        css += '.' + logEleClassName + ' .log-warn{color:#fffa79;}';
        css += '.' + logEleClassName + ' .log-error{color:#f3634a;}';
        //插入样式节点
        var style = document.createElement('style');
        style.type = 'text/css';
        document.getElementsByTagName("head")[0].appendChild(style);
        style.appendChild(document.createTextNode(css));
        document.documentElement.appendChild(elem);
        elem.rect = elem.getBoundingClientRect();
        elem.minimize = false;
        elem.addEventListener('click', function (e) {
            var x = e.pageX, y = e.pageY, rect = elem.rect;
            if (x >= rect.left + rect.width - 20 &&
                x <= rect.left + rect.width &&
                y >= rect.top &&
                y <= rect.top + 20) {
                elem.minimize = !elem.minimize;
                elem.className = logEleClassName + (elem.minimize ? ' minimize' : '');
            }
        });

        return elem;
    }
    // TODO 这里是不是有点冗余啊
    console.log = function() {
        var args = [].slice.call(arguments);
        //控制台输出信息
        status = "log-normal";
        _log && _log.apply(console, args);
        prompt.apply(console, args);
    };
    console.warn = function() {
        var args = [].slice.call(arguments);
        //控制台输出信息
        _warn && _warn.apply(console, args);
        status = "log-warn";
        prompt.apply(console, args);
    };
    console.error = function() {
        var args = [].slice.call(arguments);
        //控制台输出信息
        _error && _error.apply(console, args);
        status = "log-error";
        prompt.apply(console, args);
    };
})(window);