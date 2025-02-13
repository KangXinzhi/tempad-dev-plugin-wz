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

// 检查类名是否存在于 wzCodeMap 中
function hasClassName(className: string): boolean {
  return Object.prototype.hasOwnProperty.call(wzCodeMap, className)
}

// 解析缩写形式的 padding 和 margin
function parseShorthand(property: string, value: string): Record<string, string> {
  const values = value.split(' ').map(v => v.trim())
  const result: Record<string, string> = {}

  if (values.length === 1) {
    // padding: 10px -> 应该匹配 wz-ptb-10 wz-plr-10
    result[`${property}-top`] = values[0]
    result[`${property}-right`] = values[0]
    result[`${property}-bottom`] = values[0]
    result[`${property}-left`] = values[0]
  }
  else if (values.length === 2) {
    // padding: 10px 20px -> 应该匹配 wz-ptb-10 wz-plr-20
    result[`${property}-top`] = values[0]
    result[`${property}-bottom`] = values[0]
    result[`${property}-left`] = values[1]
    result[`${property}-right`] = values[1]
  }
  else if (values.length === 3) {
    // padding: 10px 20px 30px
    result[`${property}-top`] = values[0]
    result[`${property}-right`] = values[1]
    result[`${property}-bottom`] = values[2]
    result[`${property}-left`] = values[1]
  }
  else if (values.length === 4) {
    // padding: 10px 20px 30px 40px
    result[`${property}-top`] = values[0]
    result[`${property}-right`] = values[1]
    result[`${property}-bottom`] = values[2]
    result[`${property}-left`] = values[3]
  }

  return result
}

// 尝试匹配组合类
function tryMatchCombinedClass(property: string, expanded: Record<string, string>): string[] {
  const matches: string[] = []
  const {
    [`${property}-top`]: top,
    [`${property}-right`]: right,
    [`${property}-bottom`]: bottom,
    [`${property}-left`]: left,
  } = expanded

  // 检查是否是单值情况（所有值都相等）
  if (top === right && right === bottom && bottom === left) {
    const value = Number.parseInt(top)
    if (!Number.isNaN(value)) {
      const tbClass = `wz-${property === 'padding' ? 'ptb' : 'mtb'}-${value}`
      const lrClass = `wz-${property === 'padding' ? 'plr' : 'mlr'}-${value}`
      if (hasClassName(tbClass) && hasClassName(lrClass)) {
        matches.push(tbClass, lrClass)
        return matches
      }
    }
  }

  // 检查上下相同
  if (top === bottom) {
    const value = Number.parseInt(top)
    if (!Number.isNaN(value)) {
      const tbClass = `wz-${property === 'padding' ? 'ptb' : 'mtb'}-${value}`
      if (hasClassName(tbClass)) {
        matches.push(tbClass)
      }
    }
  }

  // 检查左右相同
  if (left === right) {
    const value = Number.parseInt(left)
    if (!Number.isNaN(value)) {
      const lrClass = `wz-${property === 'padding' ? 'plr' : 'mlr'}-${value}`
      if (hasClassName(lrClass)) {
        matches.push(lrClass)
      }
    }
  }

  return matches
}

// 检查样式是否匹配规则集
function matchRules(style: Record<string, string>, rules: string[]): boolean {
  const styleStrings = new Set<string>()

  // 处理所有样式
  Object.entries(style).forEach(([key, value]) => {
    if (key === 'padding' || key === 'margin') {
      // 处理缩写形式
      const expanded = parseShorthand(key, value)
      Object.entries(expanded).forEach(([k, v]) => {
        styleStrings.add(`${k}:${v}`)
      })
    }
    else {
      styleStrings.add(`${key}:${value}`)
    }
  })

  return rules.every(rule => styleStrings.has(rule))
}

// 移除匹配的样式
function removeMatchedStyles(style: Record<string, string>, rules: string[]): void {
  const toDelete: string[] = []

  // 找出需要删除的属性
  Object.entries(style).forEach(([key, value]) => {
    if (key === 'padding' || key === 'margin') {
      const expanded = parseShorthand(key, value)
      const allPartsMatched = Object.entries(expanded).every(([k, v]) =>
        rules.includes(`${k}:${v}`),
      )
      if (allPartsMatched) {
        toDelete.push(key)
      }
    }
    else if (rules.includes(`${key}:${value}`)) {
      toDelete.push(key)
    }
  })

  // 删除匹配的属性
  toDelete.forEach((key) => {
    delete style[key]
  })
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
