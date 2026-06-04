# 前端 SSE 学习路线图

这份文档给你的目标不是一次讲完所有实时通信技术，而是帮你把前端 SSE 学到可以自己读代码、自己写小 demo、自己接进项目。

这里默认你学习的是前端场景，尤其是 AI 对话、流式回复、进度推送这类单向实时输出。

SSE 全称是 `Server-Sent Events`。

它的核心特点只有一句话：

服务端持续往前端推送消息，前端一边收一边渲染。

和普通接口最大的不同是，普通接口通常是等服务端全部处理完再一次性返回，SSE 则是服务端处理一点就返回一点。

你可以把它理解成：

普通接口像发快递，最后一次性收到完整包裹。

SSE 像电话直播，服务端边说，前端边听。

---

第一阶段先理解 SSE 是什么

你先只记住三件事。

第一，SSE 是基于 HTTP 的，不是完全另一套网络协议。

第二，SSE 默认更适合单向通信，也就是服务端推给前端。

第三，SSE 在 AI 对话里特别常见，因为模型回复本来就是一段一段生成的。

服务端常见返回头大概像这样：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

其中最关键的是：

```http
Content-Type: text/event-stream
```

这告诉浏览器，这不是普通文本响应，而是一条持续输出的事件流。

---

第二阶段先看懂 SSE 的文本格式

SSE 传输的不是随便一段文本，而是有固定结构的。

最常见的样子是：

```txt
event: chunk
data: {"content":"你好"}

event: chunk
data: {"content":"我继续说"}

event: done
data: {}
```

你要注意几件事。

`event:` 表示事件类型。

`data:` 表示事件内容。

每一条事件结束后，通常会用一个空行分隔。

所以前端拿到流之后，不能只按“这一坨字符串”处理，而要学会把它拆成一帧一帧的事件。

在 AI 项目里，最常见的事件设计是：

```txt
chunk
done
error
```

含义通常是：

`chunk` 表示又来了一小段文本。

`done` 表示这次流式输出结束了。

`error` 表示服务端在流过程中出错了。

---

第三阶段学最简单的 SSE 用法，也就是 EventSource

浏览器原生提供了一个 API 叫 `EventSource`。

先看最小例子：

```ts
const source = new EventSource('/api/clock')

source.onmessage = (event) => {
  console.log('收到消息', event.data)
}

source.onerror = (error) => {
  console.error('连接出错', error)
}
```

这里几个点要看懂。

`new EventSource(url)`  
表示浏览器去连接一个 SSE 地址。

`onmessage`  
表示收到默认消息事件时怎么处理。

`event.data`  
是服务端这一条消息里的数据内容，注意它通常还是字符串。

`onerror`  
表示连接异常时的回调。

如果服务端发的是：

```txt
data: hello

data: world
```

前端会分别收到两次消息。

如果服务端发了自定义事件名：

```txt
event: chunk
data: {"content":"你好"}
```

那么前端要这样监听：

```ts
const source = new EventSource('/api/stream')

source.addEventListener('chunk', (event) => {
  const messageEvent = event as MessageEvent
  const payload = JSON.parse(messageEvent.data)
  console.log(payload.content)
})
```

这里的 `addEventListener('chunk', ...)` 和普通 DOM 事件很像，只不过监听的是 SSE 的事件名。

---

第四阶段要知道为什么 AI 项目常常不用 EventSource

虽然 `EventSource` 很方便，但它有一个很大的限制：

它默认是 `GET` 请求。

而 AI 对话场景通常需要传一大坨请求体，例如：

```json
{
  "sessionId": "s1",
  "threadId": "t1",
  "question": "请解释 Vue 3 响应式原理",
  "answer": "我会从 Proxy 开始说"
}
```

这时候你就更希望用 `POST`，而不是把这些信息全塞到 URL 里。

所以很多 AI 项目会用：

```txt
fetch + ReadableStream
```

这也是你现在项目里更接近的做法。

---

第五阶段学习 fetch 加 ReadableStream

先看一个完整但尽量小的例子：

