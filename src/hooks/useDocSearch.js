// 文档检索逻辑（供总览页使用）
//   - 名称模式：按标题 / 文件名 / 路径匹配，支持通配符 *（任意长度）和 ?（单个字符）
//   - 标签模式：按 YAML keywords 匹配，用 + 组合多个标签做「同时包含」(AND) 匹配

export const SEARCH_MODES = {
  NAME: 'name',
  TAG: 'tag',
}

export const SEARCH_MODE_OPTIONS = [
  { value: SEARCH_MODES.NAME, label: 'ByName' },
  { value: SEARCH_MODES.TAG, label: 'ByTag' },
]

/** 通配符模式 -> 正则：* → .*、? → .，其余字符转义；大小写不敏感 */
function globToRegExp(pattern) {
  const escaped = String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i')
}

const hasGlob = (text) => /[*?]/.test(text)

/** 单值匹配：含通配符走完整 glob，否则退化为子串包含（大小写不敏感） */
function matchText(value, pattern) {
  const text = String(value ?? '')
  const p = String(pattern ?? '').trim()
  if (!p) return false
  return hasGlob(p) ? globToRegExp(p).test(text) : text.toLowerCase().includes(p.toLowerCase())
}

/** 名称模式：title / 文件名 / 路径任一命中即可 */
function matchByName(doc, query) {
  return [doc.title, doc.name, doc.path].some((field) => matchText(field, query))
}

/** 标签模式：query 用 + 分隔，每个标签都要在 keywords 里命中（AND） */
function matchByKeywords(doc, query) {
  const tags = String(query)
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!tags.length) return false
  const keywords = (doc.keywords ?? []).map(String)
  return tags.every((tag) => keywords.some((kw) => matchText(kw, tag)))
}

/** 判断单篇文档是否命中 */
export function matchDoc(doc, mode, query) {
  if (!query || !String(query).trim()) return false
  return mode === SEARCH_MODES.TAG ? matchByKeywords(doc, query) : matchByName(doc, query)
}

/** 递归收集命中的文档 key（叶子节点） */
export function collectMatchedKeys(nodes, mode, query, matched = new Set()) {
  for (const node of nodes) {
    if (node.type === 'dir') collectMatchedKeys(node.children, mode, query, matched)
    else if (matchDoc(node, mode, query)) matched.add(node.key)
  }
  return matched
}

/** 按命中 key 过滤树：保留命中文档及其祖先目录，并重算每一层的 count；无命中返回 null */
export function filterTree(root, matched) {
  const walk = (nodes) => {
    const out = []
    for (const node of nodes) {
      if (node.type === 'dir') {
        const children = walk(node.children)
        if (children.length) {
          const count = children.reduce((sum, child) => sum + (child.count ?? 1), 0)
          out.push({ ...node, children, count })
        }
      } else if (matched.has(node.key)) {
        out.push(node)
      }
    }
    return out
  }

  const children = walk(root.children)
  if (!children.length) return null
  return {
    ...root,
    children,
    count: children.reduce((sum, child) => sum + (child.count ?? 1), 0),
  }
}
