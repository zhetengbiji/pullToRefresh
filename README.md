# pullToRefresh
基于mui整页滚动的下拉刷新和上拉加载
##引入
```
<link rel="stylesheet" href="css/mui.css">
<link rel="stylesheet" type="text/css" href="css/pullToRefresh.min.css" />
<script src="js/jquery.js"></script>
<script src="js/pullToRefresh.js"></script>
```
##初始化
```
var refresh = new Refresh('.mui-content');
```
##设置下拉刷新状态

```
refresh.pullToRefresh.type = 'start';//start:加载前；loading：加载中；
```
###设置上拉加载状态

```
refresh.pullToLoadMore.type = 'start';//start:加载前；loading：加载中；end：没有更多数据；none：不显示
```
###下拉刷新事件

```
refresh.onPullToRefresh = function() {}
```
###上拉加载事件
```
refresh.onPullToLoadMore = function() {}
```
###滚动到（只支持y轴滚动）
```
refresh.scrollTo(x,y,t);//x:x轴位置，y：y轴位置(不带单位)，t，滚动的总时间（毫秒）
```
###其他事件方法
* 监听事件：on
* 取消监听：off
###on方法支持的事件列表
* beforeScrollStart 滚动开始前
* scrollStart 滚动开始
* scroll 滚动中
* scrollEnd滚动结束
```
refresh.on('scroll',function(){
  console.log('滚动中');
});
```
