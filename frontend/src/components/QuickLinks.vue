<template>
	<div class="flex flex-col gap-2 mt-3 w-full">
		<div class="text-lg font-medium text-gray-900 dark:text-white">{{ title || __("Quick Links") }}</div>
		<div class="flex flex-col glass-section rounded-xl overflow-hidden">
			<router-link
				class="flex flex-row flex-start p-2.5 items-center justify-between active:bg-white/30 dark:active:bg-white/10 transition-colors"
				:class="link !== props.items[props.items.length - 1] && 'border-b border-white/40 dark:border-white/10'"
				v-for="link in props.items"
				:key="link.title"
				:to="{ name: link.route }"
			>
				<div class="flex flex-row items-center gap-2.5 grow">
					<div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
						:class="link.bg || 'bg-icd-50 dark:bg-icd-900/30'">
						<component :is="link.icon" class="h-[22px] w-[22px]"
							:class="link.fg || 'text-icd-600 dark:text-icd-300'" />
					</div>
					<div class="text-base font-medium text-gray-800 dark:text-gray-200">
						{{ link.title }}
					</div>
				</div>
				<FeatherIcon name="chevron-right" class="h-5 w-5 text-gray-600 dark:text-gray-500" />
			</router-link>
		</div>
	</div>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui"

const props = defineProps({
	title: {
		type: String,
		required: false,
		default: "",
	},
	items: {
		type: Array,
		required: true,
	},
})
</script>
