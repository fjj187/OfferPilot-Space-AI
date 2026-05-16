<script lang="ts" setup>
const router = useRouter()

const handleOpenShowcase = () => {
  router.push({ name: 'SpaceOdysseyShowcase' })
}

const handleOpenInterviewMock = () => {
  router.push({ name: 'MockInterviewSpaceShowcase' })
}
</script>

<template>
  <header class="workspace-header">
    <div class="header-search">
      <span class="i-lucide-search search-icon"></span>
      <input
        type="text"
        placeholder="搜索资料、知识点或历史训练..."
      >
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="showcase-entry"
        @click="handleOpenShowcase"
      >
        <span class="i-lucide-orbit showcase-entry-icon"></span>
        <span>Space Demo</span>
      </button>

      <button
        type="button"
        class="showcase-entry showcase-entry-secondary"
        @click="handleOpenInterviewMock"
      >
        <span class="i-lucide-messages-square showcase-entry-icon"></span>
        <span>Interview Mock</span>
      </button>

      <button
        type="button"
        class="header-action-btn"
      >
        <span class="i-lucide-bell"></span>
      </button>

      <div class="profile-pill">
        <n-avatar
          round
          :size="34"
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
        />
        <div>
          <div class="profile-name">Nicholas Turner</div>
          <div class="profile-role">Frontend Candidate</div>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 30px 12px;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(520px, 100%);
  height: 54px;
  padding: 0 18px;
  border: 1px solid #e7ecf5;
  border-radius: 18px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 60%);
}

.header-search input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #25304a;
}

.header-search input::placeholder {
  color: #97a3b8;
}

.search-icon {
  color: #8c98af;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.showcase-entry {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 18px;
  border: 1px solid rgb(79 95 174 / 12%);
  border-radius: 16px;
  background: linear-gradient(135deg, #0d1531 0%, #202a52 100%);
  color: #f5f7ff;
  box-shadow: 0 16px 26px rgb(16 28 76 / 18%);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.showcase-entry:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgb(16 28 76 / 24%);
}

.showcase-entry-secondary {
  background: linear-gradient(135deg, #101e39 0%, #173554 100%);
}

.showcase-entry-icon {
  font-size: 18px;
  color: #73f5eb;
}

.header-action-btn {
  width: 48px;
  height: 48px;
  border: 1px solid #e7ecf5;
  border-radius: 16px;
  background: rgb(255 255 255 / 88%);
  color: #50607d;
  font-size: 18px;
  cursor: pointer;
}

.profile-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 6px;
  border: 1px solid #e7ecf5;
  border-radius: 14px;
  background: rgb(255 255 255 / 88%);
}

.profile-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2746;
  line-height: 1.15;
}

.profile-role {
  margin-top: 0;
  font-size: 11px;
  line-height: 1.15;
  color: #8290a8;
}

@media (max-width: 900px) {
  .workspace-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-search {
    width: 100%;
  }

  .header-actions {
    justify-content: space-between;
  }

  .showcase-entry {
    flex: 1;
    justify-content: center;
  }
}
</style>
