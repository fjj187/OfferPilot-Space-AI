<script lang="ts" setup>
interface Props {
  name: string
  type: 'md' | 'docx'
  importedAt: string
  summary: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  topicLabels?: string[]
  sourceLabel?: string
  recommendedReason?: string
  rawText?: string
}

withDefaults(defineProps<Props>(), {
  topicLabels: () => [],
  sourceLabel: '',
  recommendedReason: '',
  rawText: ''
})

const statusMap = {
  pending: '待处理',
  parsed: '已解析',
  error: '异常'
}
</script>

<template>
  <section class="preview-card">
    <div class="preview-head">
      <div>
        <div class="eyebrow">文档预览</div>
        <h3>{{ name }}</h3>
      </div>
      <span class="preview-type">{{ type.toUpperCase() }}</span>
    </div>

    <div class="preview-meta">
      <div>导入时间：{{ importedAt }}</div>
      <div>状态：{{ statusMap[status] }}</div>
    </div>

    <div class="preview-section">
      <div class="section-label">摘要</div>
      <p>{{ summary }}</p>
    </div>

    <div
      v-if="topicLabels.length"
      class="preview-section"
    >
      <div class="section-label">主题归属</div>
      <div class="preview-tags">
        <span
          v-for="topic in topicLabels"
          :key="topic"
          class="preview-tag"
        >
          {{ topic }}
        </span>
      </div>
    </div>

    <div class="preview-section">
      <div class="section-label">标签</div>
      <div class="preview-tags">
        <span
          v-for="tag in tags"
          :key="tag"
          class="preview-tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <div
      v-if="sourceLabel || recommendedReason"
      class="preview-section"
    >
      <div class="section-label">推荐上下文</div>
      <div class="preview-context">
        <div v-if="sourceLabel">来源：{{ sourceLabel }}</div>
        <div v-if="recommendedReason">原因：{{ recommendedReason }}</div>
      </div>
    </div>

    <div class="preview-section">
      <div class="section-label">文本预览</div>
      <div class="preview-text">
        {{ rawText || '当前文档尚未生成可展示的文本预览。' }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.preview-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow,
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 10px 0 0;
  font-size: 20px;
  line-height: 1.4;
  color: #1f2746;
}

.preview-type {
  padding: 7px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 12px;
  font-weight: 700;
}

.preview-meta {
  margin-top: 16px;
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: #7f8aa1;
}

.preview-section {
  margin-top: 18px;
}

p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6d7a92;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preview-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fc;
  color: #68758d;
  font-size: 12px;
}

.preview-context {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #6d7a92;
}

.preview-text {
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  background: #f8faff;
  font-size: 13px;
  line-height: 1.8;
  color: #647188;
  white-space: pre-wrap;
}
</style>
