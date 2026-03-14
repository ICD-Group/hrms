<template>
	<div class="num-input-wrapper">
		<button @click="decrement" class="num-btn num-btn-left" :disabled="modelValue <= min">
			<FeatherIcon name="minus" class="w-3.5 h-3.5" />
		</button>
		<div class="num-display">
			<span class="num-value">{{ modelValue }}</span>
			<span v-if="suffix" class="num-suffix">{{ suffix }}</span>
		</div>
		<button @click="increment" class="num-btn num-btn-right" :disabled="modelValue >= max">
			<FeatherIcon name="plus" class="w-3.5 h-3.5" />
		</button>
	</div>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

const props = defineProps({
	modelValue: { type: Number, default: 0 },
	min: { type: Number, default: 0 },
	max: { type: Number, default: 999 },
	step: { type: Number, default: 1 },
	suffix: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

let debounceTimer = null
function emitDebounced(val) {
	clearTimeout(debounceTimer)
	debounceTimer = setTimeout(() => emit("update:modelValue", val), 400)
}

function increment() {
	const next = Math.min(props.max, +(props.modelValue + props.step).toFixed(2))
	emitDebounced(next)
	emit("update:modelValue", next)
}

function decrement() {
	const next = Math.max(props.min, +(props.modelValue - props.step).toFixed(2))
	emitDebounced(next)
	emit("update:modelValue", next)
}
</script>

<style scoped>
.num-input-wrapper {
	display: flex;
	align-items: center;
	border-radius: 0.6rem;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.5);
	border: 1px solid rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(4px);
	height: 2.25rem;
}
:global(.dark) .num-input-wrapper {
	background: rgba(30, 30, 46, 0.5);
	border-color: rgba(255, 255, 255, 0.08);
}

.num-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 100%;
	color: #4D067B;
	transition: all 0.15s;
	flex-shrink: 0;
}
.num-btn:active { background: rgba(77, 6, 123, 0.1); }
.num-btn:disabled { opacity: 0.3; pointer-events: none; }
:global(.dark) .num-btn { color: #a86cc9; }
:global(.dark) .num-btn:active { background: rgba(168, 108, 201, 0.15); }

.num-display {
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 0.2rem;
	min-width: 3rem;
	padding: 0 0.25rem;
}
.num-value {
	font-size: 0.875rem;
	font-weight: 700;
	color: #1f2937;
}
:global(.dark) .num-value { color: #e5e7eb; }

.num-suffix {
	font-size: 0.65rem;
	color: #9ca3af;
	font-weight: 500;
}
</style>
