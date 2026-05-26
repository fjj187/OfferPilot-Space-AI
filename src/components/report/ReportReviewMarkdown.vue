<script setup lang="ts">
import DOMPurify from 'dompurify'
import { renderMarkdownText } from '@/components/MarkdownPreview/plugins/markdown'

const props = withDefaults(defineProps<{
  content: string
  variant?: 'light' | 'dark'
}>(), {
  variant: 'light'
})

const safeHtml = computed(() => {
  const html = renderMarkdownText(props.content || '')
  return DOMPurify.sanitize(html)
})
</script>

<template>
  <div
    class="report-review-markdown"
    :class="`is-${ variant }`"
    v-html="safeHtml"
  />
</template>

<style scoped lang="scss">
.report-review-markdown {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.8;
  word-break: break-word;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 14px 0 8px;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.45;
  }

  :deep(h1:first-child),
  :deep(h2:first-child),
  :deep(h3:first-child),
  :deep(h4:first-child) {
    margin-top: 0;
  }

  :deep(p) {
    margin: 0 0 10px;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 12px;
    padding-left: 1.35em;
  }

  :deep(li) {
    margin: 6px 0;
  }

  :deep(li > p) {
    margin: 0;
  }

  :deep(strong) {
    font-weight: 700;
  }

  :deep(code) {
    padding: 0 0.25em;
    border-radius: 4px;
    font-size: 0.92em;
  }

  :deep(pre) {
    margin: 0 0 12px;
    padding: 12px 14px;
    border-radius: 12px;
    overflow-x: auto;
  }

  &.is-light {
    color: #334155;

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: #1e293b;
    }

    :deep(code) {
      background: rgb(15 23 42 / 0.06);
    }

    :deep(pre) {
      background: #0f172a;
      color: #e2e8f0;
    }
  }

  &.is-dark {
    color: rgb(233 241 255 / 0.9);

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: rgb(248 250 255 / 0.98);
    }

    :deep(code) {
      background: rgb(255 255 255 / 0.1);
      color: rgb(244 250 255 / 0.95);
    }

    :deep(pre) {
      background: rgb(15 23 42 / 0.85);
      color: #e2e8f0;
    }
  }
}
</style>
