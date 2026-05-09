<script lang="ts" setup>
interface Props {
  id: string
  name: string
  type: 'md' | 'docx'
  sizeText: string
  importedAt: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  select: []
}>()

const statusMap = {
  pending: '待处理',
  parsed: '已解析',
  error: '异常'
}
</script>

<template>
  <button
    type="button"
    class="doc-item"
    :class="{ 'is-active': active }"
    @click="emit('select')"
  >
    <div class="doc-head">
      <div class="doc-title-wrap">
        <div class="doc-type">{{ type.toUpperCase() }}</div>
        <div class="doc-title">{{ name }}</div>
      </div>
      <div
        class="doc-status"
        :class="`is-${status}`"
      >
        {{ statusMap[status] }}
      </div>
    </div>

    <div class="doc-meta">
      <span>{{ sizeText }}</span>
      <span>{{ importedAt }}</span>
    </div>

    <div class="doc-tags">
      <span
        v-for="tag in tags"
        :key="tag"
        class="doc-tag"
      >
        {{ tag }}
      </span>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.doc-item {
  width: 100%;
  padding: 16px;
  border: 1px solid #e8edf6;
  border-radius: 20px;
  background: rgb(255 255 255 / 90%);
  text-align: left;
  transition: 0.2s ease;
  cursor: pointer;
}

.doc-item:hover,
.doc-item.is-active {
  border-color: #d9e2ff;
  box-shadow: 0 12px 28px rgb(36 53 87 / 8%);
}

.doc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.doc-title-wrap {
  min-width: 0;
}

.doc-type {
  font-size: 11px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.doc-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2746;
}

.doc-status {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.doc-status.is-pending {
  background: #fff6e9;
  color: #b7781b;
}

.doc-status.is-parsed {
  background: #eef8f4;
  color: #2f8f67;
}

.doc-status.is-error {
  background: #fff0f0;
  color: #c54d4d;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  font-size: 12px;
  color: #8793aa;
}

.doc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.doc-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fc;
  color: #68758d;
  font-size: 12px;
}
</style>
