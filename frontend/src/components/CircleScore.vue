<template>
	<div class="flex flex-col items-center" :style="{ cursor: clickable ? 'pointer' : 'default', '-webkit-tap-highlight-color': 'transparent' }" @click="$emit('click')">
		<div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
			<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
				<!-- Background circle -->
				<circle :cx="center" :cy="center" :r="r"
					fill="none" :stroke-width="strokeWidth"
					:stroke="bgStroke" />
				<!-- Progress arc -->
				<circle :cx="center" :cy="center" :r="r"
					fill="none" :stroke-width="strokeWidth"
					:stroke="strokeColor"
					class="circle-progress"
					:stroke-dasharray="circumference"
					:stroke-dashoffset="progressOffset"
					stroke-linecap="round"
					transform-origin="center"
					style="transform: rotate(-90deg)" />
			</svg>
			<!-- Number -->
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="font-black" :class="darkBg ? 'text-white' : 'text-gray-800'" :style="{ fontSize: fontSize + 'px', lineHeight: 1 }">{{ displayValue }}</span>
			</div>
		</div>
		<span v-if="label" class="font-semibold" :class="darkBg ? 'text-white/80' : 'text-gray-600'" :style="{ fontSize: labelSize + 'px', marginTop: '2px' }">{{ label }}</span>
	</div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
	value: { type: Number, default: 0 },
	maxValue: { type: Number, default: 100 },
	label: { type: String, default: "" },
	size: { type: Number, default: 56 },
	strokeWidth: { type: Number, default: 3.5 },
	clickable: { type: Boolean, default: false },
	darkBg: { type: Boolean, default: true },
})

defineEmits(["click"])

const center = computed(() => props.size / 2)
const r = computed(() => (props.size - props.strokeWidth) / 2 - 1)
const circumference = computed(() => 2 * Math.PI * r.value)

const pct = computed(() => Math.min(Math.max(props.value / props.maxValue, 0), 1))
const progressOffset = computed(() => circumference.value - (circumference.value * pct.value))

const scorePercent = computed(() => pct.value * 100)

// Background track color
const bgStroke = computed(() => props.darkBg ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")

// Smart colors
const strokeColor = computed(() => {
	const s = scorePercent.value
	if (props.darkBg) {
		if (s >= 90) return "#fbbf24"  // gold
		if (s >= 75) return "#34d399"  // emerald
		if (s >= 60) return "#38bdf8"  // sky
		if (s >= 40) return "#fb923c"  // orange
		return "#fb7185"               // rose
	} else {
		if (s >= 90) return "#d97706"  // amber-600
		if (s >= 75) return "#059669"  // emerald-600
		if (s >= 60) return "#2563eb"  // blue-600
		if (s >= 40) return "#ea580c"  // orange-600
		return "#e11d48"               // rose-600
	}
})

const displayValue = computed(() => Math.round(props.value))

const fontSize = computed(() => {
	if (props.size >= 80) return 28
	if (props.size >= 65) return 24
	if (props.size >= 56) return 18
	if (props.size >= 46) return 15
	return 12
})

const labelSize = computed(() => props.size >= 56 ? 9 : 8)
</script>

<style scoped>
.circle-progress {
	transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
	filter: drop-shadow(0 0 5px currentColor);
}
</style>