```ts
async function readSSEStream() {
  const response = await fetch('/api/interview/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: '请解释 Vue 3 响应式原理',
      answer: '我会从 Proxy、依赖收集和触发更新来展开'
    })
  })

  if (!response.ok) {
    throw new Error(`请求失败，状态码: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('当前浏览器不支持流式读取 response.body')
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader()

  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += value

    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''

    for (const frame of frames) {
      handleSSEFrame(frame)
    }
  }
}
```

下面把这段代码里陌生的方法解释一下。

`fetch(...)`  
发起 HTTP 请求。这里和普通接口一样，只是响应不是一次性读完，而是后面持续读取。

`response.body`  
表示响应体的可读流。普通接口你平时会用 `response.json()`，但这里不能直接这么做，因为我们要一边到一边读。

`pipeThrough(new TextDecoderStream())`  
把二进制字节流转成字符串流。因为网络传输过来的原始内容通常不是直接可读的 JavaScript 字符串。

`getReader()`  
拿到一个读取器，用它来手动一段一段地读流。

`await reader.read()`  
每调用一次，就尝试读取下一段内容。

它返回的结构通常是：

```ts
{
  value: '本次读取到的字符串',
  done: false
}
```

如果流结束了，会变成：

```ts
{
  value: undefined,
  done: true
}
```

`buffer += value`  
把每次读到的内容拼起来，因为一条完整 SSE 事件可能不会一次就到齐。

`buffer.split('\n\n')`  
按 SSE 的空行分隔规则拆帧。

`frames.pop()`  
把最后一段拿出来，留作残缺帧缓存。因为最后一段很可能还没收完整。

---

第六阶段理解什么叫半包问题

这是 SSE 初学最容易忽略，但项目里最重要的问题之一。

假设服务端本来发的是：

```txt
event: chunk
data: {"content":"你好"}

```

网络层不保证这段内容一次性完整到达。

前端第一次可能只收到：

```txt
event: chunk
data: {"cont
```

第二次才收到：

```txt
ent":"你好"}

```

所以你不能一读到字符串就立刻 `JSON.parse`，否则大概率会炸。

这就是为什么前面代码里要有：

```ts
let buffer = ''
buffer += value
const frames = buffer.split('\n\n')
buffer = frames.pop() || ''
```

它的本质就是先把不完整内容攒起来，等凑成完整事件后再处理。

---

第七阶段学会手动解析一帧 SSE

前面用了一个 `handleSSEFrame(frame)`，现在把它补完整。

```ts
function handleSSEFrame(frame: string) {
  const lines = frame.split('\n')

  let eventName = 'message'
  let dataText = ''

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim()
    }

    if (line.startsWith('data:')) {
      dataText += line.slice('data:'.length).trim()
    }
  }

  if (!dataText) {
    return
  }

  let payload: any = dataText

  try {
    payload = JSON.parse(dataText)
  }
  catch {
    payload = dataText
  }

  if (eventName === 'chunk') {
    console.log('收到文本片段', payload.content)
  }

  if (eventName === 'done') {
    console.log('流式输出结束')
  }

  if (eventName === 'error') {
    console.error('流式输出出错', payload)
  }
}
```

这里再解释几个关键点。

`line.startsWith('event:')`  
判断当前这一行是不是事件名。

`slice(...).trim()`  
把前缀裁掉，再去掉多余空格。

`dataText += ...`  
把这一帧里的 `data:` 内容拼起来。

`JSON.parse(dataText)`  
把 JSON 字符串转成对象。如果不是 JSON，就继续按普通字符串处理。

这一步完成后，你就真正掌握了“前端怎么自己解析 SSE”。

---

第八阶段学习如何把 SSE 内容渲染到页面

AI 场景里，最常见的目标不是打印日志，而是边收到边更新一条消息。

最简单的 Vue 写法如下：

```ts
import { ref } from 'vue'

const output = ref('')
const loading = ref(false)
const errorText = ref('')

