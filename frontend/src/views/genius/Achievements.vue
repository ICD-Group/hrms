<template>
	<BaseLayout :pageTitle="__('Achievements')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Unread Achievements -->
				<div v-if="unreadAchievements.length > 0">
					<div class="section-title mb-3">{{ __("New Achievements") }}</div>
					<div class="flex flex-col gap-3">
						<div
							v-for="a in unreadAchievements"
							:key="a.name"
							class="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex items-center gap-3"
						>
							<div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center text-2xl animate-bounce-slow">
								{{ getAchievementEmoji(a.achievement_type) }}
							</div>
							<div class="flex-1">
								<div class="text-sm font-bold text-amber-800 dark:text-amber-200">{{ a.title }}</div>
								<div class="text-xs text-amber-600 dark:text-amber-300 mt-0.5">{{ a.description }}</div>
								<div class="text-xs text-amber-500 dark:text-amber-400 mt-1">{{ formatDate(a.created) }}</div>
							</div>
							<div v-if="a.points" class="bg-amber-500 text-white rounded-full px-3 py-1 text-xs font-bold">
								+{{ a.points }}
							</div>
						</div>
					</div>
				</div>

				<!-- All Achievements Timeline -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<div class="section-title">{{ __("Timeline") }}</div>
						<button
							v-if="hasUnread"
							@click="markAllRead"
							class="text-xs text-icd-600 dark:text-icd-300 font-medium"
						>
							{{ __("Mark all read") }}
						</button>
					</div>

					<div v-if="achievements.data?.notifications?.length > 0" class="relative">
						<!-- Timeline line -->
						<div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/15"></div>

						<div
							v-for="(a, idx) in achievements.data.notifications"
							:key="a.name || idx"
							class="relative flex gap-3 pb-4"
						>
							<!-- Timeline dot -->
							<div class="w-10 flex-shrink-0 flex justify-center">
								<div
									class="w-3 h-3 rounded-full mt-1.5 z-10"
									:class="a.read ? 'bg-gray-300 dark:bg-white/20' : 'bg-icd-500'"
								></div>
							</div>

							<!-- Content -->
							<div class="flex-1 bg-white dark:bg-white/10 rounded-xl p-3 shadow-sm dark:shadow-none">
								<div class="flex items-center gap-2">
									<span class="text-lg">{{ getAchievementEmoji(a.achievement_type) }}</span>
									<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ a.title }}</div>
								</div>
								<div class="text-xs text-gray-700 dark:text-gray-400 mt-1">{{ a.description }}</div>
								<div class="flex items-center justify-between mt-2">
									<div class="text-xs text-gray-600 dark:text-gray-500">{{ formatRelative(a.created) }}</div>
									<div v-if="a.points" class="text-xs font-bold text-green-600 dark:text-green-300">+{{ a.points }}pts</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Empty State -->
					<div v-else-if="!achievements.loading" class="text-center py-10">
						<div class="text-4xl mb-3">&#x1F3C6;</div>
						<div class="text-gray-700 dark:text-gray-400">{{ __("No achievements yet") }}</div>
						<div class="text-xs text-gray-600 dark:text-gray-500 mt-1">{{ __("Your milestones will appear here") }}</div>
					</div>
				</div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { computed, inject, watch } from "vue"
import { createResource } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import soundManager from "@/utils/sounds"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const achievements = createResource({
	url: `${API_BASE}.gamification.get_achievement_notifications`,
	auto: true,
	makeParams() {
		return { employee: employee.data?.name, mark_read: 0 }
	},
})

const unreadAchievements = computed(() => {
	if (!achievements.data?.notifications) return []
	return achievements.data.notifications.filter(a => !a.read)
})

const hasUnread = computed(() => unreadAchievements.value.length > 0)

// Play achievement fanfare when new achievements are loaded
watch(unreadAchievements, (newVal) => {
	if (newVal && newVal.length > 0) {
		soundManager.playAchievement()
	}
})

function markAllRead() {
	const markRead = createResource({
		url: `${API_BASE}.gamification.get_achievement_notifications`,
		makeParams() {
			return { employee: employee.data?.name, mark_read: 1 }
		},
		onSuccess() {
			achievements.reload()
		},
	})
	markRead.submit()
}

function getAchievementEmoji(type) {
	const map = {
		"badge_earned": "\u{1F3C5}",
		"streak_milestone": "\u{1F525}",
		"points_milestone": "\u{2B50}",
		"rank_change": "\u{1F4C8}",
		"challenge_completed": "\u{1F3C6}",
		"perfect_week": "\u{1F4AA}",
		"perfect_month": "\u{1F451}",
		"early_bird": "\u{1F426}",
	}
	return map[type] || "\u{1F389}"
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function formatRelative(date) {
	if (!date) return ""
	const d = dayjs(date)
	const now = dayjs()
	const diff = now.diff(d, "day")
	if (diff === 0) return __("Today")
	if (diff === 1) return __("Yesterday")
	if (diff < 7) return diff + " " + __("days ago")
	return d.format("DD-MM")
}
</script>

<style scoped>
@keyframes bounce-slow {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-4px); }
}
.animate-bounce-slow {
	animation: bounce-slow 2s ease-in-out infinite;
}
</style>
