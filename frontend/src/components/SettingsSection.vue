<template>
	<div class="section-wrapper">
		<button @click="toggle" class="section-header">
			<div class="section-icon" :style="{ background: iconColor || '#4D067B' }">
				<FeatherIcon :name="icon" class="w-4 h-4 text-white" />
			</div>
			<span class="section-title">{{ __(title) }}</span>
			<FeatherIcon
				name="chevron-down"
				class="w-4 h-4 section-chevron"
				:class="{ 'section-chevron-collapsed': isCollapsed }"
			/>
		</button>
		<div class="section-body" :class="{ 'section-body-collapsed': isCollapsed }">
			<div class="section-content">
				<slot></slot>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, inject } from "vue"
import { FeatherIcon } from "frappe-ui"

const __ = inject("$translate")

const props = defineProps({
	title: { type: String, required: true },
	icon: { type: String, default: "settings" },
	iconColor: { type: String, default: "" },
	collapsed: { type: Boolean, default: false },
})

const isCollapsed = ref(props.collapsed)

function toggle() {
	isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.section-wrapper {
	background: rgba(255, 255, 255, 0.45);
	border-radius: 0.85rem;
	border: 0.5px solid rgba(255, 255, 255, 0.65);
	box-shadow: 0 0.5px 0 rgba(0, 0, 0, 0.04);
	overflow: hidden;
}
:global(.dark) .section-wrapper {
	background: rgba(30, 30, 46, 0.45);
	border-color: rgba(255, 255, 255, 0.06);
}

.section-header {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.75rem 1rem;
	width: 100%;
	text-align: left;
}
.section-header:active { opacity: 0.8; }

.section-icon {
	width: 2rem;
	height: 2rem;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.section-title {
	flex: 1;
	font-size: 0.875rem;
	font-weight: 600;
	color: #1f2937;
}
:global(.dark) .section-title { color: #e5e7eb; }

.section-chevron {
	color: #9ca3af;
	transition: transform 0.25s ease;
	flex-shrink: 0;
}
.section-chevron-collapsed {
	transform: rotate(-90deg);
}

.section-body {
	max-height: 2000px;
	overflow: hidden;
	transition: max-height 0.35s ease, opacity 0.25s ease;
	opacity: 1;
}
.section-body-collapsed {
	max-height: 0;
	opacity: 0;
}

.section-content {
	border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}
:global(.dark) .section-content {
	border-color: rgba(255, 255, 255, 0.06);
}
</style>