async function startInterviewStream() {
  loading.value = true
  errorText.value = ''
  output.value = ''

  try {
    const response = await fetch('/api/interview/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: '请解释 Vue 3 响应式原理',
        answer: '我会从 Proxy、依赖收集和触发更新来展开'
      })
    })

    if (!response.ok || !response.body) {
      throw new Error('流式请求失败')
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader()

    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      buffer += value
      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''

      for (const frame of frames) {
        const parsed = parseSSEFrame(frame)

        if (!parsed) continue

        if (parsed.event === 'chunk') {
          output.value += parsed.data.content || ''
        }

        if (parsed.event === 'done') {
          loading.value = false
        }

        if (parsed.event === 'error') {
          errorText.value = parsed.data.message || '生成失败'
          loading.value = false
        }
      }
    }
  }
  catch (error) {
    errorText.value = error instanceof Error ? error.message : '未知错误'
    loading.value = false
  }
}

function parseSSEFrame(frame: string) {
  const lines = frame.split('\n')
  let event = 'message'
  let dataText = ''

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    }

    if (line.startsWith('data:')) {
      dataText += line.slice(5).trim()
    }
  }

  if (!dataText) return null

  try {
    return {
      event,
      data: JSON.parse(dataText)
    }
  }
  catch {
    return {
      event,
      data: dataText
    }
  }
}
```

这个例子最值得你记住的是：

`output.value += ...`  
表示不是一次性覆盖，而是持续拼接。

这就是“流式渲染”的最小模型。

---

第九阶段学习如何停止 SSE

真实项目里，用户经常会点击“停止生成”。

这时你需要 `AbortController`。

最小例子如下：

```ts
let activeController: AbortController | null = null

async function startStream() {
  activeController = new AbortController()

  const response = await fetch('/api/interview/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: '请解释 Vue 3 响应式原理'
    }),
    signal: activeController.signal
  })

  console.log(response.status)
}

function stopStream() {
  activeController?.abort()
  activeController = null
}
```

这里你要记住：

`new AbortController()`  
创建一个中断控制器。

`signal: activeController.signal`  
把这个控制器挂到请求上。

`abort()`  
表示主动中断请求。

以后你在项目里做“停止生成”“切题时取消上一题流”“离开页面取消请求”，基本都离不开这个东西。

---

第十阶段学习错误处理

SSE 的错误不止一种。

你至少要分清这些层次。

请求发都没发出去  
例如地址写错、网络断开、浏览器拦截。

HTTP 状态码异常  
例如 `404`、`500`。

流中途断掉  
例如服务端崩了，连接意外关闭。

服务端主动发了 `event: error`  
说明连接本身还活着，但业务处理失败了。

JSON 解析失败  
说明你以为这是合法 JSON，其实它可能是残缺帧或者普通文本。

最小错误处理习惯可以这样写：

```ts
if (!response.ok) {
  throw new Error(`请求失败: ${response.status}`)
}

if (!response.body) {
  throw new Error('当前环境不支持流式读取')
}

try {
  const payload = JSON.parse(dataText)
}
catch {
  console.warn('当前帧不是合法 JSON', dataText)
}
```

你以后做项目时，错误处理越早分层，调试越轻松。

---

第十一阶段学习为什么真实项目里会加消息队列

初学时你会直接这样写：

```ts
output.value += chunk
```

这没有问题，但如果服务端 chunk 很碎，页面会频繁更新，导致：

渲染抖动
性能下降
Markdown 重算很重
光标和滚动可能闪动

所以真实项目常常会做一层“消息队列”或者“节流刷新”。

思路大概是：

先把 chunk 放进队列。

每隔一小段时间统一刷到页面。

这样用户仍然感觉是流式的，但页面不会因为更新太频繁而卡。

你当前项目里就已经有这种思路，后面读代码时可以重点看：

```txt
src/composables/useInterviewStream.ts
src/services/message/interview-message-queue.ts
```

---

第十二阶段学习 SSE 在你项目里的落点

你这个项目里，SSE 最主要的应用场景就是模拟面试页的流式回复。

你可以把整个链路理解成下面这几层。

前端状态层  
负责决定什么时候发请求，什么时候停止，当前消息状态是不是 `streaming`。

前端请求层  
负责把请求发给 `/api/interview/stream`，然后一段一段读取响应流。

前端解析层  
负责把原始 SSE 文本拆成 `chunk`、`done`、`error`。

前端消息层  
负责把收到的文本增量写进当前 assistant 消息。

页面渲染层  
负责把 assistant 消息显示在面试页面里。

在你的项目里，你后面可以重点看这些文件：

```txt
src/services/sse/interview-stream.ts
src/services/sse/sse-client.ts
src/services/sse/sse-types.ts
src/composables/useInterviewStream.ts
src/services/message/interview-message-parser.ts
```

你读它们时，可以带着这几个问题。

它是怎么判断当前走 mock 还是 real 的。

它是怎么读取流的。

它是怎么把 chunk 拼到消息上的。

它是怎么处理 done 和 error 的。

它是怎么支持 stop 的。

---

第十三阶段给你一个完整可运行的小型前端练习

这段代码适合你单独抄出来练手。

```ts
import { ref } from 'vue'

