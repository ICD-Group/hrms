<template>
	<div class="flex flex-col items-center" :style="{ cursor: clickable ? 'pointer' : 'default', '-webkit-tap-highlight-color': 'transparent' }" @click="$emit('click')">
		<div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
			<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
				<!-- Background square -->
				<rect :x="half" :y="half" :width="inner" :height="inner"
					:rx="radius" :ry="radius"
					fill="none" :stroke-width="strokeWidth"
					stroke="rgba(255,255,255,0.15)" />
				<!-- Progress square -->
				<rect :x="half" :y="half" :width="inner" :height="inner"
					:rx="radius" :ry="radius"
					fill="none" :stroke-width="strokeWidth"
					stroke="rgba(255,255,255,0.9)"
					class="square-progress"
					:stroke-dasharray="perimeter"
					:stroke-dashoffset="progressOffset"
					stroke-linecap="round" />
			</svg>
			<!-- Score number centered -->
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="font-black text-white" :style="{ fontSize: fontSize + 'px', lineHeight: 1 }">{{ displayValue }}</span>
			</div>
		</div>
		<span class="font-bold text-white" :style="{ fontSize: labelSize + 'px', marginTop: '1px' }">{{ label }}</span>
	</div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
	value: { type: Number, default: 0 },
	maxValue: { type: Number, default: 100 },
	label: { type: String, default: "" },
	size: { type: Number, default: 62 },
	strokeWidth: { type: Number, default: 2.5 },
	clickable: { type: Boolean, default: false },
})

defineEmits(["click"])

const half = computed(() => props.strokeWidth / 2 + 1)
const inner = computed(() => props.size - props.strokeWidth - 2)
const radius = computed(() => Math.min(inner.value * 0.2, 10))

const perimeter = computed(() => {
	const w = inner.value
	const r = radius.value
	return 2 * (w + w) - 8 * r + 2 * Math.PI * r
})

const pct = computed(() => Math.min(Math.max(props.value / props.maxValue, 0), 1))
const progressOffset = computed(() => perimeter.value - (perimeter.value * pct.value))

const displayValue = computed(() => Math.round(props.value))

const fontSize = computed(() => {
	if (props.size >= 100) return 42
	if (props.size >= 70) return 30
	if (props.size >= 60) return 26
	if (props.size >= 50) return 22
	return 16
})

const labelSize = computed(() => {
	if (props.size >= 60) return 10
	return 8
})
</script>

<style scoped>
.square-progress {
	transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
	filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.35));
}
</style>
