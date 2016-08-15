si-gesture 移动端手势组件  
===  
![](https://travis-ci.org/T-phantom/si-gesture.svg?branch=master) ![](https://img.shields.io/badge/npm-v1.0.0-blue.svg)   
移动端手势库， 提供了多重手势可供选择，进需要添加对应的手势事件名称即可 
## 使用方法   
引入gesture.js文件(注意src中需要ES6支持，lib中不需要支持   
在任意元素上添加对应的事件
```javascript  
document.getElementById("aim").addEventListener("tap", function(event) {
    console.log(event);
}, false);
```  
## 手势事件列表      

|手势事件|说明|触发条件|event对象补充|
|:---:|:---:|:-----:|:---:|        
|tap     |轻触|touchend时检测触发|无 |    
|doubletp|双触摸|300ms内触发两次tap|无|  
|press|长按|tap后500ms后仍没有抬起手指|无|  
|pressend|长按结束|prees后抬起手指|无|  
|panstart|平移开始|处于press中且移动距离大于10像素|Boolean `isVertical` (是否垂直移动)|  
|pan|平移中|处于press中且移动距离大于10像素|Float `distanceX`(X轴移动距离);Float `distanceY`(Y轴移动距离);Boolean `isVertical`(是否垂直移动)|  
|horizonpan verticalpan|水平和垂直平移|同pan事件|同pan事件，但只有一个方向的距离|  
|paned|平移结束|手指抬起后|包含pan中结果;Float `velocityX`(X轴平移速度);Float `velocityY`(Y轴平移速度);Boolean `isflick`(是否是flick事件)| 
|flick|轻抚|penned时检测合速度大于0.5,触摸时间小于100ms|同panned|
|verticalflick horizonflick|垂直和水平轻抚|同上|同上|  
|dualtouchstart|双指触摸开始|两个手指头触摸屏幕触发|Array `touched`(屏幕上所有触摸点)|  
|dualtouchmove|双指移动|dualtouchtart移动(旋转，缩放，位移)|Object `transform`{rotate: 旋转角度, scale: 缩放比例, translate: 移动距离, martix: 变换矩阵};|   


### 补充说明  
1. dualtouch 目前检测的是多指， 但只对两指做计算，返回变换结果。如果两个手指不在同一个元素上，则让两个元素最小的公共父节点触发事件。  
2. 多指触控时计算规则：
     * 设坐标系上有ABCD四个点， AB为手指起始位置  CD为手指运动到的位置
     * rotate旋转: AB到CD的旋转角度
     * scale 缩放: AB到CD长度的变换比例
     * translate位移: A点到C点的横纵坐标位移
     * @params {Number} ABCD四个点的坐标
     * @return {Object} 返回变换效果  
       
## 待更新问题  
1. 添加更多的手势事件，支持两指以上检测。  
2. 考虑是否吧rotate，scale两指的参数单独做成事件  

 
   

