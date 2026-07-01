<template>
  <el-tooltip
    :content="displayValue"
    :disabled="!displayValue"
    :show-after="250"
    :trigger="['hover', 'focus']"
    :visible="tooltipVisible"
    placement="top"
    popper-class="compact-cell-input-tooltip"
  >
    <span class="compact-cell-input-trigger" @mouseenter="showTooltip" @mouseleave="hideTooltip">
      <el-input
        class="compact-cell-input"
        clearable
        :model-value="modelValue"
        @blur="hideTooltip"
        @focus="showTooltip"
        @update:model-value="emit('update:modelValue', normalizeInputValue($event))"
      />
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
  }>(),
  {
    modelValue: ''
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const tooltipActive = ref(false);
const tooltipVisible = ref(false);
const displayValue = computed(() => String(props.modelValue ?? '').trim());

const normalizeInputValue = (value: string | number) => String(value ?? '');
const syncTooltipVisible = () => {
  tooltipVisible.value = tooltipActive.value && Boolean(displayValue.value);
};
const showTooltip = () => {
  tooltipActive.value = true;
  syncTooltipVisible();
};
const hideTooltip = () => {
  tooltipActive.value = false;
  tooltipVisible.value = false;
};

watch(displayValue, syncTooltipVisible);
</script>

<style scoped>
.compact-cell-input-trigger,
.compact-cell-input {
  width: 100%;
}

.compact-cell-input-trigger {
  display: inline-block;
}

.compact-cell-input :deep(.el-input__inner) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
