export type LibraryImportExamplePageId = 'heading-markdown' | 'numbered-plain' | 'answer-prefix'

export interface LibraryImportExamplePage {
  id: LibraryImportExamplePageId
  label: string
  summary: string
  example: string
}

/** 第 1 页：## 章节 + ### 题面 */
export const LIBRARY_IMPORT_MARKDOWN_EXAMPLE = `
## HTML 基础

### meta 标签有哪些？分别有什么作用？

- charset：指定页面字符编码
- viewport：控制移动端视口缩放
- description：页面摘要，影响 SEO 与分享预览

### script 标签中 defer 和 async 的区别？

两者都异步加载脚本，不阻塞 HTML 解析，但执行时机不同：
- async：下载完成后立即执行，顺序不保证
- defer：等 HTML 解析完毕后再按文档顺序执行

## 布局与样式

### 如何理解 BFC？它解决什么问题？

BFC（块级格式化上下文）是独立的渲染区域，常见触发方式包括 overflow 非 visible、float、position absolute 等。
典型用途：清除浮动、防止 margin 折叠、隔离内部布局。
`.trim()

/** 第 2 页：1. 2. 3. 编号切题，无需 ## / ---，答案写在题下段落 */
export const LIBRARY_IMPORT_NUMBERED_EXAMPLE = `
Vue3 响应式

1. ref 和 reactive 有什么区别？

ref 适合基础类型和需要整体替换的引用；reactive 适合对象、数组的深层可变结构。
模板中 ref 会自动解包，reactive 则直接访问属性即可。

2. computed 和 watch 怎么选？

computed 用于派生展示状态，有缓存；watch 用于副作用，例如发请求、同步 storage。
需要根据 A 得到 B 用于渲染时用 computed，需要在 A 变化时执行动作用 watch。

3. 为什么 Vue3 用 Proxy 替代 defineProperty？

Proxy 可以监听新增、删除属性和数组索引变化；defineProperty 需要逐 key 递归定义，
且无法监听后续新增键，维护成本更高。
`.trim()

/** 第 3 页：编号题面 +「答：」分隔（md / docx 常见面经体） */
export const LIBRARY_IMPORT_ANSWER_PREFIX_EXAMPLE = `
12.10 一面

1. 隐藏元素有哪些方法？各有什么特点？

答：常见有 display:none、visibility:hidden、opacity:0。
display:none 会脱离文档流且不响应事件；visibility 仍占据布局空间；opacity 只影响透明度。

2. Flex 和 Grid 有什么区别？分别适合什么场景？

答：Flex 是一维布局，适合导航栏、工具条、单行卡片列表。
Grid 是二维布局，适合页面分区、卡片矩阵、复杂仪表盘。

12.12 二面

1. 你在项目里如何与后端协作接口联调？

答：先对齐接口契约与错误码，再约定 mock 与联调节奏；前端用类型约束请求响应，联调问题按优先级分批关闭。
`.trim()

export const LIBRARY_IMPORT_EXAMPLE_PAGES: readonly LibraryImportExamplePage[] = [
  {
    id: 'heading-markdown',
    label: '标题分层',
    summary: '用 ## 分章节、### 分题面，题下写参考答案要点；适合 Markdown（.md）整理。',
    example: LIBRARY_IMPORT_MARKDOWN_EXAMPLE
  },
  {
    id: 'numbered-plain',
    label: '编号分割',
    summary: '用 1. 2. 3. 逐题编号即可，无需 ## 或 ---；答案直接写在题下段落，空行分隔下一题。',
    example: LIBRARY_IMPORT_NUMBERED_EXAMPLE
  },
  {
    id: 'answer-prefix',
    label: '答：分隔',
    summary: '题面用编号，参考答案以「答：」开头；Word 面经、牛客笔记常见，.md / .docx 均可导入。',
    example: LIBRARY_IMPORT_ANSWER_PREFIX_EXAMPLE
  }
]

/** @deprecated 测试与旧引用兼容 */
export const LIBRARY_IMPORT_DOCX_EXAMPLE = LIBRARY_IMPORT_ANSWER_PREFIX_EXAMPLE
