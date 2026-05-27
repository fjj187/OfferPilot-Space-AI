<script lang="ts" setup>
interface Props {
  emphasizeImport?: boolean
  helperText?: string
  feedbackText?: string
}

withDefaults(defineProps<Props>(), {
  emphasizeImport: false,
  helperText: '',
  feedbackText: ''
})

const emit = defineEmits<{
  pickFiles: []
  pickFolder: []
}>()
</script>

<template>
  <section class="import-card">
    <div class="import-copy">
      <div class="eyebrow">导入入口</div>
      <h2>先把你的面试资料放进来</h2>
      <p>第一版先支持 `md` 和 `docx`，可以选择多个文件，也可以直接导入一个资料文件夹。</p>
    </div>

    <div
      class="import-actions"
      :class="{ 'is-emphasis': emphasizeImport }"
    >
      <n-button
        type="primary"
        round
        size="large"
        @click="emit('pickFiles')"
      >
        导入文件
      </n-button>
      <n-button
        ghost
        round
        size="large"
        color="#6c7df7"
        @click="emit('pickFolder')"
      >
        导入文件夹
      </n-button>
    </div>

    <div
      v-if="helperText"
      class="import-helper"
    >
      {{ helperText }}
    </div>

    <div
      v-if="feedbackText"
      class="import-feedback"
    >
      {{ feedbackText }}
    </div>

    <div class="import-meta">
      <span>支持格式：Markdown / Word</span>
      <span>建议优先导入结构清晰的面试沉淀文档。</span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.import-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h2 {
  margin: 10px 0 10px;
  font-size: 24px;
  color: #1f2746;
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6d7a92;
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.import-actions.is-emphasis {
  padding: 12px;
  border-radius: 18px;
  background: #eef2ff;
}

.import-helper {
  margin-top: -4px;
  font-size: 13px;
  line-height: 1.7;
  color: #66758f;
}

.import-feedback {
  padding: 12px 14px;
  border: 1px solid #dff0e8;
  border-radius: 14px;
  background: #f4fbf7;
  font-size: 13px;
  line-height: 1.7;
  color: #2f8f67;
}

.import-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 13px;
  color: #7c88a0;
}
</style>
