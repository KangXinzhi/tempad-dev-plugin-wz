import wzCodeMap from './wzCodeMap.json'

// 将 wzCodeMap 转换为 CSS 到类名的映射
export const cssToWzMap = new Map<string[], string>()

// 预处理 CSS 规则
Object.entries(wzCodeMap).forEach(([className, cssValue]) => {
  const rules = cssValue.split('\n')
    .map(rule => rule.trim())
    .filter(Boolean)
    .map(rule => rule.replace(/;$/, ''))
  cssToWzMap.set(rules, className)
})

// 检查类名是否存在于 wzCodeMap 中
export function hasClassName(className: string): boolean {
  return Object.prototype.hasOwnProperty.call(wzCodeMap, className)
}

// 解析缩写形式的 padding 和 margin
export function parseShorthand(property: string, value: string): Record<string, string> {
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
export function tryMatchCombinedClass(property: string, expanded: Record<string, string>): string[] {
  const matches: string[] = []
  const prefix = property === 'padding' ? 'p' : 'm'
  const {
    [`${property}-top`]: top,
    [`${property}-right`]: right,
    [`${property}-bottom`]: bottom,
    [`${property}-left`]: left,
  } = expanded

  // 解析所有值
  const values = {
    top: Number.parseInt(top),
    right: Number.parseInt(right),
    bottom: Number.parseInt(bottom),
    left: Number.parseInt(left),
  }

  // 检查是否有无效值
  if (Object.values(values).some(Number.isNaN))
    return matches

  // 1. 检查是否所有值都相等（单值情况）
  if (values.top === values.right && values.right === values.bottom && values.bottom === values.left) {
    const tbClass = `wz-${prefix}tb-${values.top}`
    const lrClass = `wz-${prefix}lr-${values.top}`
    if (hasClassName(tbClass) && hasClassName(lrClass)) {
      matches.push(tbClass, lrClass)
      return matches
    }
  }

  // 2. 检查上下值和左右值
  const hasSameVertical = values.top === values.bottom
  const hasSameHorizontal = values.left === values.right

  // 2.1 处理上下值
  if (hasSameVertical) {
    const tbClass = `wz-${prefix}tb-${values.top}`
    if (hasClassName(tbClass)) {
      matches.push(tbClass)
    }
  }
  else {
    // 上下值不同，尝试匹配单独的类
    const topClass = `wz-${prefix}t-${values.top}`
    const bottomClass = `wz-${prefix}b-${values.bottom}`
    if (hasClassName(topClass))
      matches.push(topClass)
    if (hasClassName(bottomClass))
      matches.push(bottomClass)
  }

  // 2.2 处理左右值
  if (hasSameHorizontal) {
    const lrClass = `wz-${prefix}lr-${values.left}`
    if (hasClassName(lrClass)) {
      matches.push(lrClass)
    }
  }
  else {
    // 左右值不同，尝试匹配单独的类
    const leftClass = `wz-${prefix}l-${values.left}`
    const rightClass = `wz-${prefix}r-${values.right}`
    if (hasClassName(leftClass))
      matches.push(leftClass)
    if (hasClassName(rightClass))
      matches.push(rightClass)
  }

  return matches
}

// 检查样式是否匹配规则集
export function matchRules(style: Record<string, string>, rules: string[]): boolean {
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

// 检查是否匹配字体大小类
function matchFontSizeClass(style: Record<string, string>): string | null {
  const fontSize = style['font-size']
  const lineHeight = style['line-height']

  if (!fontSize)
    return null

  // 提取数值
  const fontSizeMatch = fontSize.match(/^(\d+)px$/)
  if (!fontSizeMatch)
    return null

  const fontSizeValue = fontSizeMatch[1]
  const className = `wz-fs-${fontSizeValue}`

  // 检查类名是否存在
  if (!hasClassName(className))
    return null

  // 如果有 line-height，检查是否与 font-size 相同
  if (lineHeight) {
    const lineHeightMatch = lineHeight.match(/^(\d+)px$/)
    if (!lineHeightMatch)
      return null

    const lineHeightValue = lineHeightMatch[1]
    // 只有当 line-height 和 font-size 相同时，才完全匹配
    if (fontSizeValue === lineHeightValue)
      return className
  }

  // 如果没有 line-height 或值不同，也返回类名
  return className
}

// 移除匹配的样式
export function removeMatchedStyles(style: Record<string, string>, rules: string[]): void {
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
      // 特殊处理字体大小规则
      if (key === 'font-size') {
        toDelete.push(key)
        // 只有当 line-height 值与 font-size 相同时，才删除 line-height
        const fontSize = value.match(/^(\d+)px$/)?.[1]
        const lineHeight = style['line-height']?.match(/^(\d+)px$/)?.[1]
        if (fontSize && lineHeight && fontSize === lineHeight) {
          toDelete.push('line-height')
        }
      }
      else if (key === 'line-height') {
        // line-height 的删除已经在 font-size 处理时决定
      }
      else {
        toDelete.push(key)
      }
    }
  })

  // 删除匹配的属性
  toDelete.forEach((key) => {
    delete style[key]
  })
}

// 尝试匹配所有可能的类
export function tryMatchClasses(style: Record<string, string>): string[] {
  const matchedClasses: string[] = []
  const remainingStyles = { ...style }

  // 1. 首先尝试匹配字体大小类
  const fontSizeClass = matchFontSizeClass(remainingStyles)
  if (fontSizeClass) {
    matchedClasses.push(fontSizeClass)
    // 删除 font-size，如果 line-height 相同也删除
    delete remainingStyles['font-size']
    const fontSize = style['font-size']?.match(/^(\d+)px$/)?.[1]
    const lineHeight = style['line-height']?.match(/^(\d+)px$/)?.[1]
    if (fontSize && lineHeight && fontSize === lineHeight) {
      delete remainingStyles['line-height']
    }
  }

  // 2. 尝试匹配 padding 和 margin
  for (const property of ['padding', 'margin']) {
    if (remainingStyles[property]) {
      const expanded = parseShorthand(property, remainingStyles[property])
      const matches = tryMatchCombinedClass(property, expanded)
      if (matches.length > 0) {
        matchedClasses.push(...matches)
        delete remainingStyles[property]
      }
    }
  }

  // 3. 尝试匹配其他类
  for (const [rules, className] of cssToWzMap.entries()) {
    if (matchRules(remainingStyles, rules)) {
      matchedClasses.push(className)
      removeMatchedStyles(remainingStyles, rules)
    }
  }

  // 更新原始样式对象
  Object.keys(style).forEach((key) => {
    if (remainingStyles[key] === undefined) {
      delete style[key]
    }
  })

  return matchedClasses
}
