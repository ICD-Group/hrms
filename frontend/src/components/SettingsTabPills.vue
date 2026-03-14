<template>
	<div class="tab-pills-wrapper" ref="scrollContainer">
		<div class="tab-pills-scroll">
			<button
				v-for="tab in tabs"
				:key="tab.key"
				@click="$emit('update:modelValue', tab.key)"
				class="tab-pill"
				:class="modelValue === tab.key ? 'tab-pill-active' : 'tab-pill-inactive'"
			>
				<FeatherIcon :name="tab.icon" class="w-3.5 h-3.5" />
				<span class="tab-pill-label">{{ __(tab.label) }}</span>
			</button>
		</div>
	</div>
</template>

<script setup>
import { inject, ref, watch, nextTick } from "vue"
import { FeatherIcon } from "frappe-ui"

const __ = inject("$translate")
const scrollContainer = ref(null)

const props = defineProps({
	tabs: { type: Array, required: true },
	modelValue: { type: String, required: true },
})

defineEmits(["update:modelValue"])

watch(() => props.modelValue, async () => {
	await nextTick()
	const container = scrollContainer.value
	if (!container) return
	const activeBtn = container.querySelector(".tab-pill-active")
	if (activeBtn) {
		activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
	}
})
</script>

<style scoped>
.tab-pills-wrapper {
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
	scrollbar-width: none;
	-ms-overflow-style: none;
	margin: 0 -1rem;
	padding: 0 1rem;
}
.tab-pills-wrapper::-webkit-scrollbar { display: none; }

.tab-pills-scroll {
	display: flex;
	gap: 0.5rem;
	padding: 0.25rem 0;
	min-width: max-content;
}

.tab-pill {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.5rem 0.85rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	white-space: nowrap;
	transition: all 0.2s ease;
	border: 1px solid transparent;
	flex-shrink: 0;
}
.tab-pill:active { transform: scale(0.95); }

.tab-pill-active {
	background: #4D067B;
	color: white;
	box-shadow: 0 2px 8px rgba(77, 6, 123, 0.3);
}

.tab-pill-inactive {
	background: rgba(255, 255, 255, 0.5);
	color: #6b7280;
	border-color: rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(4px);
}
.tab-pill-inactive:hover {
	background: rgba(255, 255, 255, 0.7);
	color: #374151;
}

:global(.dark) .tab-pill-active {
	background: #7B2FA0;
	box-shadow: 0 2px 8px rgba(123, 47, 160, 0.35);
}
:global(.dark) .tab-pill-inactive {
	background: rgba(30, 30, 46, 0.5);
	color: #9ca3af;
	border-color: rgba(255, 255, 255, 0.06);
}
:global(.dark) .tab-pill-inactive:hover {
	background: rgba(30, 30, 46, 0.7);
	color: #d1d5db;
}
</style>
