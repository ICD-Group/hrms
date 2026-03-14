<template>
	<BaseLayout :pageTitle="__('Team Challenges')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Active Challenges -->
				<div v-if="challenges.data?.active_challenges?.length > 0">
					<div class="section-title mb-3">{{ __("Active Challenges") }}</div>
					<div class="flex flex-col gap-3">
						<div
							v-for="ch in challenges.data.active_challenges"
							:key="ch.name"
							class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden"
						>
							<div class="p-4">
								<div class="flex items-start gap-3">
									<div class="w-11 h-11 rounded-full flex items-center justify-center text-xl"
										:class="getChallengeTypeBg(ch.challenge_type)"
									>
										{{ getChallengeEmoji(ch.challenge_type) }}
									</div>
									<div class="flex-1">
										<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ ch.title }}</div>
										<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ ch.description }}</div>
										<div class="flex items-center gap-2 mt-2">
											<div class="text-xs text-gray-600 dark:text-gray-500">
												{{ formatDate(ch.start_date) }} - {{ formatDate(ch.end_date) }}
											</div>
											<div v-if="ch.reward_points" class="bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 rounded-full px-2 py-0.5 text-xs font-bold">
												+{{ ch.reward_points }}pts
											</div>
										</div>
									</div>
								</div>

								<!-- Progress -->
								<div class="mt-3">
									<div class="flex justify-between text-xs mb-1">
										<span class="text-gray-700 dark:text-gray-400">{{ __("Progress") }}</span>
										<span class="font-semibold text-gray-700 dark:text-gray-300">{{ ch.progress || 0 }}%</span>
									</div>
									<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-2">
										<div
											class="h-2 rounded-full transition-all duration-700"
											:class="ch.progress >= 100 ? 'bg-green-500' : 'bg-icd-500'"
											:style="{ width: Math.min(ch.progress || 0, 100) + '%' }"
										></div>
									</div>
								</div>

								<!-- Participants -->
								<div v-if="ch.participants?.length > 0" class="flex items-center gap-1 mt-3">
									<div
										v-for="(p, idx) in ch.participants.slice(0, 5)"
										:key="idx"
										class="w-7 h-7 rounded-full bg-icd-100 dark:bg-icd-800/40 flex items-center justify-center text-xs font-semibold text-icd-700 dark:text-icd-200 -ml-1 first:ml-0 border-2 border-white dark:border-white/20"
									>
										{{ getInitials(p.employee_name) }}
									</div>
									<div v-if="ch.participants.length > 5" class="text-xs text-gray-600 dark:text-gray-500 ml-1">
										+{{ ch.participants.length - 5 }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Completed Challenges -->
				<div v-if="challenges.data?.completed_challenges?.length > 0">
					<div class="section-title mb-3">{{ __("Completed") }}</div>
					<div class="flex flex-col gap-2">
						<div
							v-for="ch in challenges.data.completed_challenges"
							:key="ch.name"
							class="bg-gray-100 dark:bg-white/5 rounded-xl p-4 flex items-center gap-3"
						>
							<div class="text-xl">&#x2705;</div>
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ ch.title }}</div>
								<div class="text-xs text-gray-600 dark:text-gray-500">{{ __("Completed") }} {{ formatDate(ch.completed_date) }}</div>
							</div>
							<div v-if="ch.reward_points" class="text-sm font-bold text-green-600">+{{ ch.reward_points }}</div>
						</div>
					</div>
				</div>

				<!-- Empty State -->
				<div v-if="!challenges.loading && !challenges.data?.active_challenges?.length && !challenges.data?.completed_challenges?.length" class="text-center py-10">
					<div class="text-4xl mb-3">&#x1F3C1;</div>
					<div class="text-gray-700 dark:text-gray-400">{{ __("No active challenges") }}</div>
					<div class="text-xs text-gray-600 dark:text-gray-500 mt-1">{{ __("New challenges will appear here") }}</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject } from "vue"
import { createResource } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const challenges = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_team_challenges",
	auto: true,
	cache: "genius:challenges",
})

function getChallengeEmoji(type) {
	const map = {
		"Attendance": "\u{1F3AF}",
		"Punctuality": "\u{23F0}",
		"Team": "\u{1F91D}",
		"Streak": "\u{1F525}",
		"Performance": "\u{1F4AA}",
	}
	return map[type] || "\u{1F3C1}"
}

function getChallengeTypeBg(type) {
	const map = {
		"Attendance": "bg-green-100 dark:bg-green-800/40",
		"Punctuality": "bg-icd-100 dark:bg-icd-800/40",
		"Team": "bg-purple-100 dark:bg-purple-900/30",
		"Streak": "bg-orange-100 dark:bg-orange-800/40",
		"Performance": "bg-amber-100 dark:bg-amber-800/40",
	}
	return map[type] || "bg-gray-100 dark:bg-white/10"
}

function getInitials(name) {
	if (!name) return "?"
	return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM")
}
</script>