type SSEParsedFrame = {
  event: string
  data: any
}

const output = ref('')
const loading = ref(false)
const errorText = ref('')

let controller: AbortController | null = null

export async function startDemoSSE() {
  controller = new AbortController()
  output.value = ''
  loading.value = true
  errorText.value = ''

  try {
    const response = await fetch('/api/interview/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'demo-session',
        threadId: 'demo-thread',
        topic: 'vue3',
        questionTitle: 'Vue 3 响应式原理',
        questionPrompt: '请解释 Vue 3 响应式系统',
        answer: '我会从 Proxy、依赖收集和触发更新来展开'
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('response.body 不存在，无法读取流')
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader()

    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        break
      }

      buffer += value

      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''

      for (const frame of frames) {
        const parsed = parseFrame(frame)

        if (!parsed) continue

        if (parsed.event === 'chunk') {
          output.value += parsed.data.content || ''
        }

        if (parsed.event === 'done') {
          loading.value = false
        }

        if (parsed.event === 'error') {
          errorText.value = parsed.data.message || '流式输出失败'
          loading.value = false
        }
      }
    }

    loading.value = false
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      errorText.value = '用户已手动停止生成'
    }
    else {
      errorText.value = error instanceof Error ? error.message : '未知错误'
    }

    loading.value = false
  }
}

export function stopDemoSSE() {
  controller?.abort()
  controller = null
}

function parseFrame(frame: string): SSEParsedFrame | null {
  const lines = frame.split('\n')
  let event = 'message'
  let dataText = ''

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
    }

    if (line.startsWith('data:')) {
      dataText += line.slice('data:'.length).trim()
    }
  }

  if (!dataText) {
    return null
  }

  try {
    return {
      event,
      data: JSON.parse(dataText)
    }
  }
  catch {
    return {
      event,
      data: dataText
    }
  }
}
```

你练这段代码时，重点不要只盯着“能不能跑”，而是要自己复述出每一步在干什么。

请求发出去了吗。

响应是不是流。

字符串是不是要先解码。

为什么要 buffer。

为什么要按 `\n\n` 拆帧。

为什么要区分 `chunk`、`done`、`error`。

为什么停止生成要用 `AbortController`。

如果这几件事你都能自己讲出来，SSE 基本就入门了。

---

第十四阶段给你的学习顺序建议

先背概念没有用，建议按这个顺序。

先理解 SSE 文本格式。

再看 `EventSource`，理解最简单的单向推送。

再学 `fetch + ReadableStream`，这是 AI 场景最实用的部分。

再学半包、拆帧、JSON 解析。

再学停止生成和错误处理。

最后回到你项目里，去看它怎么把这些能力拆成 composable、parser、queue 和 view。

---

最后总结

前端学 SSE，真正要掌握的不是某一个 API，而是下面这条完整链路。

知道服务端返回的流长什么样。

知道前端怎么一段一段读取。

知道怎么从原始文本拆出事件帧。

知道怎么把事件帧变成页面消息。

知道怎么停止、报错、收尾。

只要你把这条链路理解透了，后面无论是 AI 对话、日志推送、进度流还是你当前这个模拟面试项目，本质上都只是换一层业务外壳。
