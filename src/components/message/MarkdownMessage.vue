<script lang="ts" setup>
import DOMPurify from 'dompurify'
import { renderMarkdownText } from '@/components/MarkdownPreview/plugins/markdown'

const props = defineProps<{
  content: string
}>()

const safeHtml = computed(() => {
  const html = renderMarkdownText(props.content || '')
  return DOMPurify.sanitize(html)
})
</script>

<template>
  <div
    class="markdown-message"
    v-html="safeHtml"
  />
</template>

<style lang="scss" scoped>
.markdown-message {
  font-size: 14px;
  line-height: 1.8;
  color: #31405b;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 0 0 12px;
    color: #1f2746;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(pre) {
    margin: 0 0 12px;
  }

  :deep(pre) {
    overflow-x: auto;
    padding: 14px;
    border-radius: 16px;
    background: #0f172a;
  }

  :deep(code) {
    font-size: 13px;
  }
}
</style>
