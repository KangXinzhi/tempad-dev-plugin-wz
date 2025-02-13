import { definePlugin } from '@tempad-dev/plugins'
import {
  cssToWzMap,
  matchRules,
  parseShorthand,
  removeMatchedStyles,
  tryMatchCombinedClass,
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
        const matchedClasses: string[] = []
        const remainingStyles = { ...style }

        // 首先尝试匹配组合类
        Object.entries(remainingStyles).forEach(([key, value]) => {
          if (key === 'padding' || key === 'margin') {
            const expanded = parseShorthand(key, value)
            const combinedClasses = tryMatchCombinedClass(key, expanded)
            if (combinedClasses.length > 0) {
              matchedClasses.push(...combinedClasses)
              delete remainingStyles[key]
            }
          }
        })

        // 然后匹配其他类
        for (const [rules, className] of cssToWzMap) {
          if (matchRules(remainingStyles, rules)) {
            matchedClasses.push(className)
            removeMatchedStyles(remainingStyles, rules)
          }
        }

        return matchedClasses.join(' ')
      },
    },
    // CSS 代码输出
    'b-css': {
      title: 'wz less',
      lang: 'css',
      transform({ style }) {
        const remainingStyles = { ...style }

        // 首先尝试匹配组合类
        Object.entries(remainingStyles).forEach(([key, value]) => {
          if (key === 'padding' || key === 'margin') {
            const expanded = parseShorthand(key, value)
            const combinedClasses = tryMatchCombinedClass(key, expanded)
            if (combinedClasses.length > 0) {
              delete remainingStyles[key]
            }
          }
        })

        // 然后匹配其他类
        for (const [rules] of cssToWzMap) {
          if (matchRules(remainingStyles, rules)) {
            removeMatchedStyles(remainingStyles, rules)
          }
        }

        // 返回剩余的样式
        return Object.entries(remainingStyles)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')
      },
    },
  },
})
