<template>
	<BaseLayout :pageTitle="__('Analytics')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Period Selector -->
				<div class="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
					<button
						v-for="p in periods"
						:key="p.value"
						@click="selectedMonths = p.value"
						class="flex-1 py-2 text-sm font-medium rounded-lg transition"
						:class="selectedMonths === p.value ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none' : 'text-gray-700 dark:text-gray-400'"
					>
						{{ p.label }}
					</button>
				</div>

				<!-- Attendance Summary -->
				<div v-if="analytics.data" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
					<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Attendance Summary") }}</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
							<div class="text-xl font-bold text-green-700 dark:text-green-300">{{ analytics.data.total_present || 0 }}</div>
							<div class="text-xs text-green-600 dark:text-green-400">{{ __("Present") }}</div>
						</div>
						<div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
							<div class="text-xl font-bold text-red-600 dark:text-red-400">{{ analytics.data.total_absent || 0 }}</div>
							<div class="text-xs text-red-500 dark:text-red-400">{{ __("Absent") }}</div>
						</div>
						<div class="bg-icd-50 dark:bg-icd-900/30 rounded-lg p-3 text-center">
							<div class="text-xl font-bold text-icd-600 dark:text-icd-300">{{ analytics.data.total_late || 0 }}</div>
							<div class="text-xs text-icd-500 dark:text-icd-400">{{ __("Late") }}</div>
						</div>
						<div class="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-center">
							<div class="text-xl font-bold text-amber-700 dark:text-amber-300">{{ analytics.data.total_early_exit || 0 }}</div>
							<div class="text-xs text-amber-500 dark:text-amber-400">{{ __("Early Exit") }}</div>
						</div>
					</div>
				</div>

				<!-- Punctuality Score -->
				<div v-if="analytics.data" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
					<div class="flex items-center justify-between mb-3">
						<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Punctuality Score") }}</div>
						<div class="text-2xl font-bold" :class="getScoreColor(analytics.data.punctuality_score)">
							{{ analytics.data.punctuality_score || 0 }}%
						</div>
					</div>
					<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-3">
						<div
							class="h-3 rounded-full transition-all duration-700"
							:class="getScoreBarColor(analytics.data.punctuality_score)"
							:style="{ width: (analytics.data.punctuality_score || 0) + '%' }"
						></div>
					</div>
				</div>

				<!-- Working Hours -->
				<div v-if="analytics.data?.avg_working_hours" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
					<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Working Hours") }}</div>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Average Daily") }}</div>
							<div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ analytics.data.avg_working_hours }}h</div>
						</div>
						<div class="text-right">
							<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Total") }}</div>
							<div class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ analytics.data.total_working_hours || 0 }}h</div>
						</div>
					</div>
				</div>

				<!-- Points Trend -->
				<div v-if="analytics.data?.monthly_points?.length > 0" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
					<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Points Trend") }}</div>
					<div class="flex items-end gap-1 h-24">
						<div
							v-for="(month, idx) in analytics.data.monthly_points"
							:key="idx"
							class="flex-1 bg-icd-500 rounded-t-sm transition-all duration-500 relative group"
							:style="{ height: getBarHeight(month.points) + '%', minHeight: '4px' }"
						>
							<div class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-700 dark:text-gray-400 opacity-0 group-hover:opacity-100">
								{{ month.points }}
							</div>
						</div>
					</div>
					<div class="flex gap-1 mt-1">
						<div
							v-for="(month, idx) in analytics.data.monthly_points"
							:key="'l'+idx"
							class="flex-1 text-center text-xs text-gray-600 dark:text-gray-500"
						>
							{{ month.month_short || month.month?.substring(0, 3) }}
						</div>
					</div>
				</div>

				<!-- Streaks History -->
				<div v-if="analytics.data?.streaks" class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
					<div class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{{ __("Streaks") }}</div>
					<div class="flex gap-4">
						<div class="flex-1 text-center">
							<div class="text-2xl">&#x1F525;</div>
							<div class="text-lg font-bold text-orange-600 dark:text-orange-300">{{ analytics.data.streaks.current || 0 }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Current") }}</div>
						</div>
						<div class="flex-1 text-center">
							<div class="text-2xl">&#x1F3C6;</div>
							<div class="text-lg font-bold text-amber-600 dark:text-amber-300">{{ analytics.data.streaks.longest || 0 }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Longest") }}</div>
						</div>
						<div class="flex-1 text-center">
							<div class="text-2xl">&#x2B50;</div>
							<div class="text-lg font-bold text-icd-600 dark:text-icd-300">{{ analytics.data.streaks.total_streak_days || 0 }}</div>
							<div class="text-xs text-gray-700 dark:text-gray-400">{{ __("Total Days") }}</div>
						</div>
					</div>
				</div>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, inject, watch } from "vue"
import { createResource } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const __ = inject("$translate")

const selectedMonths = ref(3)
const periods = [
	{ label: __("1M"), value: 1 },
	{ label: __("3M"), value: 3 },
	{ label: __("6M"), value: 6 },
	{ label: __("12M"), value: 12 },
]

const analytics = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_personal_analytics",
	auto: true,
	makeParams() {
		return { employee: employee.data?.name, months: selectedMonths.value }
	},
})

watch(selectedMonths, () => {
	analytics.reload()
})

function getScoreColor(score) {
	if (score >= 80) return "text-green-600 dark:text-green-400"
	if (score >= 60) return "text-amber-600 dark:text-amber-300"
	return "text-red-600 dark:text-red-400"
}

function getScoreBarColor(score) {
	if (score >= 80) return "bg-green-500"
	if (score >= 60) return "bg-amber-500"
	return "bg-red-500"
}

function getBarHeight(points) {
	if (!analytics.data?.monthly_points) return 0
	const max = Math.max(...analytics.data.monthly_points.map(m => m.points || 0), 1)
	return Math.round(((points || 0) / max) * 100)
}
</script>
