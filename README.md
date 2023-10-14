# focus-sky

焦点天空的特性：

- 支持嵌套结构；
- 延迟聚焦与失焦；
- 具备开关功能的入口；
- 蒙层出口；
- <kbd>Esc</kbd> 出口；
- 焦点矫正；
- 导航序列或范围。

TODO:
- 优化：缓存当前导航的列表；
- 优化：蒙层退出。

基本入参结构：

```json
{
  "root": "#app",
  "entry": "#en1",
  "exit": "#ex1",
  "list": ["#i1", "#i2", {
    "entry": "#en2",
    "exit": "#ex2",
    "list": ["#i3"]
  }]
}
```

多组情况，类似如下：

```javascript
focusky(root, [{
  entry,
  exit,
  list
}, {
  entry,
  exit,
  list
}]);
```