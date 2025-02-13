import { definePlugin } from '@tempad-dev/plugins'
import wzCodeMap from './wzCodeMap.json'

// 将 wzCodeMap 转换为 CSS 到类名的映射
const cssToWzMap = new Map<string[], string>()

// 预处理 CSS 规则
Object.entries(wzCodeMap).forEach(([className, cssValue]) => {
  const rules = cssValue.split('\n')
    .map(rule => rule.trim())
    .filter(Boolean)
    .map(rule => rule.replace(/;$/, ''))
  cssToWzMap.set(rules, className)
})

// 检查样式是否匹配规则集
function matchRules(style: Record<string, string>, rules: string[]): boolean {
  const styleStrings = Object.entries(style).map(([key, value]) => `${key}:${value}`)
  return rules.every(rule => styleStrings.includes(rule))
}

export default definePlugin({
  name: 'WZ Style Plugin',
  code: {
    // WZ 类名输出
    'a-className': {
      title: 'wz className',
      lang: 'text',
      transform({ style }) {
        const matchedClasses: string[] = []
        const remainingStyles = { ...style }

        // 遍历所有规则集，找到匹配的组合类
        for (const [rules, className] of cssToWzMap) {
          if (matchRules(remainingStyles, rules)) {
            matchedClasses.push(className)
            // 从剩余样式中移除已匹配的规则
            rules.forEach((rule) => {
              const [key] = rule.split(':')
              delete remainingStyles[key.trim()]
            })
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

        // 遍历所有规则集，移除已匹配的组合类的样式
        for (const [rules] of cssToWzMap) {
          if (matchRules(remainingStyles, rules)) {
            rules.forEach((rule) => {
              const [key] = rule.split(':')
              delete remainingStyles[key.trim()]
            })
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
