<template>
	<div :class="['grid gap-4 mt-5', gridClass]">
		<div
			v-for="i in cards"
			:key="i"
			class="glass-section rounded p-4 animate-pulse"
		>
			<!-- Top row: icon + value -->
			<div class="flex items-center justify-between mb-3">
				<div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
			</div>
			<!-- Label -->
			<div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
			<!-- Progress bar -->
			<div v-if="showProgress" class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full w-full mt-2"></div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
	cards: {
		type: Number,
		default: 4,
	},
	columns: {
		type: Number,
		default: 2,
	},
	showProgress: {
		type: Boolean,
		default: false,
	},
})

const gridClass = computed(() => {
	const cols = {
		1: "grid-cols-1",
		2: "grid-cols-2",
		3: "grid-cols-3",
		4: "grid-cols-4",
	}
	return cols[props.columns] || "grid-cols-2"
})
</script>
