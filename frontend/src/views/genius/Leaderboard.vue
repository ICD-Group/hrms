<template>
	<BaseLayout :pageTitle="__('Leaderboard')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-4">
				<!-- Period Toggle -->
				<div class="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
					<button
						v-for="p in periods"
						:key="p.value"
						@click="selectedPeriod = p.value"
						class="flex-1 py-2 text-sm font-medium rounded-lg transition"
						:class="selectedPeriod === p.value ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none' : 'text-gray-700 dark:text-gray-400'"
					>
						{{ p.label }}
					</button>
				</div>

				<!-- Top 3 Podium -->
				<div v-if="leaderboard.data?.leaderboard?.length >= 3" class="flex items-end justify-center gap-3 mt-2 mb-4">
					<!-- 2nd Place -->
					<div class="flex flex-col items-center w-24">
						<div class="w-14 h-14 rounded-full bg-icd-100 dark:bg-icd-800/40 flex items-center justify-center text-xl font-bold text-icd-700 dark:text-icd-200 border-3 border-icd-300 dark:border-icd-600">
							{{ getInitials(leaderboard.data.leaderboard[1]?.employee_name) }}
						</div>
						<div class="bg-icd-400 text-white w-full rounded-t-lg mt-2 py-4 text-center">
							<div class="text-lg font-bold">2</div>
						</div>
						<div class="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 text-center truncate w-full">
							{{ leaderboard.data.leaderboard[1]?.employee_name?.split(' ')[0] }}
						</div>
						<div class="text-xs text-gray-700 dark:text-gray-400">{{ leaderboard.data.leaderboard[1]?.total_points }}pts</div>
					</div>

					<!-- 1st Place -->
					<div class="flex flex-col items-center w-28">
						<div class="text-2xl mb-1">&#x1F451;</div>
						<div class="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center text-2xl font-bold text-amber-700 dark:text-amber-300 border-3 border-amber-400 dark:border-amber-600">
							{{ getInitials(leaderboard.data.leaderboard[0]?.employee_name) }}
						</div>
						<div class="bg-amber-500 text-white w-full rounded-t-lg mt-2 py-6 text-center">
							<div class="text-xl font-bold">1</div>
						</div>
						<div class="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1 text-center truncate w-full">
							{{ leaderboard.data.leaderboard[0]?.employee_name?.split(' ')[0] }}
						</div>
						<div class="text-xs font-bold text-amber-600 dark:text-amber-300">{{ leaderboard.data.leaderboard[0]?.total_points }}pts</div>
					</div>

					<!-- 3rd Place -->
					<div class="flex flex-col items-center w-24">
						<div class="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center text-xl font-bold text-orange-600 dark:text-orange-300 border-3 border-orange-400 dark:border-orange-600">
							{{ getInitials(leaderboard.data.leaderboard[2]?.employee_name) }}
						</div>
						<div class="bg-orange-400 text-white w-full rounded-t-lg mt-2 py-3 text-center">
							<div class="text-lg font-bold">3</div>
						</div>
						<div class="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 text-center truncate w-full">
							{{ leaderboard.data.leaderboard[2]?.employee_name?.split(' ')[0] }}
						</div>
						<div class="text-xs text-gray-700 dark:text-gray-400">{{ leaderboard.data.leaderboard[2]?.total_points }}pts</div>
					</div>
				</div>

				<!-- My Rank -->
				<div v-if="leaderboard.data?.my_rank" class="bg-icd-50 dark:bg-icd-900/30 border border-icd-200 dark:border-icd-700 rounded-xl p-4 flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-icd-600 text-white flex items-center justify-center font-bold text-sm">
						#{{ leaderboard.data.my_rank.rank }}
					</div>
					<div class="flex-1">
						<div class="text-sm font-semibold text-icd-900 dark:text-icd-100">{{ __("Your Rank") }}</div>
						<div class="text-xs text-icd-600 dark:text-icd-300">{{ leaderboard.data.my_rank.total_points }} {{ __("points") }}</div>
					</div>
					<div class="text-right">
						<div class="text-sm font-bold text-icd-800 dark:text-icd-200">{{ leaderboard.data.my_rank.on_time_days }}d</div>
						<div class="text-xs text-icd-500 dark:text-icd-400">{{ __("on time") }}</div>
					</div>
				</div>

				<!-- Full List -->
				<div class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
					<div
						v-for="(entry, idx) in leaderboard.data?.leaderboard?.slice(3)"
						:key="entry.employee"
						class="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-white/10 last:border-0"
					>
						<div class="w-8 text-center text-sm font-bold text-gray-600 dark:text-gray-500">
							{{ idx + 4 }}
						</div>
						<div class="w-9 h-9 rounded-full bg-icd-100 dark:bg-icd-800/40 flex items-center justify-center text-sm font-semibold text-icd-700 dark:text-icd-200">
							{{ getInitials(entry.employee_name) }}
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ entry.employee_name }}</div>
							<div class="text-xs text-gray-600 dark:text-gray-500">{{ entry.department }}</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ entry.total_points }}</div>
							<div class="text-xs text-gray-600 dark:text-gray-500">pts</div>
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
const dayjs = inject("$dayjs")

const selectedPeriod = ref("monthly")
const periods = [
	{ label: __("Weekly"), value: "weekly" },
	{ label: __("Monthly"), value: "monthly" },
	{ label: __("Yearly"), value: "yearly" },
]

const leaderboard = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_leaderboard",
	auto: true,
	makeParams() {
		return {
			period: selectedPeriod.value,
			month: dayjs().month() + 1,
			year: dayjs().year(),
			limit: 20,
		}
	},
})

watch(selectedPeriod, () => {
	leaderboard.reload()
})

function getInitials(name) {
	if (!name) return "?"
	return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}
</script>
