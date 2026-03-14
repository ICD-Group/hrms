<template>
	<div
		class="flex flex-col items-center justify-center rounded-xl p-8 text-center"
		:class="[
			props.isTableField ? 'border-2 border-dashed border-gray-300 mt-5' : 'glass-section mt-2',
		]"
		role="status"
	>
		<div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3" aria-hidden="true">
			<FeatherIcon :name="props.icon || 'inbox'" class="w-6 h-6 text-gray-600 dark:text-gray-500" />
		</div>
		<p class="text-sm font-medium text-gray-700 dark:text-gray-400">
			{{ __(props.message) }}
		</p>
		<p v-if="props.description" class="text-xs text-gray-600 dark:text-gray-500 mt-1 max-w-[240px]">
			{{ __(props.description) }}
		</p>
	</div>
</template>

<script setup>
import { inject } from "vue"
import { FeatherIcon } from "frappe-ui"

const __ = inject("$translate")

const props = defineProps({
	message: { type: String },
	isTableField: { type: Boolean, default: false },
	icon: { type: String, default: "inbox" },
	description: { type: String, default: "" },
})
</script>
