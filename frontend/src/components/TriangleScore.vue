<template>
	<div class="flex flex-col items-center" :style="{ cursor: clickable ? 'pointer' : 'default', '-webkit-tap-highlight-color': 'transparent' }" @click="$emit('click')">
		<div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
			<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
				<!-- Background triangle -->
				<path :d="trianglePath" fill="none" :stroke-width="strokeWidth"
					stroke="rgba(255,255,255,0.15)" stroke-linejoin="round" />
				<!-- Progress triangle (animated) -->
				<path :d="trianglePath" fill="none" :stroke-width="strokeWidth"
					stroke-linecap="round" stroke-linejoin="round"
					:stroke="progressStroke"
					class="triangle-progress"
					:stroke-dasharray="perimeter"
					:stroke-dashoffset="progressOffset" />
			</svg>
			<!-- Score number at centroid -->
			<div class="absolute inset-0 flex items-center justify-center" :style="{ paddingTop: size * 0.1 + 'px' }">
				<span class="font-black text-white" :style="{ fontSize: fontSize + 'px' }">{{ displayValue }}</span>
			</div>
		</div>
		<span class="font-bold text-white/50" :style="{ fontSize: labelSize + 'px', marginTop: '1px' }">{{ label }}</span>
	</div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
	value: { type: Number, default: 0 },
	maxValue: { type: Number, default: 100 },
	label: { type: String, default: "" },
	size: { type: Number, default: 52 },
	strokeWidth: { type: Number, default: 3.5 },
	suffix: { type: String, default: "" },
	clickable: { type: Boolean, default: false },
	progressStroke: { type: String, default: "rgba(255,255,255,0.95)" },
})

defineEmits(["click"])

const padding = computed(() => props.strokeWidth + 2)
const topY = computed(() => padding.value)
const bottomY = computed(() => props.size - padding.value)
const leftX = computed(() => padding.value)
const rightX = computed(() => props.size - padding.value)
const centerX = computed(() => props.size / 2)

// Triangle path: top-center → bottom-right → bottom-left → close
const trianglePath = computed(() => {
	const cx = centerX.value
	const ty = topY.value
	const by = bottomY.value
	const lx = leftX.value
	const rx = rightX.value
	return `M ${cx} ${ty} L ${rx} ${by} L ${lx} ${by} Z`
})

// Calculate perimeter
const sideLength = computed(() => {
	const w = rightX.value - leftX.value
	const h = bottomY.value - topY.value
	return Math.sqrt((w / 2) ** 2 + h ** 2)
})
const baseLength = computed(() => rightX.value - leftX.value)
const perimeter = computed(() => sideLength.value * 2 + baseLength.value)

// Progress offset (0 = full, perimeter = empty)
const pct = computed(() => Math.min(Math.max(props.value / props.maxValue, 0), 1))
const progressOffset = computed(() => perimeter.value - (perimeter.value * pct.value))

// Display
const displayValue = computed(() => {
	const v = Math.round(props.value)
	return props.suffix ? `${v}${props.suffix}` : v
})

const fontSize = computed(() => {
	if (props.size >= 100) return 28
	if (props.size >= 60) return 15
	if (props.size >= 50) return 12
	return 10
})

const labelSize = computed(() => {
	if (props.size >= 60) return 8
	return 7
})
</script>

<style scoped>
.triangle-progress {
	transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
	filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
}
</style>
