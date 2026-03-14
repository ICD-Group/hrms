<template>
	<div class="flex flex-col glass-section rounded mt-5">
		<div
			v-for="i in rows"
			:key="i"
			class="p-3.5 border-b last:border-b-0 animate-pulse"
		>
			<div class="flex items-center gap-3">
				<!-- Avatar placeholder -->
				<div v-if="showAvatar" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0"></div>

				<div class="flex-1 space-y-2">
					<!-- Title line -->
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
					<!-- Subtitle line -->
					<div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/5"></div>
				</div>

				<!-- Right side badge -->
				<div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
			</div>
		</div>
	</div>
</template>

<script setup>
defineProps({
	rows: {
		type: Number,
		default: 5,
	},
	showAvatar: {
		type: Boolean,
		default: false,
	},
})
</script>
