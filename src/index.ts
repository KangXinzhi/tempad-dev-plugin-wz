import { definePlugin } from '@tempad-dev/plugins'
import {
  tryMatchClasses,
} from './utils'

export default definePlugin({
  name: 'WZ Style Plugin',
  code: {
    'css': {
      title: 'delete-CSS',
      lang: 'css',
      transform() {
        return ''
      },
    },
    'js': {
      title: 'delete-JavaScript',
      lang: 'js',
      transform() {
        return ''
      },
    },
    // WZ 类名输出
    'a-className': {
      title: 'wz className',
      lang: 'text',
      transform({ style }) {
        return tryMatchClasses({ ...style }).join(' ')
      },
    },
    // CSS 代码输出
    'b-css': {
      title: 'wz less',
      lang: 'css',
      transform({ style }) {
        // 创建一个新的样式对象用于匹配
        const remainingStyles = { ...style }

        // 尝试匹配所有类，这个过程会修改 remainingStyles
        const matchedClasses = tryMatchClasses(remainingStyles)

        // 如果没有匹配到任何类名，返回空字符串
        if (matchedClasses.length === 0)
          return ''

        // 返回剩余的样式
        return Object.entries(remainingStyles)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')
      },
    },
    // 原始 CSS 代码输出
    'c-css': {
      title: '原始样式',
      lang: 'css',
      transform({ style }) {
        // 返回原样式
        return Object.entries(style)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')
      },
    },
  },
})
