<script lang="ts" setup>
interface Props {
  contextTitle?: string
  contextDesc?: string
  nextStepTitle?: string
  nextStepDesc?: string
}

withDefaults(defineProps<Props>(), {
  contextTitle: '',
  contextDesc: '',
  nextStepTitle: '',
  nextStepDesc: ''
})
</script>

<template>
  <section class="library-header">
    <div class="eyebrow">资料库页</div>
    <h1>导入并管理你的面试资料</h1>
    <p>把零散的 Markdown、Word 面试文档整理进同一套资料库，为后续模拟面试和专项刷题提供输入来源。</p>

    <div
      v-if="contextTitle"
      class="context-banner"
    >
      <div class="context-label">当前入口上下文</div>
      <div class="context-title">{{ contextTitle }}</div>
      <div
        v-if="contextDesc"
        class="context-desc"
      >
        {{ contextDesc }}
      </div>
    </div>

    <div
      v-if="nextStepTitle"
      class="next-step-banner"
    >
      <div class="context-label">下一步建议</div>
      <div class="context-title">{{ nextStepTitle }}</div>
      <div
        v-if="nextStepDesc"
        class="context-desc"
      >
        {{ nextStepDesc }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.library-header {
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 12px;
  font-size: 30px;
  color: #1f2746;
}

p {
  max-width: 90%;
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6d7a92;
}

.context-banner,
.next-step-banner {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 18px;
}

.context-banner {
  border: 1px solid #dce5ff;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fbff 100%);
}

.next-step-banner {
  border: 1px solid #dff0e8;
  background: linear-gradient(135deg, #f3fbf7 0%, #fbfffd 100%);
}

.context-label {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
}

.context-title {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2746;
}

.context-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #70809a;
}
</style>
