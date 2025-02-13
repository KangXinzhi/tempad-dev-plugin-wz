import { definePlugin } from '@tempad-dev/plugins';
// CSS 属性到 wz 类名的映射
const cssToWzMap = {
    'display: flex': 'wz-flex',
    'flex-direction: column': 'wz-flex-col',
    'justify-content: center': 'wz-justify-center',
    'align-items: center': 'wz-items-center',
    // 可以添加更多映射...
};
export default definePlugin({
    name: 'WZ Style Plugin',
    code: {
        css: {
            title: 'WZ Classes', // 自定义代码块标题
            lang: 'css', // 语法高亮语言
            transform({ style }) {
                // 将样式对象转换为 CSS 字符串形式
                const cssStrings = Object.entries(style).map(([key, value]) => `${key}: ${value}`);
                // 转换为 wz 类名
                const wzClasses = cssStrings
                    .map(css => cssToWzMap[css] || '')
                    .filter(Boolean);
                // 返回类名字符串
                return wzClasses.join(' ');
            }
        }
    }
});
