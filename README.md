# WZ Style Plugin

一个用于将 CSS 样式转换为 WZ 类名的 [TemPad Dev](https://github.com/ecomfe/tempad-dev) 插件。

该插件可以智能识别 CSS 样式并转换为对应的 WZ 类名，支持 padding、margin、font-size 等属性的组合匹配和转换。

> 详细的样式规范和类名说明请参考 [WZ Taro Tools 文档](https://wz-taro-tools.now.baidu-int.com/components/style/)

## 安装

1. 从 Chrome Web Store 安装 [TemPad Dev](https://chromewebstore.google.com/detail/tempad-dev/lgoeakbaikpkihoiphamaeopmliaimpc)

2. 在 TemPad Dev 的插件区域安装 `@wz` 插件

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/demo-dark.gif">
  <source media="(prefers-color-scheme: light)" srcset="assets/demo-light.gif">
  <img alt="点击插件区域的添加按钮，输入 @wz 并回车安装" src="assets/demo-light.gif">
</picture>

## 功能特性

- 智能识别样式组合，优先使用最匹配的 WZ 类名
- 支持 padding/margin 的各种缩写形式
- 支持 font-size 和 line-height 的组合处理
- 支持常见组件样式的转换（如卡片、文本省略等）
- 对于无法完全匹配的样式，保留原始的 CSS 代码
