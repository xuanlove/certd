<template>
  <fs-page>
    <template #header>
      <div class="title">
        授权管理
        <span class="sub">管理第三方系统授权信息</span>
      </div>
    </template>
    <fs-crud ref="crudRef" v-bind="crudBinding"> </fs-crud>
  </fs-page>
</template>

<script lang="ts">
import { defineComponent, onActivated, onMounted } from "vue";
import { useFs } from "@fast-crud/fast-crud";
import createCrudOptions from "./crud";
import { createAccessApi } from "/@/views/certd/access/api";

export default defineComponent({
  name: "AccessManager",
  setup() {
    const api = createAccessApi("user");
    const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions, context: { api } });

    // 页面打开后获取列表数据
    onMounted(() => {
      crudExpose.doRefresh();
    });
    onActivated(() => {
      crudExpose.doRefresh();
    });

    return {
      crudBinding,
      crudRef
    };
  }
});
</script>
