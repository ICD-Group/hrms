<template>
	<div class="slider-wrapper">
		<div class="slider-header">
			<div class="slider-info">
				<slot name="label"></slot>
			</div>
			<span class="slider-value" :style="{ color: color || '#4D067B' }">
				{{ modelValue }}<span v-if="suffix" class="slider-suffix">{{ suffix }}</span>
			</span>
		</div>
		<input
			type="range"
			:value="modelValue"
			:min="min"
			:max="max"
			:step="step"
			@input="onInput"
			@change="onChange"
			class="slider-range"
			:style="sliderStyle"
		/>
		<div v-if="showMinMax" class="slider-minmax">
			<span>{{ min }}{{ suffix }}</span>
			<span>{{ max }}{{ suffix }}</span>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
	modelValue: { type: Number, default: 0 },
	min: { type: Number, default: 0 },
	max: { type: Number, default: 100 },
	step: { type: Number, default: 1 },
	suffix: { type: String, default: "" },
	color: { type: String, default: "#4D067B" },
	showMinMax: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "change"])

const sliderStyle = computed(() => {
	const pct = ((props.modelValue - props.min) / (props.max - props.min)) * 100
	const c = props.color || "#4D067B"
	return {
		"--slider-pct": pct + "%",
		"--slider-color": c,
		background: `linear-gradient(to right, ${c} 0%, ${c} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
	}
})

function onInput(e) {
	emit("update:modelValue", Number(e.target.value))
}

function onChange(e) {
	emit("change", Number(e.target.value))
}
</script>

<style scoped>
.slider-wrapper {
	width: 100%;
}
.slider-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}
.slider-value {
	font-size: 0.875rem;
	font-weight: 700;
}
.slider-suffix {
	font-size: 0.7rem;
	font-weight: 500;
	margin-left: 0.1rem;
}
.slider-range {
	width: 100%;
	height: 0.375rem;
	border-radius: 9999px;
	appearance: none;
	-webkit-appearance: none;
	outline: none;
	cursor: pointer;
}
.slider-range::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	background: white;
	border: 2.5px solid var(--slider-color, #4D067B);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
	cursor: pointer;
	transition: transform 0.15s;
}
.slider-range::-webkit-slider-thumb:active {
	transform: scale(1.15);
}
.slider-range::-moz-range-thumb {
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	background: white;
	border: 2.5px solid var(--slider-color, #4D067B);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
	cursor: pointer;
}
.slider-minmax {
	display: flex;
	justify-content: space-between;
	margin-top: 0.25rem;
	font-size: 0.65rem;
	color: #9ca3af;
}

:global(.dark) .slider-range {
	background: linear-gradient(to right, var(--slider-color, #7B2FA0) 0%, var(--slider-color, #7B2FA0) var(--slider-pct, 50%), #374151 var(--slider-pct, 50%), #374151 100%) !important;
}
:global(.dark) .slider-range::-webkit-slider-thumb {
	background: #1e1e2e;
	border-color: var(--slider-color, #a86cc9);
}
:global(.dark) .slider-range::-moz-range-thumb {
	background: #1e1e2e;
	border-color: var(--slider-color, #a86cc9);
}
</style>
