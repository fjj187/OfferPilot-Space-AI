<script lang="ts" setup>
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import WorkbenchSidebar from '@/components/workbench/WorkbenchSidebar.vue'
import { sidebarItems } from '@/views/workbench/workbench.data'

const route = useRoute()
const router = useRouter()

const handleNavigate = (path: string) => {
  if (route.path === path) return
  router.push(path)
}
</script>

<template>
  <LayoutCenterPanel :loading="false">
    <template #sidebar>
      <WorkbenchSidebar
        :items="sidebarItems"
        :active-path="route.path"
        @navigate="handleNavigate"
      />
    </template>

    <div class="workspace">
      <WorkbenchHeader />
      <RouterView />
    </div>
  </LayoutCenterPanel>
</template>

<style lang="scss" scoped>
.workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top right, rgb(113 135 255 / 10%), transparent 32%),
    linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%);
}
</style>
